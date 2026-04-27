import { useEffect, useMemo, useRef, useState } from 'react';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  writeBatch,
  type CollectionReference,
  type DocumentData,
} from 'firebase/firestore';
import { useAuth } from './AuthProvider';
import { db } from '@/lib/firebase';
import { defaultProfile, useStore } from '@/lib/store';
import type {
  Block,
  Course,
  Event,
  MoodLog,
  Notification,
  Profile,
  Semester,
  Session,
  Task,
} from '@/lib/types';

type SyncEntity = {
  id: string;
};

interface CollectionSyncConfig<T extends SyncEntity> {
  label: string;
  localItems: T[];
  replaceItems: (items: T[]) => void;
  collectionRef: CollectionReference<DocumentData> | null;
  sortField: keyof T & string;
  normalizeItem?: (item: T) => T;
}

const profileSignature = (profile: Profile) => JSON.stringify(profile);

function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefinedDeep(item)) as T;
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, nestedValue]) => nestedValue !== undefined)
        .map(([key, nestedValue]) => [key, stripUndefinedDeep(nestedValue)])
    ) as T;
  }

  return value;
}

const stableSignature = <T extends SyncEntity>(items: T[], normalizeItem: (item: T) => T) =>
  JSON.stringify(
    [...items]
      .map(normalizeItem)
      .sort((a, b) => a.id.localeCompare(b.id))
  );

const createBootstrapProfile = (displayName?: string | null): Profile => ({
  ...defaultProfile,
  name: displayName || defaultProfile.name,
  onboardingDone: true,
});

const normalizeProfile = (value: unknown, fallbackName?: string | null): Profile => {
  const candidate = typeof value === 'object' && value !== null ? (value as Partial<Profile>) : {};
  return {
    ...defaultProfile,
    ...candidate,
    name: candidate.name ?? fallbackName ?? defaultProfile.name,
    preferences: {
      ...defaultProfile.preferences,
      ...candidate.preferences,
      notifications: {
        ...defaultProfile.preferences.notifications,
        ...candidate.preferences?.notifications,
      },
    },
    streak: {
      ...defaultProfile.streak,
      ...candidate.streak,
    },
    badges: candidate.badges ?? defaultProfile.badges,
  };
};

const normalizeTask = (task: Task): Task => ({
  ...stripUndefinedDeep(task),
  subtasks: task.subtasks ?? [],
});

const normalizeCourse = (course: Course): Course => stripUndefinedDeep(course);
const normalizeEvent = (event: Event): Event => stripUndefinedDeep(event);
const normalizeBlock = (block: Block): Block => stripUndefinedDeep(block);
const normalizeSession = (session: Session): Session => stripUndefinedDeep(session);
const normalizeMoodLog = (moodLog: MoodLog): MoodLog => stripUndefinedDeep(moodLog);
const normalizeSemester = (semester: Semester): Semester => stripUndefinedDeep(semester);
const normalizeNotification = (notification: Notification): Notification => stripUndefinedDeep(notification);

const identity = <T,>(value: T) => value;

function useCollectionSync<T extends SyncEntity>({
  label,
  localItems,
  replaceItems,
  collectionRef,
  sortField,
  normalizeItem = identity,
}: CollectionSyncConfig<T>) {
  const [ready, setReady] = useState(false);
  const localItemsRef = useRef(localItems);
  const lastSignatureRef = useRef('');
  const remoteIdsRef = useRef<string[]>([]);
  const applyingRemoteSnapshotRef = useRef(false);

  useEffect(() => {
    localItemsRef.current = localItems;
  }, [localItems]);

  useEffect(() => {
    if (!collectionRef) {
      setReady(false);
      lastSignatureRef.current = '';
      remoteIdsRef.current = [];
      applyingRemoteSnapshotRef.current = false;
      return;
    }

    let cancelled = false;

    const bootstrap = async () => {
      const initialItems = localItemsRef.current.map(normalizeItem);
      const snapshot = await getDocs(collectionRef);

      if (!snapshot.empty || initialItems.length === 0) {
        return;
      }

      const batch = writeBatch(collectionRef.firestore);
      initialItems.forEach((item) => {
        batch.set(doc(collectionRef, item.id), item, { merge: true });
      });
      await batch.commit();
    };

    bootstrap().catch((error) => {
      console.error(`Failed to bootstrap ${label}`, error);
    });

    const unsubscribe = onSnapshot(query(collectionRef, orderBy(sortField)), (snapshot) => {
      if (cancelled) return;

      const remoteItems = snapshot.docs.map((itemDoc) => normalizeItem(itemDoc.data() as T));
      remoteIdsRef.current = remoteItems.map((item) => item.id);
      lastSignatureRef.current = stableSignature(remoteItems, normalizeItem);
      applyingRemoteSnapshotRef.current = true;
      replaceItems(remoteItems);

      setReady(true);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [collectionRef, label, normalizeItem, replaceItems, sortField]);

  useEffect(() => {
    if (!collectionRef || !ready) return;

    const normalizedItems = localItems.map(normalizeItem);
    const serialized = stableSignature(normalizedItems, normalizeItem);

    if (applyingRemoteSnapshotRef.current) {
      if (serialized === lastSignatureRef.current) {
        applyingRemoteSnapshotRef.current = false;
      }
      return;
    }

    if (serialized === lastSignatureRef.current) return;

    lastSignatureRef.current = serialized;

    const syncItems = async () => {
      const batch = writeBatch(collectionRef.firestore);
      const currentIds = new Set(normalizedItems.map((item) => item.id));

      normalizedItems.forEach((item) => {
        batch.set(doc(collectionRef, item.id), item, { merge: true });
      });

      remoteIdsRef.current
        .filter((remoteId) => !currentIds.has(remoteId))
        .forEach((remoteId) => {
          batch.delete(doc(collectionRef, remoteId));
        });

      await batch.commit();
    };

    syncItems().catch((error) => {
      console.error(`Failed to sync ${label}`, error);
    });
  }, [collectionRef, label, localItems, normalizeItem, ready]);
}

export function FirebaseSync() {
  const { user } = useAuth();
  const profile = useStore((state) => state.profile);
  const tasks = useStore((state) => state.tasks);
  const courses = useStore((state) => state.courses);
  const events = useStore((state) => state.events);
  const blocks = useStore((state) => state.blocks);
  const sessions = useStore((state) => state.sessions);
  const moodLogs = useStore((state) => state.moodLogs);
  const semesters = useStore((state) => state.semesters);
  const notifications = useStore((state) => state.notifications);

  const replaceProfile = useStore((state) => state.replaceProfile);
  const replaceTasks = useStore((state) => state.replaceTasks);
  const replaceCourses = useStore((state) => state.replaceCourses);
  const replaceEvents = useStore((state) => state.replaceEvents);
  const replaceBlocks = useStore((state) => state.replaceBlocks);
  const replaceSessions = useStore((state) => state.replaceSessions);
  const replaceMoodLogs = useStore((state) => state.replaceMoodLogs);
  const replaceSemesters = useStore((state) => state.replaceSemesters);
  const replaceNotifications = useStore((state) => state.replaceNotifications);

  const [profileReady, setProfileReady] = useState(false);
  const localProfileRef = useRef(profile);
  const lastProfileSignatureRef = useRef('');
  const applyingRemoteProfileRef = useRef(false);

  useEffect(() => {
    localProfileRef.current = profile;
  }, [profile]);

  const profileDocRef = useMemo(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid, 'meta', 'profile');
  }, [user]);

  const tasksCollectionRef = useMemo(() => {
    if (!db || !user) return null;
    return collection(db, 'users', user.uid, 'tasks');
  }, [user]);

  const coursesCollectionRef = useMemo(() => {
    if (!db || !user) return null;
    return collection(db, 'users', user.uid, 'courses');
  }, [user]);

  const eventsCollectionRef = useMemo(() => {
    if (!db || !user) return null;
    return collection(db, 'users', user.uid, 'events');
  }, [user]);

  const blocksCollectionRef = useMemo(() => {
    if (!db || !user) return null;
    return collection(db, 'users', user.uid, 'blocks');
  }, [user]);

  const sessionsCollectionRef = useMemo(() => {
    if (!db || !user) return null;
    return collection(db, 'users', user.uid, 'sessions');
  }, [user]);

  const moodLogsCollectionRef = useMemo(() => {
    if (!db || !user) return null;
    return collection(db, 'users', user.uid, 'moodLogs');
  }, [user]);

  const semestersCollectionRef = useMemo(() => {
    if (!db || !user) return null;
    return collection(db, 'users', user.uid, 'semesters');
  }, [user]);

  const notificationsCollectionRef = useMemo(() => {
    if (!db || !user) return null;
    return collection(db, 'users', user.uid, 'notifications');
  }, [user]);

  useEffect(() => {
    if (!user || !profileDocRef) {
      setProfileReady(false);
      lastProfileSignatureRef.current = '';
      applyingRemoteProfileRef.current = false;
      return;
    }

    let cancelled = false;

    const bootstrap = async () => {
      const initialProfile = localProfileRef.current;
      const existingProfileSnapshot = await getDoc(profileDocRef);

      if (existingProfileSnapshot.exists()) {
        return;
      }

      const nextProfile = createBootstrapProfile(user.displayName || initialProfile.name);
      const sanitizedProfile = stripUndefinedDeep(nextProfile);
      await setDoc(profileDocRef, sanitizedProfile);
      lastProfileSignatureRef.current = profileSignature(sanitizedProfile);
      replaceProfile(sanitizedProfile);
    };

    bootstrap().catch((error) => {
      console.error('Failed to bootstrap Firebase profile', error);
    });

    const unsubscribe = onSnapshot(profileDocRef, (snapshot) => {
      if (cancelled) return;

      const nextProfile = normalizeProfile(snapshot.data(), user.displayName);
      lastProfileSignatureRef.current = profileSignature(nextProfile);
      applyingRemoteProfileRef.current = true;
      replaceProfile(nextProfile);
      setProfileReady(true);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [profileDocRef, replaceProfile, user]);

  useEffect(() => {
    if (!profileDocRef || !profileReady) return;

    const serialized = profileSignature(profile);

    if (applyingRemoteProfileRef.current) {
      if (serialized === lastProfileSignatureRef.current) {
        applyingRemoteProfileRef.current = false;
      }
      return;
    }

    if (serialized === lastProfileSignatureRef.current) return;

    lastProfileSignatureRef.current = serialized;
    setDoc(profileDocRef, stripUndefinedDeep(profile), { merge: true }).catch((error) => {
      console.error('Failed to sync profile', error);
    });
  }, [profile, profileDocRef, profileReady]);

  useCollectionSync<Task>({
    label: 'tasks',
    localItems: tasks,
    replaceItems: replaceTasks,
    collectionRef: tasksCollectionRef,
    sortField: 'createdAt',
    normalizeItem: normalizeTask,
  });

  useCollectionSync<Course>({
    label: 'courses',
    localItems: courses,
    replaceItems: replaceCourses,
    collectionRef: coursesCollectionRef,
    sortField: 'code',
    normalizeItem: normalizeCourse,
  });

  useCollectionSync<Event>({
    label: 'events',
    localItems: events,
    replaceItems: replaceEvents,
    collectionRef: eventsCollectionRef,
    sortField: 'start',
    normalizeItem: normalizeEvent,
  });

  useCollectionSync<Block>({
    label: 'blocks',
    localItems: blocks,
    replaceItems: replaceBlocks,
    collectionRef: blocksCollectionRef,
    sortField: 'start',
    normalizeItem: normalizeBlock,
  });

  useCollectionSync<Session>({
    label: 'sessions',
    localItems: sessions,
    replaceItems: replaceSessions,
    collectionRef: sessionsCollectionRef,
    sortField: 'startedAt',
    normalizeItem: normalizeSession,
  });

  useCollectionSync<MoodLog>({
    label: 'mood logs',
    localItems: moodLogs,
    replaceItems: replaceMoodLogs,
    collectionRef: moodLogsCollectionRef,
    sortField: 'date',
    normalizeItem: normalizeMoodLog,
  });

  useCollectionSync<Semester>({
    label: 'semesters',
    localItems: semesters,
    replaceItems: replaceSemesters,
    collectionRef: semestersCollectionRef,
    sortField: 'label',
    normalizeItem: normalizeSemester,
  });

  useCollectionSync<Notification>({
    label: 'notifications',
    localItems: notifications,
    replaceItems: replaceNotifications,
    collectionRef: notificationsCollectionRef,
    sortField: 'scheduledFor',
    normalizeItem: normalizeNotification,
  });

  return null;
}
