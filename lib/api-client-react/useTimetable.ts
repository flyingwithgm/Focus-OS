import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { ClassSessionSchema, type ClassSession } from '@workspace/api-zod';
// Assuming your firebase config is exported from lib/db
import { db } from '@workspace/db'; 

export function useTimetableSync(userId: string) {
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) return;

    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const q = query(collection(db, `users/${userId}/classSessions`));

    // 2. Set up the real-time listener
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatedClasses = snapshot.docs.map(doc => {
        const data = doc.data();
        // 3. Validate data with Zod before putting it in state
        const result = ClassSessionSchema.safeParse({ id: doc.id, ...data });
        if (!result.success) {
          console.error(`❌ Focus-OS Data Error [${doc.id}]:`, result.error.format());
          return null;
        }
        return result.data;
      })
      .filter((c): c is ClassSession => c !== null)
      // 4. Sort by Day, then by Start Time
      .sort((a, b) => {
        const dayDiff = dayOrder.indexOf(a.dayOfWeek) - dayOrder.indexOf(b.dayOfWeek);
        if (dayDiff !== 0) return dayDiff;
        return a.startTime.localeCompare(b.startTime);
      });

      setClasses(updatedClasses);
      setLoading(false);
    }, (error) => {
      console.error("Timetable sync failed:", error);
      setError(error as Error);
    });

    return () => unsubscribe();
  }, [userId]);

  return { classes, loading, error };
}