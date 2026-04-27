import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Home, ListTodo, Calendar, BarChart3, User, Plus, Target, Brain, Clock3, MoreHorizontal, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { useStore } from '@/lib/store';
import { toast } from 'sonner';
import { haptics } from '@/lib/haptics';

const createDefaultDueDate = () => {
  const due = new Date();
  due.setHours(18, 0, 0, 0);
  return due.toISOString().slice(0, 10);
};

const combineDateTime = (date: string, time: string) => {
  const parsed = new Date(`${date}T${time}`);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
};

export function BottomNav({ className }: { className?: string }) {
  const [location, setLocation] = useLocation();
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const addTask = useStore(state => state.addTask);
  const addEvent = useStore(state => state.addEvent);
  const courses = useStore(state => state.courses);

  const [newTask, setNewTask] = useState({ title: '', priority: 'medium' as any, estMin: 30, dueDate: createDefaultDueDate(), dueTime: '18:00' });
  const [newEvent, setNewEvent] = useState({ title: '', type: 'class' as any, date: createDefaultDueDate(), startTime: '09:00', endTime: '10:30', courseId: 'none' });
  const selectedCourse = courses.find((course) => course.id === newEvent.courseId);

  const handleAddTask = () => {
    if (!newTask.title) return;
    addTask({
      title: newTask.title,
      priority: newTask.priority,
      estMin: newTask.estMin,
      dueAt: combineDateTime(newTask.dueDate, newTask.dueTime)
    });
    haptics.success();
    toast.success('Task added');
    setIsFabOpen(false);
    setNewTask({ title: '', priority: 'medium', estMin: 30, dueDate: createDefaultDueDate(), dueTime: '18:00' });
  };

  const handleAddEvent = () => {
    if (!newEvent.date) {
      toast.error('Choose a date for this event');
      return;
    }

    if (newEvent.type === 'class' && newEvent.courseId === 'none') {
      toast.error('Choose which course this class should sync with');
      return;
    }

    const title =
      newEvent.type === 'class' && selectedCourse
        ? `${selectedCourse.code} Class`
        : newEvent.title.trim();

    if (!title) {
      toast.error('Add a title for this event');
      return;
    }

    const start = new Date(`${newEvent.date}T${newEvent.startTime}`);
    const end = new Date(`${newEvent.date}T${newEvent.endTime}`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      toast.error('Choose a valid date and time');
      return;
    }

    if (end <= start) {
      toast.error('End time must be after start time');
      return;
    }

    addEvent({
      title,
      type: newEvent.type,
      start: start.toISOString(),
      end: end.toISOString(),
      recurrence: newEvent.type === 'class' ? 'weekly' : undefined,
      courseId: newEvent.courseId === 'none' ? undefined : newEvent.courseId,
    });
    haptics.success();
    toast.success('Event added');
    setIsFabOpen(false);
    setNewEvent({ title: '', type: 'class', date: createDefaultDueDate(), startTime: '09:00', endTime: '10:30', courseId: 'none' });
  };

  const primaryLinks = [
    { href: '/', icon: Home, label: 'Cockpit' },
    { href: '/plan', icon: ListTodo, label: 'Plan' },
    { href: '/focus', icon: Zap, label: 'Focus' },
  ];

  const secondaryLinks = [
    { href: '/calendar', icon: Calendar, label: 'Calendar', description: 'See classes, exams, and deadlines at a glance.' },
    { href: '/schedule', icon: Clock3, label: 'Schedule', description: 'View your time blocks and rescue plan.' },
    { href: '/analytics', icon: BarChart3, label: 'Stats', description: 'Check progress, trends, and focus metrics.' },
    { href: '/hub', icon: Brain, label: 'Hub', description: 'Use the smart tools and mood check-ins.' },
    { href: '/gpa', icon: Target, label: 'GPA', description: 'Track grades and semester performance.' },
    { href: '/profile', icon: User, label: 'Profile', description: 'Manage settings, courses, and backups.' },
  ];

  const handleNavigate = (href: string) => {
    haptics.tap();
    setIsMoreOpen(false);
    setLocation(href);
  };

  const renderNavLink = (link: { href: string; icon: React.ComponentType<{ className?: string }>; label: string }) => {
    const isActive = location === link.href;
    const Icon = link.icon;

    return (
      <Link key={link.href} href={link.href} className="flex min-w-0 flex-col items-center justify-center gap-1 group outline-none">
        <div
          className={cn(
            'rounded-xl p-2 transition-all duration-300',
            isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground group-focus-visible:ring-2 group-focus-visible:ring-primary'
          )}
          onClick={() => haptics.tap()}
        >
          <Icon className={cn('w-5 h-5 transition-transform', isActive && 'scale-110')} />
        </div>
        <span
          className={cn(
            'text-[10px] font-medium transition-colors',
            isActive ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          {link.label}
        </span>
      </Link>
    );
  };

  return (
    <>
      <nav
        className={cn(
          'glass mx-auto grid w-full max-w-screen-sm grid-cols-[1fr_1fr_auto_1fr_1fr] items-end gap-1 border-t border-white/5 px-3 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.7rem)] shadow-[0_-10px_40px_rgba(0,0,0,0.1)]',
          className
        )}
      >
        <div className="flex justify-center">
          {renderNavLink(primaryLinks[0])}
        </div>
        <div className="flex justify-center">
          {renderNavLink(primaryLinks[1])}
        </div>

        <div className="relative -mt-7 flex justify-center self-start">
          <Dialog open={isFabOpen} onOpenChange={setIsFabOpen}>
            <DialogTrigger asChild>
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={() => haptics.tap()}
                className="flex h-[3.75rem] w-[3.75rem] items-center justify-center rounded-full bg-primary mint-glow shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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
                  <div className="grid grid-cols-2 gap-3">
                    <Input type="date" value={newTask.dueDate} onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })} className="bg-background/50 border-white/5 h-12" />
                    <Input type="time" value={newTask.dueTime} onChange={e => setNewTask({ ...newTask, dueTime: e.target.value })} className="bg-background/50 border-white/5 h-12" />
                  </div>
                  <Button className="w-full h-12 rounded-xl mint-glow" onClick={handleAddTask}>Add Task</Button>
                </TabsContent>
                <TabsContent value="event" className="space-y-4">
                  {newEvent.type !== 'class' && (
                    <Input placeholder="Event title" value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} className="bg-background/50 border-white/5 h-12" />
                  )}
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
                  <Select
                    value={newEvent.courseId}
                    onValueChange={v => setNewEvent({ ...newEvent, courseId: v })}
                    disabled={newEvent.type === 'class' && courses.length === 0}
                  >
                    <SelectTrigger className="bg-background/50 border-white/5 h-12">
                      <SelectValue placeholder={courses.length === 0 ? 'Add a course first' : 'Select course'} />
                    </SelectTrigger>
                    <SelectContent>
                      {newEvent.type !== 'class' && <SelectItem value="none">No Course</SelectItem>}
                      {courses.map(course => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.code}{course.title && course.title !== course.code ? ` - ${course.title}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {newEvent.type === 'class' && courses.length === 0 && (
                    <p className="text-xs text-warning">
                      Add a course in Profile first so this class can stay synced.
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <Input type="time" value={newEvent.startTime} onChange={e => setNewEvent({ ...newEvent, startTime: e.target.value })} className="bg-background/50 border-white/5 h-12" />
                    <Input type="time" value={newEvent.endTime} onChange={e => setNewEvent({ ...newEvent, endTime: e.target.value })} className="bg-background/50 border-white/5 h-12" />
                  </div>
                  {newEvent.type === 'class' && (
                    <p className="text-xs text-muted-foreground">
                      Class entries repeat weekly and stay linked to the course you pick here.
                    </p>
                  )}
                  <Button className="w-full h-12 rounded-xl shadow-[0_0_20px_rgba(87,163,255,0.3)] bg-info hover:bg-info/90 text-info-foreground" onClick={handleAddEvent} disabled={newEvent.type === 'class' && courses.length === 0}>Add Event</Button>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex justify-center">
          {renderNavLink(primaryLinks[2])}
        </div>

        <Drawer open={isMoreOpen} onOpenChange={setIsMoreOpen}>
          <DrawerTrigger asChild>
            <button
              type="button"
              className="flex min-w-0 flex-col items-center justify-center gap-1 text-muted-foreground outline-none"
              onClick={() => haptics.tap()}
              aria-label="More navigation options"
            >
              <div className="p-2 rounded-xl transition-all duration-300">
                <MoreHorizontal className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium transition-colors">More</span>
            </button>
          </DrawerTrigger>
          <DrawerContent className="glass border-white/10 rounded-t-3xl">
            <DrawerHeader className="px-5 pt-5 text-left">
              <DrawerTitle>More sections</DrawerTitle>
              <DrawerDescription>Everything available on desktop is reachable here on mobile too.</DrawerDescription>
            </DrawerHeader>
            <div className="grid grid-cols-2 gap-3 px-5 pb-6">
              {secondaryLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location === link.href;

                return (
                  <button
                    key={link.href}
                    type="button"
                    onClick={() => handleNavigate(link.href)}
                    className={cn(
                      'text-left rounded-2xl border p-4 transition-colors',
                      isActive
                        ? 'border-primary/40 bg-primary/10 text-primary'
                        : 'border-white/10 bg-background/40 text-foreground'
                    )}
                  >
                    <Icon className={cn('w-5 h-5 mb-3', isActive ? 'text-primary' : 'text-muted-foreground')} />
                    <div className="font-semibold">{link.label}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{link.description}</div>
                  </button>
                );
              })}
            </div>
          </DrawerContent>
        </Drawer>
      </nav>
    </>
  );
}
