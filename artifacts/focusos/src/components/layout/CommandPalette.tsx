import React, { useState, useEffect } from 'react';
import { Command } from 'cmdk';
import { useStore } from '@/lib/store';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Target, Plus, CheckCircle2, ListTodo, Target as GpaIcon, Settings, Moon, Sun } from 'lucide-react';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const profile = useStore(state => state.profile);
  const updatePreferences = useStore(state => state.updatePreferences);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-background/80 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg glass rounded-2xl overflow-hidden shadow-2xl border-white/10"
        onClick={e => e.stopPropagation()}
      >
        <Command
          className="w-full bg-transparent"
          label="Command Menu"
          shouldFilter={true}
        >
          <div className="flex items-center border-b border-white/5 px-4 h-14">
            <Search className="w-5 h-5 text-muted-foreground mr-3" />
            <Command.Input 
              autoFocus 
              className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground h-full" 
              placeholder="Type a command or search..." 
            />
          </div>
          <Command.List className="max-h-[300px] overflow-y-auto p-2">
            <Command.Empty className="p-4 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>

            <Command.Group heading="Actions" className="text-xs font-medium text-muted-foreground px-2 py-1.5 [&_[cmdk-group-heading]]:mb-2">
              <Command.Item 
                className="flex items-center gap-2 px-2 py-2.5 rounded-xl cursor-pointer text-sm text-foreground aria-selected:bg-primary/20 aria-selected:text-primary data-[selected=true]:bg-primary/20 data-[selected=true]:text-primary"
                onSelect={() => { setLocation('/plan'); setOpen(false); }}
              >
                <Plus className="w-4 h-4" /> New Task
              </Command.Item>
              <Command.Item 
                className="flex items-center gap-2 px-2 py-2.5 rounded-xl cursor-pointer text-sm text-foreground aria-selected:bg-primary/20 aria-selected:text-primary data-[selected=true]:bg-primary/20 data-[selected=true]:text-primary"
                onSelect={() => { setLocation('/focus'); setOpen(false); }}
              >
                <Target className="w-4 h-4" /> Start Focus Session
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Navigation" className="text-xs font-medium text-muted-foreground px-2 py-1.5 [&_[cmdk-group-heading]]:mb-2">
              <Command.Item 
                className="flex items-center gap-2 px-2 py-2.5 rounded-xl cursor-pointer text-sm text-foreground aria-selected:bg-primary/20 aria-selected:text-primary data-[selected=true]:bg-primary/20 data-[selected=true]:text-primary"
                onSelect={() => { setLocation('/gpa'); setOpen(false); }}
              >
                <GpaIcon className="w-4 h-4" /> Open GPA Calculator
              </Command.Item>
              <Command.Item 
                className="flex items-center gap-2 px-2 py-2.5 rounded-xl cursor-pointer text-sm text-foreground aria-selected:bg-primary/20 aria-selected:text-primary data-[selected=true]:bg-primary/20 data-[selected=true]:text-primary"
                onSelect={() => { setLocation('/profile'); setOpen(false); }}
              >
                <Settings className="w-4 h-4" /> Go to Settings
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Settings" className="text-xs font-medium text-muted-foreground px-2 py-1.5 [&_[cmdk-group-heading]]:mb-2">
              <Command.Item 
                className="flex items-center gap-2 px-2 py-2.5 rounded-xl cursor-pointer text-sm text-foreground aria-selected:bg-primary/20 aria-selected:text-primary data-[selected=true]:bg-primary/20 data-[selected=true]:text-primary"
                onSelect={() => {
                  const newTheme = profile.preferences.theme === 'dark' ? 'light' : 'dark';
                  updatePreferences({ theme: newTheme });
                  document.documentElement.classList.toggle('dark', newTheme === 'dark');
                  setOpen(false);
                }}
              >
                {profile.preferences.theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                Toggle Theme
              </Command.Item>
            </Command.Group>

          </Command.List>
        </Command>
      </motion.div>
    </div>
  );
}
