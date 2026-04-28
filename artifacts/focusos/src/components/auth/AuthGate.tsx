import React from 'react';
import { LogIn, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { AuthScreen } from './AuthScreen';
import { useAuth } from './AuthProvider';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, firebaseEnabled } = useAuth();

  if (!firebaseEnabled) {
    const envVars = [
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_AUTH_DOMAIN',
      'VITE_FIREBASE_PROJECT_ID',
      'VITE_FIREBASE_STORAGE_BUCKET',
      'VITE_FIREBASE_MESSAGING_SENDER_ID',
      'VITE_FIREBASE_APP_ID',
    ];

    return (
      <div className="flex min-h-[100dvh] items-center justify-center px-4 py-10">
        <div className="section-card w-full max-w-2xl space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-warning/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-warning">
            <Settings2 className="h-3.5 w-3.5" />
            Firebase setup needed
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Add your Firebase web config to continue.</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Auth is wired in, but we need your project keys in Vite env vars before the sign-in flow can boot.
            </p>
          </div>
          <div className="rounded-2xl bg-background/50 p-4 text-sm text-muted-foreground">
            {envVars.map((envVar) => (
              <div key={envVar} className="font-mono">
                {envVar}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center px-4">
        <div className="section-card flex items-center gap-3 text-sm text-muted-foreground">
          <Spinner className="size-5" />
          Restoring your workspace...
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return <>{children}</>;
}
