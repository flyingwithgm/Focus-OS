import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, Plus, Target, CheckCircle2, ChevronLeft, ChevronRight, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format, addDays, subDays, startOfWeek, addWeeks, subWeeks, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { useLocation } from 'wouter';

export default function Calendar() {
  const [location, setLocation] = useLocation();
  const events = useStore(state => state.events);
  const courses = useStore(state => state.courses);
  const addEvent = useStore(state => state.addEvent);
  const addTask = useStore(state => state.addTask);
  const addBlock = useStore(state => state.addBlock);

  const [view, setView] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', type: 'class' as const, date: format(new Date(), 'yyyy-MM-dd'), startTime: '09:00', endTime: '10:30', courseId: 'none' });

  const handleAddEvent = () => {
    if (!newEvent.title) return;
    const start = new Date(`${newEvent.date}T${newEvent.startTime}`);
    const end = new Date(`${newEvent.date}T${newEvent.endTime}`);
    
    addEvent({
      title: newEvent.title,
      type: newEvent.type,
      start: start.toISOString(),
      end: end.toISOString(),
      courseId: newEvent.courseId === 'none' ? undefined : newEvent.courseId
    });
    
    setIsAddOpen(false);
    toast.success('Event added');
  };

  const handleSuggestBlock = (start: Date, end: Date) => {
    addBlock({
      title: 'Study Block',
      start: start.toISOString(),
      end: end.toISOString()
    });
    toast.success('Study block added to schedule');
    setLocation('/schedule');
  };

  const handleGeneratePrep = (examTitle: string, examDate: Date) => {
    ['Review Notes', 'Practice Questions', 'Final Review'].forEach((task, i) => {
      addTask({
        title: `${examTitle} Prep: ${task}`,
        priority: 'high',
        estMin: 60,
        dueAt: subDays(examDate, i + 1).toISOString(),
      });
    });
    toast.success('Generated 3 prep tasks');
    setLocation('/plan');
  };

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: startOfWeek(monthStart, { weekStartsOn: 1 }), end: endOfWeek(monthEnd, { weekStartsOn: 1 }) });

  function endOfWeek(date: Date, options: any) {
    return addDays(startOfWeek(date, options), 6);
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'exam': return 'bg-destructive/20 border-destructive text-destructive';
      case 'deadline': return 'bg-warning/20 border-warning text-warning';
      case 'class': return 'bg-info/20 border-info text-info';
      default: return 'bg-primary/20 border-primary text-primary';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Calendar.</h1>
          <div className="flex bg-background/50 glass rounded-lg p-1">
            <Button variant={view === 'week' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('week')} className="rounded-md">Week</Button>
            <Button variant={view === 'month' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('month')} className="rounded-md">Month</Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setCurrentDate(view === 'week' ? subWeeks(currentDate, 1) : startOfMonth(subDays(monthStart, 1)))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="font-medium min-w-[120px] text-center">
            {format(currentDate, view === 'week' ? 'MMM d, yyyy' : 'MMMM yyyy')}
          </span>
          <Button variant="ghost" size="icon" onClick={() => setCurrentDate(view === 'week' ? addWeeks(currentDate, 1) : startOfMonth(addDays(monthEnd, 1)))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="mint-glow ml-2"><Plus className="w-4 h-4 md:mr-2" /><span className="hidden md:inline">Add Event</span></Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] glass border-white/10">
              <DialogHeader>
                <DialogTitle>New Event</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input placeholder="Event title" value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} className="bg-background/50" />
                <Select value={newEvent.type} onValueChange={(v: any) => setNewEvent({ ...newEvent, type: v })}>
                  <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="class">Class</SelectItem>
                    <SelectItem value="exam">Exam</SelectItem>
                    <SelectItem value="deadline">Deadline</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Input type="date" value={newEvent.date} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} className="bg-background/50" />
                </div>
                <div className="flex gap-2">
                  <Input type="time" value={newEvent.startTime} onChange={e => setNewEvent({ ...newEvent, startTime: e.target.value })} className="bg-background/50" />
                  <Input type="time" value={newEvent.endTime} onChange={e => setNewEvent({ ...newEvent, endTime: e.target.value })} className="bg-background/50" />
                </div>
                <Select value={newEvent.courseId} onValueChange={v => setNewEvent({ ...newEvent, courseId: v })}>
                  <SelectTrigger className="bg-background/50"><SelectValue placeholder="Select course" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Course</SelectItem>
                    {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.code}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button className="w-full mint-glow" onClick={handleAddEvent}>Add to Calendar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <AnimatePresence mode="wait">
        <motion.div 
          key={view + currentDate.toISOString()}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="glass rounded-2xl overflow-hidden"
        >
          {view === 'week' ? (
            <div className="grid grid-cols-7 border-b border-white/5">
              {weekDays.map((day, i) => (
                <div key={i} className="p-2 text-center border-r border-white/5 last:border-0">
                  <div className="text-xs text-muted-foreground mb-1">{format(day, 'EEE')}</div>
                  <div className={`text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full mx-auto ${isSameDay(day, new Date()) ? 'bg-primary text-primary-foreground mint-glow' : ''}`}>
                    {format(day, 'd')}
                  </div>
                  <div className="mt-2 space-y-1 min-h-[100px]">
                    {events.filter(e => isSameDay(new Date(e.start), day)).map(event => (
                      <div key={event.id} className={`text-left text-xs p-1 rounded border ${getTypeColor(event.type)} truncate`}>
                        {format(new Date(event.start), 'HH:mm')} {event.title}
                        {event.type === 'exam' && (
                          <div className="mt-1">
                            <Button size="sm" variant="ghost" className="h-5 px-1 text-[10px] w-full bg-background/50" onClick={(e) => { e.stopPropagation(); handleGeneratePrep(event.title, new Date(event.start)); }}>
                              Prep
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 bg-background/20">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                <div key={d} className="p-2 text-center text-xs font-medium text-muted-foreground border-b border-white/5">{d}</div>
              ))}
              {monthDays.map((day, i) => (
                <div key={i} className={`min-h-[100px] p-1 border-b border-r border-white/5 ${!isSameMonth(day, currentDate) ? 'opacity-30' : ''} ${isSameDay(day, new Date()) ? 'bg-primary/5' : ''}`}>
                  <div className="text-xs font-medium p-1">{format(day, 'd')}</div>
                  <div className="space-y-1">
                    {events.filter(e => isSameDay(new Date(e.start), day)).slice(0, 3).map(event => (
                      <div key={event.id} className={`text-[10px] p-1 rounded border truncate ${getTypeColor(event.type)}`}>
                        {event.title}
                      </div>
                    ))}
                    {events.filter(e => isSameDay(new Date(e.start), day)).length > 3 && (
                      <div className="text-[10px] text-muted-foreground px-1">+{events.filter(e => isSameDay(new Date(e.start), day)).length - 3} more</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
