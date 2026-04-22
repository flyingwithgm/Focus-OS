import React from 'react';
import { Bell, Sun, Moon, Search, CheckCircle } from 'lucide-react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';

export function Header() {
  const profile = useStore(state => state.profile);
  const updatePreferences = useStore(state => state.updatePreferences);
  const notifications = useStore(state => state.notifications);
  const markNotificationRead = useStore(state => state.markNotificationRead);
  const clearNotifications = useStore(state => state.clearNotifications);
  
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
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 glass">
            <div className="flex items-center justify-between px-4 py-2">
              <span className="font-bold">Notifications</span>
              {notifications.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearNotifications} className="text-xs h-6">Clear all</Button>
              )}
            </div>
            <DropdownMenuSeparator />
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  All caught up!
                </div>
              ) : (
                notifications.map(n => (
                  <DropdownMenuItem key={n.id} className="flex flex-col items-start p-3 gap-1 cursor-default" onSelect={(e) => {
                    e.preventDefault();
                    if (!n.read) markNotificationRead(n.id);
                  }}>
                    <div className="flex items-center justify-between w-full">
                      <span className={`font-semibold ${n.read ? 'opacity-60' : ''}`}>{n.title}</span>
                      <span className="text-[10px] text-muted-foreground">{format(new Date(n.scheduledFor), 'h:mm a')}</span>
                    </div>
                    <span className={`text-xs ${n.read ? 'text-muted-foreground' : ''}`}>{n.body}</span>
                  </DropdownMenuItem>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" className="rounded-full" onClick={toggleTheme}>
          {profile.preferences.theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
      </div>
    </header>
  );
}

