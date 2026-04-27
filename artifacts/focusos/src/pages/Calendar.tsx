import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format, addDays, subDays, startOfWeek, addWeeks, subWeeks, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from 'date-fns';
import { toast } from 'sonner';
import { useLocation } from 'wouter';
import { getEventsForDay } from '@/lib/calendarEvents';

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

  const selectedCourse = courses.find((course) => course.id === newEvent.courseId);

  const handleAddEvent = () => {
    if (newEvent.type === 'class' && newEvent.courseId === 'none') {
      toast.error('Choose the course this class belongs to');
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
      courseId: newEvent.courseId === 'none' ? undefined : newEvent.courseId
    });
    
    setCurrentDate(start);
    setNewEvent({ title: '', type: 'class', date: format(new Date(), 'yyyy-MM-dd'), startTime: '09:00', endTime: '10:30', courseId: 'none' });
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
  const weekEventsCount = weekDays.reduce((total, day) => total + getEventsForDay(events, day).length, 0);
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: startOfWeek(monthStart, { weekStartsOn: 1 }), end: endOfWeek(monthEnd, { weekStartsOn: 1 }) });
  const upcomingExams = events
    .filter(event => event.type === 'exam' && new Date(event.start) > new Date())
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  const examMode = upcomingExams.some(event => {
    const diff = new Date(event.start).getTime() - Date.now();
    return diff > 0 && diff <= 48 * 60 * 60 * 1000;
  });

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
    <div className="page-shell">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <h1 className="balanced-title">Calendar.</h1>
          <div className="flex bg-background/50 glass rounded-lg p-1">
            <Button variant={view === 'week' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('week')} className="rounded-md">Week</Button>
            <Button variant={view === 'month' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('month')} className="rounded-md">Month</Button>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
          <Button variant="ghost" size="icon" onClick={() => setCurrentDate(view === 'week' ? subWeeks(currentDate, 1) : startOfMonth(subDays(monthStart, 1)))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="min-w-[120px] flex-1 text-center font-medium sm:flex-none">
            {format(currentDate, view === 'week' ? 'MMM d, yyyy' : 'MMMM yyyy')}
          </span>
          <Button variant="ghost" size="icon" onClick={() => setCurrentDate(view === 'week' ? addWeeks(currentDate, 1) : startOfMonth(addDays(monthEnd, 1)))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="mint-glow w-full sm:ml-2 sm:w-auto"><Plus className="w-4 h-4 md:mr-2" /><span className="ml-2 md:ml-0">Add Event</span></Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] glass border-white/10">
              <DialogHeader>
                <DialogTitle>New Event</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                {newEvent.type !== 'class' && (
                  <Input placeholder="Event title" value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} className="bg-background/50" />
                )}
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
                <div className="space-y-2">
                  <Select
                    value={newEvent.courseId}
                    onValueChange={v => setNewEvent({ ...newEvent, courseId: v })}
                    disabled={newEvent.type === 'class' && courses.length === 0}
                  >
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder={courses.length === 0 ? 'Add a course first' : 'Select course'} />
                    </SelectTrigger>
                    <SelectContent>
                      {newEvent.type !== 'class' && <SelectItem value="none">No Course</SelectItem>}
                      {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.code}{c.title && c.title !== c.code ? ` - ${c.title}` : ''}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {newEvent.type === 'class' && courses.length === 0 && (
                    <p className="text-xs text-warning">
                      Add at least one course in Profile before creating synced class events.
                    </p>
                  )}
                  {newEvent.type === 'class' && (
                    <p className="text-xs text-muted-foreground">
                      Class events should be attached to a real course so timetable and GPA views stay in sync.
                    </p>
                  )}
                </div>
                <Button className="w-full mint-glow" onClick={handleAddEvent} disabled={newEvent.type === 'class' && courses.length === 0}>Add to Calendar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="metric-card">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Upcoming Exams</p>
          <p className="mt-2 text-2xl font-bold">{upcomingExams.length}</p>
          <p className="mt-1 text-sm text-muted-foreground">Assessments still ahead on your timeline.</p>
        </div>
        <div className="metric-card">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">This Week</p>
          <p className="mt-2 text-2xl font-bold">{weekEventsCount}</p>
          <p className="mt-1 text-sm text-muted-foreground">Classes, deadlines, and exams in view.</p>
        </div>
        <div className="metric-card">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Exam Mode</p>
          <p className="mt-2 text-2xl font-bold">{examMode ? 'On' : 'Off'}</p>
          <p className="mt-1 text-sm text-muted-foreground">Turns on when an exam is within 48 hours.</p>
        </div>
      </div>
      
      <AnimatePresence mode="wait">
        <motion.div 
          key={view + currentDate.toISOString()}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="section-card overflow-hidden p-0"
        >
          {view === 'week' ? (
            <div className="overflow-x-auto">
              <div className="grid min-w-[48rem] grid-cols-7 border-b border-white/5">
              {weekDays.map((day, i) => {
                const dayEvents = getEventsForDay(events, day);
                return (
                <div key={i} className="p-2 text-center border-r border-white/5 last:border-0">
                  <div className="text-xs text-muted-foreground mb-1">{format(day, 'EEE')}</div>
                  <div className={`text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full mx-auto ${isSameDay(day, new Date()) ? 'bg-primary text-primary-foreground mint-glow' : ''}`}>
                    {format(day, 'd')}
                  </div>
                  <div className="mt-2 space-y-1 min-h-[100px]">
                    {dayEvents.map(({ event, start, key }) => (
                      <div key={key} className={`text-left text-xs p-1 rounded border ${getTypeColor(event.type)} truncate`}>
                        {format(start, 'HH:mm')} {event.title}
                        {event.type === 'exam' && isSameDay(start, new Date(event.start)) && (
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
                );
              })}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <div className="grid min-w-[42rem] grid-cols-7 bg-background/20">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                <div key={d} className="p-2 text-center text-xs font-medium text-muted-foreground border-b border-white/5">{d}</div>
              ))}
              {monthDays.map((day, i) => {
                const dayEvents = getEventsForDay(events, day);
                return (
                  <div key={i} className={`min-h-[108px] p-1 border-b border-r border-white/5 ${!isSameMonth(day, currentDate) ? 'opacity-30' : ''} ${isSameDay(day, new Date()) ? 'bg-primary/5' : ''}`}>
                    <div className="text-xs font-medium p-1">{format(day, 'd')}</div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map(({ event, key }) => (
                        <div key={key} className={`text-[10px] p-1 rounded border truncate ${getTypeColor(event.type)}`}>
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-[10px] text-muted-foreground px-1">+{dayEvents.length - 3} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
