import { Switch, Route, Router as WouterRouter } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

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
