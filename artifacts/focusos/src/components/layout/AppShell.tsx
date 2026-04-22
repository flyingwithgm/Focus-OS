import React from 'react';
import { useLocation } from 'wouter';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useStore } from '@/lib/store';
import { LaunchScreen } from './LaunchScreen';
import { Onboarding } from './Onboarding';
import { CommandPalette } from './CommandPalette';
import { DemoTour } from './DemoTour';

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
    return <Onboarding />;
  }

  const isFocusScreen = location === '/focus';

  return (
    <div className="min-h-[100dvh] w-full flex flex-col md:flex-row bg-background text-foreground transition-colors duration-300">
      <CommandPalette />
      <DemoTour />
      {!isFocusScreen && <Sidebar className="hidden md:flex" />}
      
      <div className="flex-1 flex flex-col min-w-0">
        {!isFocusScreen && <Header />}
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6 relative">
          {children}
        </main>
        
        {!isFocusScreen && <BottomNav className="md:hidden fixed bottom-0 left-0 right-0 z-50" />}
      </div>
    </div>
  );
}

