import React from 'react';
import { Bell, Sun, Moon, Search } from 'lucide-react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';

export function Header() {
  const profile = useStore(state => state.profile);
  const updatePreferences = useStore(state => state.updatePreferences);
  const notifications = useStore(state => state.notifications);
  
  const unreadCount = notifications.filter(n => !n.read).length;

  const toggleTheme = () => {
    const newTheme = profile.preferences.theme === 'dark' ? 'light' : 'dark';
    updatePreferences({ theme: newTheme });
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-6 glass z-40 sticky top-0">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mint-glow md:hidden">
          <img src="/icon-192.png" alt="Logo" className="w-5 h-5" />
        </div>
        <h1 className="text-xl font-bold tracking-tight md:hidden">FocusOS</h1>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}>
          <Search className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
          )}
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full" onClick={toggleTheme}>
          {profile.preferences.theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
      </div>
    </header>
  );
}
