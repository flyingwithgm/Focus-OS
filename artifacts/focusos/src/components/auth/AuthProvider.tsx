import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { browserLocalPersistence, onAuthStateChanged, setPersistence, type User } from 'firebase/auth';
import { auth, firebaseEnabled } from '@/lib/firebase';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  firebaseEnabled: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  firebaseEnabled,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(firebaseEnabled);

  useEffect(() => {
    const firebaseAuth = auth;

    if (!firebaseAuth) {
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | undefined;

    setPersistence(firebaseAuth, browserLocalPersistence)
      .catch((error) => {
        console.error('Failed to set auth persistence', error);
      })
      .finally(() => {
        unsubscribe = onAuthStateChanged(firebaseAuth, (nextUser) => {
          setUser(nextUser);
          setLoading(false);
        });
      });

    return () => unsubscribe?.();
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      firebaseEnabled,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
