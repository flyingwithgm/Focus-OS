import React, { Suspense, lazy } from 'react';
import { useLocation } from 'wouter';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useStore } from '@/lib/store';
import { LaunchScreen } from './LaunchScreen';

const BottomNav = lazy(() => import('./BottomNav').then((module) => ({ default: module.BottomNav })));
const Onboarding = lazy(() => import('./Onboarding').then((module) => ({ default: module.Onboarding })));
const CommandPalette = lazy(() => import('./CommandPalette').then((module) => ({ default: module.CommandPalette })));
const DemoTour = lazy(() => import('./DemoTour').then((module) => ({ default: module.DemoTour })));

export function AppShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const profile = useStore(state => state.profile);
  const activeFocusSessionId = useStore(state => state.activeFocusSessionId);

  const [showLaunch, setShowLaunch] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setShowLaunch(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (showLaunch) {
    return <LaunchScreen />;
  }

  if (!profile.onboardingDone) {
    return (
      <Suspense fallback={null}>
        <Onboarding />
      </Suspense>
    );
  }

  const isFocusScreen = location === '/focus';

  return (
    <div className="min-h-[100dvh] w-full flex flex-col md:flex-row bg-background text-foreground transition-colors duration-300">
      <Suspense fallback={null}>
        <CommandPalette />
        <DemoTour />
      </Suspense>
      {!isFocusScreen && <Sidebar className="hidden md:flex" />}
      
      <div className="flex-1 flex flex-col min-w-0">
        {!isFocusScreen && <Header />}
        
        <main className="relative flex-1 overflow-y-auto p-4 pb-28 md:p-6 md:pb-6">
          {children}
        </main>
        
        {!isFocusScreen && (
          <Suspense fallback={null}>
            <BottomNav className="md:hidden fixed bottom-0 left-0 right-0 z-50" />
          </Suspense>
        )}
      </div>
    </div>
  );
}
