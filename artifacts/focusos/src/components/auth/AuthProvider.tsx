import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { browserLocalPersistence, onAuthStateChanged, setPersistence, type User } from 'firebase/auth';
import { auth, firebaseEnabled } from '@/lib/firebase';
import { clearFocusOsLocalCache, FOCUSOS_LAST_USER_KEY, useStore } from '@/lib/store';

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
          const resetData = useStore.getState().resetData;
          const previousUserId =
            typeof window === 'undefined'
              ? null
              : window.localStorage.getItem(FOCUSOS_LAST_USER_KEY);

          if (!nextUser) {
            resetData();
            clearFocusOsLocalCache();
          } else if (previousUserId && previousUserId !== nextUser.uid) {
            resetData();
            clearFocusOsLocalCache();
            window.localStorage.setItem(FOCUSOS_LAST_USER_KEY, nextUser.uid);
          } else if (typeof window !== 'undefined') {
            window.localStorage.setItem(FOCUSOS_LAST_USER_KEY, nextUser.uid);
          }

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
