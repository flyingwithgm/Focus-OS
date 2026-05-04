import React, { useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  getRedirectResult,
  signInWithRedirect,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { Loader2, Mail, ShieldCheck } from 'lucide-react';
import { auth, googleProvider } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';

type AuthMode = 'signin' | 'signup';
const GOOGLE_REDIRECT_PENDING_KEY = 'focusos.googleRedirectPending';

function mapAuthError(error: unknown) {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = String((error as { code?: string }).code);

    switch (code) {
      case 'auth/invalid-credential':
        return 'That email/password combo does not look right.';
      case 'auth/invalid-email':
        return 'That email address looks invalid.';
      case 'auth/missing-email':
        return 'Enter your email address.';
      case 'auth/missing-password':
        return 'Enter your password.';
      case 'auth/email-already-in-use':
        return 'That email is already in use. Try signing in instead.';
      case 'auth/user-not-found':
        return 'No account exists for that email yet.';
      case 'auth/wrong-password':
        return 'That password does not match this account.';
      case 'auth/weak-password':
        return 'Use a stronger password.';
      case 'auth/popup-closed-by-user':
        return 'The Google sign-in popup was closed before finishing.';
      case 'auth/operation-not-allowed':
        return 'This sign-in method is disabled in Firebase Authentication.';
      case 'auth/popup-blocked':
      case 'auth/cancelled-popup-request':
        return 'The browser blocked the sign-in popup. Try again or use redirect sign-in.';
      case 'auth/network-request-failed':
        return 'The network request failed. Check your connection and Firebase auth domain setup.';
      case 'auth/too-many-requests':
        return 'Too many attempts were made. Wait a moment, then try again.';
      case 'auth/account-exists-with-different-credential':
        return 'This email already exists with a different sign-in method.';
      case 'auth/unauthorized-domain':
      case 'auth/requests-from-referer-are-blocked':
        return 'This site domain is not authorized in Firebase Authentication yet.';
      default:
        break;
    }
  }

  return error instanceof Error ? error.message : 'Authentication failed.';
}

export function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleRedirecting, setGoogleRedirecting] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.sessionStorage.getItem(GOOGLE_REDIRECT_PENDING_KEY) === 'true';
  });

  const title = useMemo(
    () => (mode === 'signin' ? 'Welcome back' : 'Create your workspace'),
    [mode]
  );

  React.useEffect(() => {
    if (!auth) return;

    const redirectPending = window.sessionStorage.getItem(GOOGLE_REDIRECT_PENDING_KEY) === 'true';
    if (redirectPending) {
      setGoogleRedirecting(true);
    }

    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          window.sessionStorage.removeItem(GOOGLE_REDIRECT_PENDING_KEY);
          toast.success('Signed in with Google.');
        }
      })
      .catch((error) => {
        window.sessionStorage.removeItem(GOOGLE_REDIRECT_PENDING_KEY);
        toast.error(mapAuthError(error));
      })
      .finally(() => {
        window.sessionStorage.removeItem(GOOGLE_REDIRECT_PENDING_KEY);
        setGoogleRedirecting(false);
      });
  }, []);

  const handleEmailAuth = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();

    if (!auth) {
      toast.error('Firebase auth is not configured yet.');
      return;
    }

    if (!email.trim() || !password.trim()) {
      toast.error('Enter your email and password.');
      return;
    }

    if (mode === 'signup' && !name.trim()) {
      toast.error('Add your name so we can set up your workspace.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'signin') {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        toast.success('Signed in.');
      } else {
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (name.trim()) {
          await updateProfile(credential.user, { displayName: name.trim() });
        }
        toast.success('Account created.');
      }
    } catch (error) {
      toast.error(mapAuthError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (!auth || !googleProvider) {
      toast.error('Google sign-in is not configured yet.');
      return;
    }

    setSubmitting(true);
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Signed in with Google.');
    } catch (error) {
      const code =
        typeof error === 'object' && error !== null && 'code' in error
          ? String((error as { code?: string }).code)
          : '';

      if (
        code === 'auth/popup-blocked' ||
        code === 'auth/cancelled-popup-request'
      ) {
        try {
          window.sessionStorage.setItem(GOOGLE_REDIRECT_PENDING_KEY, 'true');
          setGoogleRedirecting(true);
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectError) {
          window.sessionStorage.removeItem(GOOGLE_REDIRECT_PENDING_KEY);
          setGoogleRedirecting(false);
          toast.error(mapAuthError(redirectError));
          return;
        }
      }

      toast.error(mapAuthError(error));
    } finally {
      setSubmitting(false);
    }
  };

  if (googleRedirecting) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center px-4">
        <div className="section-card flex w-full max-w-md items-center gap-3 text-sm text-muted-foreground">
          <Spinner className="size-5" />
          Finishing Google sign-in...
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="section-card flex flex-col justify-between overflow-hidden">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              <ShieldCheck className="h-3.5 w-3.5" />
              FocusOS Cloud
            </div>
            <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
              Save your system, sync it everywhere, and keep your momentum.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
              Sign in once and keep your planning, schedule, focus history, and GPA workspace
              available anywhere you open FocusOS.
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="metric-card">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Auth</p>
              <p className="mt-2 text-xl font-bold">Firebase</p>
              <p className="mt-1 text-sm text-muted-foreground">Email/password and Google first.</p>
            </div>
            <div className="metric-card">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Next</p>
              <p className="mt-2 text-xl font-bold">Cloud Sync</p>
              <p className="mt-1 text-sm text-muted-foreground">Tasks, classes, sessions, events, and profile data.</p>
            </div>
            <div className="metric-card">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Goal</p>
              <p className="mt-2 text-xl font-bold">One Workspace</p>
              <p className="mt-1 text-sm text-muted-foreground">The same system across devices.</p>
            </div>
          </div>
        </div>

        <Card className="glass border-white/10">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">{title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {mode === 'signin'
                ? 'Sign in to unlock your synced FocusOS workspace.'
                : 'Create an account so your FocusOS workspace starts syncing with Firebase.'}
            </p>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleEmailAuth}>
            <div className="grid grid-cols-2 rounded-2xl bg-background/50 p-1">
              <Button
                type="button"
                variant={mode === 'signin' ? 'default' : 'ghost'}
                className="rounded-xl"
                onClick={() => setMode('signin')}
              >
                Sign In
              </Button>
              <Button
                type="button"
                variant={mode === 'signup' ? 'default' : 'ghost'}
                className="rounded-xl"
                onClick={() => setMode('signup')}
              >
                Sign Up
              </Button>
            </div>

            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="auth-name">Name</Label>
                <Input
                  id="auth-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                  className="h-12 bg-background/50"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="auth-email">Email</Label>
              <Input
                id="auth-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="h-12 bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="auth-password">Password</Label>
              <Input
                id="auth-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={mode === 'signin' ? 'Enter your password' : 'Create a password'}
                className="h-12 bg-background/50"
              />
            </div>

            <Button type="submit" className="h-12 w-full mint-glow" disabled={submitting || googleRedirecting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
              {mode === 'signin' ? 'Continue with email' : 'Create account'}
            </Button>

            <div className="relative py-1 text-center text-xs uppercase tracking-[0.24em] text-muted-foreground">
              <span className="relative z-10 bg-card px-3">or</span>
              <div className="absolute inset-x-0 top-1/2 -z-0 h-px bg-border" />
            </div>

            <Button
              type="button"
              variant="outline"
              className="h-12 w-full border-white/10 bg-background/30"
              onClick={handleGoogleAuth}
              disabled={submitting || googleRedirecting}
            >
              {googleRedirecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {googleRedirecting ? 'Redirecting to Google...' : 'Continue with Google'}
            </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
