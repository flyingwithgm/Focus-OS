import { Switch, Route, Router as WouterRouter } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";
import { requestPermission, scheduleAll } from "@/lib/notifications";
import { useStore } from "@/lib/store";

import { AppShell } from "@/components/layout/AppShell";
import Home from "@/pages/Home";
import Plan from "@/pages/Plan";
import Calendar from "@/pages/Calendar";
import Schedule from "@/pages/Schedule";
import Analytics from "@/pages/Analytics";
import Gpa from "@/pages/Gpa";
import Hub from "@/pages/Hub";
import Profile from "@/pages/Profile";
import Focus from "@/pages/Focus";

function Router() {
  return (
    <AppShell>
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
    </AppShell>
  );
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
    <TooltipProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
