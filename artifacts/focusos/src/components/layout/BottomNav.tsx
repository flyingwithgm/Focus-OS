import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Home, ListTodo, Calendar, BarChart3, User, Plus, Target, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStore } from '@/lib/store';
import { toast } from 'sonner';
import { haptics } from '@/lib/haptics';

export function BottomNav({ className }: { className?: string }) {
  const [location] = useLocation();
  const [isFabOpen, setIsFabOpen] = useState(false);
  const addTask = useStore(state => state.addTask);
  const addEvent = useStore(state => state.addEvent);
  const courses = useStore(state => state.courses);

  const [newTask, setNewTask] = useState({ title: '', priority: 'medium' as any, estMin: 30 });
  const [newEvent, setNewEvent] = useState({ title: '', type: 'class' as any, date: '', startTime: '09:00', endTime: '10:30' });

  const handleAddTask = () => {
    if (!newTask.title) return;
    addTask({ title: newTask.title, priority: newTask.priority, estMin: newTask.estMin, dueAt: new Date().toISOString() });
    haptics.success();
    toast.success('Task added');
    setIsFabOpen(false);
    setNewTask({ title: '', priority: 'medium', estMin: 30 });
  };

  const handleAddEvent = () => {
    if (!newEvent.title || !newEvent.date) return;
    const start = new Date(`${newEvent.date}T${newEvent.startTime}`);
    const end = new Date(`${newEvent.date}T${newEvent.endTime}`);
    addEvent({ title: newEvent.title, type: newEvent.type, start: start.toISOString(), end: end.toISOString() });
    haptics.success();
    toast.success('Event added');
    setIsFabOpen(false);
    setNewEvent({ title: '', type: 'class', date: '', startTime: '09:00', endTime: '10:30' });
  };

  const links = [
    { href: '/', icon: Home, label: 'Cockpit' },
    { href: '/plan', icon: ListTodo, label: 'Plan' },
    { special: true },
    { href: '/analytics', icon: BarChart3, label: 'Stats' },
    { href: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <>
      <nav className={cn('glass pb-safe pt-2 px-4 flex items-center justify-between border-t border-white/5 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]', className)}>
        {links.map((link, i) => {
          if (link.special) {
            return (
              <div key="fab" className="relative -top-6 group">
                <Dialog open={isFabOpen} onOpenChange={setIsFabOpen}>
                  <DialogTrigger asChild>
                    <motion.button 
                      whileTap={{ scale: 0.9 }}
                      onClick={() => haptics.tap()}
                      className="w-14 h-14 rounded-full bg-primary flex items-center justify-center mint-glow shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                      aria-label="Quick Add"
                    >
                      <Plus className="w-7 h-7 text-primary-foreground" />
                    </motion.button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md glass border-white/10 rounded-3xl p-6">
                    <DialogHeader>
                      <DialogTitle className="text-center text-xl font-bold">Quick Add</DialogTitle>
                    </DialogHeader>
                    <Tabs defaultValue="task" className="w-full mt-2">
                      <TabsList className="grid w-full grid-cols-2 bg-background/50 rounded-xl mb-4">
                        <TabsTrigger value="task" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:mint-glow transition-all">Task</TabsTrigger>
                        <TabsTrigger value="event" className="rounded-lg data-[state=active]:bg-info data-[state=active]:text-info-foreground data-[state=active]:shadow-[0_0_20px_rgba(87,163,255,0.3)] transition-all">Event</TabsTrigger>
                      </TabsList>
                      <TabsContent value="task" className="space-y-4">
                        <Input placeholder="What needs doing?" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} className="bg-background/50 border-white/5 h-12" autoFocus />
                        <div className="grid grid-cols-2 gap-3">
                          <Select value={newTask.priority} onValueChange={(v: any) => setNewTask({ ...newTask, priority: v })}>
                            <SelectTrigger className="bg-background/50 border-white/5 h-12"><SelectValue placeholder="Priority" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="high">High Priority</SelectItem>
                              <SelectItem value="medium">Medium Priority</SelectItem>
                              <SelectItem value="low">Low Priority</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input type="number" placeholder="Est. min" value={newTask.estMin || ''} onChange={e => setNewTask({ ...newTask, estMin: Number(e.target.value) })} className="bg-background/50 border-white/5 h-12" />
                        </div>
                        <Button className="w-full h-12 rounded-xl mint-glow" onClick={handleAddTask}>Add Task</Button>
                      </TabsContent>
                      <TabsContent value="event" className="space-y-4">
                        <Input placeholder="Event title" value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} className="bg-background/50 border-white/5 h-12" />
                        <div className="grid grid-cols-2 gap-3">
                          <Select value={newEvent.type} onValueChange={(v: any) => setNewEvent({ ...newEvent, type: v })}>
                            <SelectTrigger className="bg-background/50 border-white/5 h-12"><SelectValue placeholder="Type" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="class">Class</SelectItem>
                              <SelectItem value="exam">Exam</SelectItem>
                              <SelectItem value="deadline">Deadline</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input type="date" value={newEvent.date} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} className="bg-background/50 border-white/5 h-12" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Input type="time" value={newEvent.startTime} onChange={e => setNewEvent({ ...newEvent, startTime: e.target.value })} className="bg-background/50 border-white/5 h-12" />
                          <Input type="time" value={newEvent.endTime} onChange={e => setNewEvent({ ...newEvent, endTime: e.target.value })} className="bg-background/50 border-white/5 h-12" />
                        </div>
                        <Button className="w-full h-12 rounded-xl shadow-[0_0_20px_rgba(87,163,255,0.3)] bg-info hover:bg-info/90 text-info-foreground" onClick={handleAddEvent}>Add Event</Button>
                      </TabsContent>
                    </Tabs>
                  </DialogContent>
                </Dialog>
              </div>
            );
          }

          const isActive = location === link.href;
          const Icon = link.icon!;

          return (
            <Link key={link.href} href={link.href!} className="flex-1 flex flex-col items-center justify-center gap-1 group outline-none">
              <div className={cn(
                "p-2 rounded-xl transition-all duration-300",
                isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground group-focus-visible:ring-2 group-focus-visible:ring-primary"
              )} onClick={() => haptics.tap()}>
                <Icon className={cn("w-5 h-5 transition-transform", isActive && "scale-110")} />
              </div>
              <span className={cn(
                "text-[10px] font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {link.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
