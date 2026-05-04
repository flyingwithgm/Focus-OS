import { Switch, Route, Router as WouterRouter } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { ToastAction } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Spinner } from "@/components/ui/spinner";
import NotFound from "@/pages/not-found";
import { Suspense, lazy, useEffect, useRef } from "react";
import { requestPermission, scheduleAll } from "@/lib/notifications";
import { useStore } from "@/lib/store";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { AuthGate } from "@/components/auth/AuthGate";
import { FirebaseSync } from "@/components/auth/FirebaseSync";
import { toast } from "@/hooks/use-toast";
import { registerSW } from "virtual:pwa-register";

import { AppShell } from "@/components/layout/AppShell";

const Home = lazy(() => import("@/pages/Home"));
const Plan = lazy(() => import("@/pages/Plan"));
const Calendar = lazy(() => import("@/pages/Calendar"));
const Schedule = lazy(() => import("@/pages/Schedule"));
const Analytics = lazy(() => import("@/pages/Analytics"));
const Gpa = lazy(() => import("@/pages/Gpa"));
const Hub = lazy(() => import("@/pages/Hub"));
const Profile = lazy(() => import("@/pages/Profile"));
const Focus = lazy(() => import("@/pages/Focus"));

function RouteFallback() {
  return (
    <div className="min-h-[40dvh] flex items-center justify-center">
      <div className="glass rounded-2xl px-5 py-4 flex items-center gap-3 text-sm text-muted-foreground">
        <Spinner className="size-5" />
        Loading workspace...
      </div>
    </div>
  );
}

function Router() {
  return (
    <AppShell>
      <Suspense fallback={<RouteFallback />}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/plan" component={Plan} />
          <Route path="/calendar" component={Calendar} />
          <Route path="/schedule" component={Schedule} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/gpa" component={Gpa} />
          <Route path="/hub" component={Hub} />
          <Route path="/profile" component={Profile} />
          <Route path="/focus" component={Focus} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </AppShell>
  );
}

function PwaUpdateBridge() {
  const hasShownUpdateToast = useRef(false);

  useEffect(() => {
    const updateServiceWorker = registerSW({
      immediate: true,
      onNeedRefresh() {
        if (hasShownUpdateToast.current) {
          return;
        }

        hasShownUpdateToast.current = true;
        toast({
          title: "Update ready",
          description: "A newer version of FocusOS is available on this device.",
          duration: Infinity,
          action: (
            <ToastAction altText="Refresh the app" onClick={() => updateServiceWorker(true)}>
              Refresh
            </ToastAction>
          ),
        });
      },
    });

    return () => {
      hasShownUpdateToast.current = false;
    };
  }, []);

  return null;
}

function App() {
  const store = useStore();

  useEffect(() => {
    requestPermission();
  }, []);

  useEffect(() => {
    scheduleAll();
  }, [store.tasks, store.events, store.profile.preferences.notifications]);

  useEffect(() => {
    const root = document.documentElement;
    if (store.profile.preferences.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    if (store.profile.preferences.highContrast) {
      root.classList.add('hc');
    } else {
      root.classList.remove('hc');
    }
    
    if (store.profile.preferences.fontSize === 'large') {
      root.classList.add('text-lg-mode');
    } else {
      root.classList.remove('text-lg-mode');
    }
  }, [store.profile.preferences.theme, store.profile.preferences.highContrast, store.profile.preferences.fontSize]);

  return (
    <AuthProvider>
      <TooltipProvider>
        <AuthGate>
          <FirebaseSync />
          <PwaUpdateBridge />
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </AuthGate>
        <Toaster />
      </TooltipProvider>
    </AuthProvider>
  );
}

export default App;
