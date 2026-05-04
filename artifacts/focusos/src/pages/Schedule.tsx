import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { format, isSameDay, differenceInMinutes } from 'date-fns';
import { Clock, Plus, Trash2, GripVertical, LayoutList, Calendar as CalendarIcon, Play, Link2, Pencil, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useLocation } from 'wouter';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Block, Event } from '@/lib/types';
import { getEventsForDay } from '@/lib/calendarEvents';

export default function Schedule() {
  const [location, setLocation] = useLocation();
  const blocks = useStore(state => state.blocks);
  const tasks = useStore(state => state.tasks);
  const events = useStore(state => state.events);
  const addBlock = useStore(state => state.addBlock);
  const deleteBlock = useStore(state => state.deleteBlock);
  const updateBlock = useStore(state => state.updateBlock);
  const completeTask = useStore(state => state.completeTask);

  const [newTitle, setNewTitle] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [view, setView] = useState<'list' | 'day'>('list');
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);
  const [editDraft, setEditDraft] = useState({ title: '', date: '', startTime: '09:00', endTime: '10:00' });
  const draftStart = new Date(new Date().toDateString() + ` ${startTime}`);
  const draftEnd = new Date(new Date().toDateString() + ` ${endTime}`);
  const isDraftRangeValid =
    !Number.isNaN(draftStart.getTime()) &&
    !Number.isNaN(draftEnd.getTime()) &&
    draftEnd > draftStart;
  const isDraftValid = newTitle.trim().length > 0 && isDraftRangeValid;
  const scheduleHint =
    !newTitle.trim()
      ? 'Name the block after the work you actually want to get done.'
      : !isDraftRangeValid
        ? 'Choose a start and end time where the end is later than the start.'
        : 'Looks good. We will still stop you if this overlaps another block.';

  const getTaskForBlock = (taskId?: string) => tasks.find(task => task.id === taskId);
  const openFocusForBlock = (taskId?: string) => {
    setLocation(taskId ? `/focus?taskId=${taskId}` : '/focus');
  };
  const isBlockComplete = (block: Block) => Boolean(block.completedAt || getTaskForBlock(block.taskId)?.completedAt);
  const getCourseLabel = (courseId?: string) => {
    const course = useStore.getState().courses.find((item) => item.id === courseId);
    if (!course) return 'Class';
    return course.title && course.title !== course.code ? `${course.code} - ${course.title}` : course.code;
  };

  const openEditBlock = (block: Block) => {
    const start = new Date(block.start);
    const end = new Date(block.end);
    setEditingBlock(block);
    setEditDraft({
      title: block.title,
      date: format(start, 'yyyy-MM-dd'),
      startTime: format(start, 'HH:mm'),
      endTime: format(end, 'HH:mm'),
    });
  };

  const handleSaveBlock = () => {
    if (!editingBlock || !editDraft.title.trim()) return;

    const start = new Date(`${editDraft.date}T${editDraft.startTime}`);
    const end = new Date(`${editDraft.date}T${editDraft.endTime}`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      toast.error('Choose a valid date and time');
      return;
    }

    if (end <= start) {
      toast.error('End time must be after start time');
      return;
    }

    const hasConflict = blocks.some((block) => {
      if (block.id === editingBlock.id) return false;
      const blockStart = new Date(block.start);
      const blockEnd = new Date(block.end);
      return start < blockEnd && end > blockStart;
    });

    if (hasConflict) {
      toast.error('This block overlaps with an existing block');
      return;
    }

    updateBlock(editingBlock.id, {
      title: editDraft.title,
      start: start.toISOString(),
      end: end.toISOString(),
    });
    setEditingBlock(null);
    toast.success('Block updated');
  };

  const handleCompleteBlock = (block: Block) => {
    if (block.taskId) {
      completeTask(block.taskId);
    }
    updateBlock(block.id, { completedAt: new Date().toISOString() });
    toast.success(block.taskId ? 'Task and block marked complete' : 'Block marked complete');
  };

  const handleAdd = () => {
    if (!isDraftValid) {
      toast.error('Finish the block details before adding it.');
      return;
    }
    const now = new Date();
    const startParts = startTime.split(':');
    const endParts = endTime.split(':');
    
    const start = new Date(now.setHours(parseInt(startParts[0]), parseInt(startParts[1]), 0));
    const end = new Date(now.setHours(parseInt(endParts[0]), parseInt(endParts[1]), 0));

    if (end <= start) {
      toast.error('End time must be after start time');
      return;
    }

    // Conflict detection
    const hasConflict = blocks.some(b => {
      const bStart = new Date(b.start);
      const bEnd = new Date(b.end);
      return (start < bEnd && end > bStart);
    });

    if (hasConflict) {
      toast.error('This block overlaps with an existing block');
      return;
    }

    addBlock({ title: newTitle, start: start.toISOString(), end: end.toISOString() });
    setNewTitle('');
    toast.success('Block scheduled');
  };

  const todayBlocks = blocks
    .filter(b => isSameDay(new Date(b.start), new Date()))
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  const todayClasses = getEventsForDay(events, new Date())
    .filter(({ event }) => event.type === 'class');
  const plannedMinutes = todayBlocks.reduce((total, block) => total + Math.max(0, differenceInMinutes(new Date(block.end), new Date(block.start))), 0);
  const completedBlocks = todayBlocks.filter((block) => isBlockComplete(block));
  const linkedBlockCount = todayBlocks.filter((block) => block.taskId).length;

  const handleReorder = (newOrder: typeof todayBlocks) => {
    // Logic to visually reorder, though time-blocks are chronologically sorted.
    // Real reordering would require adjusting the start/end times.
    // For now we'll just update the state to match the reorder if they drag it.
  };

  const TimetableClassCard = ({ event, start, end, compact = false }: { event: Event; start: Date; end: Date; compact?: boolean }) => (
    <div className={`rounded-xl border border-info/20 bg-info/10 ${compact ? 'p-2' : 'p-4'}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h4 className={`font-medium text-info ${compact ? 'text-sm' : ''}`}>{event.title}</h4>
          <p className="text-xs text-muted-foreground">
            {getCourseLabel(event.courseId)}
          </p>
          <p className="text-xs text-muted-foreground">
            {format(start, 'h:mm a')} - {format(end, 'h:mm a')}
          </p>
        </div>
        {!compact && (
          <Button variant="ghost" size="sm" className="text-info" onClick={() => setLocation('/calendar')}>
            Open
          </Button>
        )}
      </div>
    </div>
  );

  const DayView = () => {
    const hours = Array.from({ length: 17 }).map((_, i) => i + 7); // 7am to 11pm

    return (
      <div className="relative border-l border-white/10 ml-12 pb-12 mt-4">
        {hours.map(h => (
          <div key={h} className="h-16 relative border-t border-white/5">
            <span className="absolute -left-12 -top-3 text-xs text-muted-foreground w-10 text-right">
              {format(new Date().setHours(h, 0), 'h a')}
            </span>
          </div>
        ))}

        {todayBlocks.map(block => {
          const bStart = new Date(block.start);
          const bEnd = new Date(block.end);
          const startHour = bStart.getHours() + bStart.getMinutes() / 60;
          const duration = differenceInMinutes(bEnd, bStart) / 60;
          
          if (startHour < 7 || startHour > 23) return null;

          const top = (startHour - 7) * 4; // 4rem (16) = 1 hour
          const height = duration * 4;

          return (
            <motion.div 
              key={block.id}
              className={`absolute left-2 right-2 rounded-lg glass border-l-4 p-2 overflow-hidden shadow-lg group ${isBlockComplete(block) ? 'border-l-primary/40 opacity-60' : 'border-l-primary'}`}
              style={{ top: `${top}rem`, height: `${height}rem` }}
              whileHover={{ zIndex: 10, scale: 1.02 }}
            >
              <div className="flex justify-between items-start h-full">
                <div>
                  <h4 className={`font-bold text-sm leading-tight ${isBlockComplete(block) ? 'line-through text-muted-foreground' : ''}`}>{block.title}</h4>
                  {block.taskId && (
                    <p className="text-[11px] text-primary mt-1 flex items-center gap-1">
                      <Link2 className="w-3 h-3" /> Linked task
                    </p>
                  )}
                  {height > 2 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(bStart, 'h:mm')} - {format(bEnd, 'h:mm')}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openEditBlock(block)}>
                    <Pencil className="w-3 h-3" />
                  </Button>
                  {!isBlockComplete(block) && (
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-primary" onClick={() => handleCompleteBlock(block)}>
                      <CheckCircle2 className="w-3 h-3" />
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openFocusForBlock(block.taskId)}>
                    <Play className="w-3 h-3 text-primary" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => deleteBlock(block.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </motion.div>
          );
        })}

        {todayClasses.map(({ event, start: eventStart, end: eventEnd, key }) => {
          const startHour = eventStart.getHours() + eventStart.getMinutes() / 60;
          const duration = differenceInMinutes(eventEnd, eventStart) / 60;

          if (startHour < 7 || startHour > 23) return null;

          const top = (startHour - 7) * 4;
          const height = duration * 4;

          return (
            <motion.div
              key={key}
              className="absolute left-2 right-2 rounded-lg border border-info/20 bg-info/10 p-2 shadow-lg"
              style={{ top: `${top}rem`, height: `${height}rem` }}
              whileHover={{ zIndex: 10, scale: 1.01 }}
            >
              <div className="flex h-full flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm leading-tight text-info">{event.title}</h4>
                  <p className="mt-1 text-[11px] text-muted-foreground">{getCourseLabel(event.courseId)}</p>
                  {height > 2 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(eventStart, 'h:mm')} - {format(eventEnd, 'h:mm')}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="page-shell">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Schedule.</h1>
        <div className="flex bg-background/50 glass rounded-lg p-1">
          <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('list')} className="rounded-md">
            <LayoutList className="w-4 h-4 mr-2" /> List
          </Button>
          <Button variant={view === 'day' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('day')} className="rounded-md">
            <CalendarIcon className="w-4 h-4 mr-2" /> Day
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="metric-card">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Planned Today</p>
          <p className="mt-2 text-2xl font-bold">{plannedMinutes}m</p>
          <p className="mt-1 text-sm text-muted-foreground">Total time blocked on your calendar.</p>
        </div>
        <div className="metric-card">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Completed</p>
          <p className="mt-2 text-2xl font-bold">{completedBlocks.length}/{todayBlocks.length || 0}</p>
          <p className="mt-1 text-sm text-muted-foreground">Blocks you have already closed out.</p>
        </div>
        <div className="metric-card">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Task Linked</p>
          <p className="mt-2 text-2xl font-bold">{linkedBlockCount}</p>
          <p className="mt-1 text-sm text-muted-foreground">Blocks connected directly to tasks.</p>
        </div>
        <div className="metric-card">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Classes Today</p>
          <p className="mt-2 text-2xl font-bold">{todayClasses.length}</p>
          <p className="mt-1 text-sm text-muted-foreground">Class events already on your timetable.</p>
        </div>
      </div>

      <div className="section-card flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="flex-1 min-w-[200px] space-y-1">
          <label className="text-xs text-muted-foreground ml-1">Block Title</label>
          <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Deep Work..." className="bg-background/50 border-white/10" />
        </div>
        <div className="w-full space-y-1 sm:w-24">
          <label className="text-xs text-muted-foreground ml-1">Start</label>
          <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="bg-background/50 border-white/10" />
        </div>
        <div className="w-full space-y-1 sm:w-24">
          <label className="text-xs text-muted-foreground ml-1">End</label>
          <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="bg-background/50 border-white/10" />
        </div>
        <Button onClick={handleAdd} className="mint-glow h-11 w-full p-0 sm:h-10 sm:w-10" disabled={!isDraftValid}>
          <Plus className="w-5 h-5" />
        </Button>
        <p className={`w-full text-sm ${isDraftValid ? 'text-muted-foreground' : 'text-warning'}`}>
          {scheduleHint}
        </p>
      </div>

      <div className="space-y-3">
        {todayClasses.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-info" /> Today's Classes
            </h3>
            <div className="space-y-3">
              {todayClasses.map((event) => (
                <TimetableClassCard key={event.key} event={event.event} start={event.start} end={event.end} />
              ))}
            </div>
          </div>
        )}

        <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-primary" /> Today's Schedule</h3>
        
        {todayBlocks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground glass rounded-2xl space-y-4">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <div className="space-y-1">
              <p className="text-base font-medium text-foreground">No blocks scheduled for today.</p>
              <p>Add one above, or bring urgent tasks over from your plan.</p>
            </div>
            <div className="flex flex-col gap-2 px-4 sm:flex-row sm:justify-center">
              <Button variant="outline" onClick={() => setLocation('/plan')}>
                Open Plan
              </Button>
              <Button className="mint-glow" onClick={() => setView('list')}>
                Start With A Block
              </Button>
            </div>
          </div>
        ) : view === 'list' ? (
          <Reorder.Group axis="y" values={todayBlocks} onReorder={handleReorder} className="space-y-3">
            <AnimatePresence>
              {todayBlocks.map((block) => (
                <Reorder.Item key={block.id} value={block} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                  <div className={`p-4 rounded-xl glass border-l-4 flex items-center justify-between group ${isBlockComplete(block) ? 'border-l-primary/40 opacity-65' : 'border-l-primary'}`}>
                    <div className="flex items-center gap-3">
                      <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab opacity-50 hover:opacity-100 active:cursor-grabbing" />
                      <div>
                        <h4 className={`font-medium ${isBlockComplete(block) ? 'line-through text-muted-foreground' : ''}`}>{block.title}</h4>
                        {block.taskId && (
                          <p className="text-[11px] text-primary flex items-center gap-1 mt-1">
                            <Link2 className="w-3 h-3" />
                            {getTaskForBlock(block.taskId)?.title ?? 'Linked task'}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(block.start), 'h:mm a')} - {format(new Date(block.end), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="ghost" className="h-8 w-8 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100" onClick={() => openEditBlock(block)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      {!isBlockComplete(block) && (
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-primary opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100" onClick={() => handleCompleteBlock(block)}>
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-primary opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100" onClick={() => openFocusForBlock(block.taskId)}>
                        <Play className="w-4 h-4" />
                      </Button>
                      <button onClick={() => deleteBlock(block.id)} className="text-muted-foreground hover:text-destructive opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Reorder.Item>
              ))}
            </AnimatePresence>
          </Reorder.Group>
        ) : (
          <DayView />
        )}
      </div>

      <Dialog open={!!editingBlock} onOpenChange={(open) => !open && setEditingBlock(null)}>
        <DialogContent className="sm:max-w-[460px] glass border-white/10">
          <DialogHeader>
            <DialogTitle>Edit Block</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Input
              placeholder="Block title"
              value={editDraft.title}
              onChange={e => setEditDraft({ ...editDraft, title: e.target.value })}
              className="bg-background/50"
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Input
                type="date"
                value={editDraft.date}
                onChange={e => setEditDraft({ ...editDraft, date: e.target.value })}
                className="bg-background/50"
              />
              <Input
                type="time"
                value={editDraft.startTime}
                onChange={e => setEditDraft({ ...editDraft, startTime: e.target.value })}
                className="bg-background/50"
              />
              <Input
                type="time"
                value={editDraft.endTime}
                onChange={e => setEditDraft({ ...editDraft, endTime: e.target.value })}
                className="bg-background/50"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Keep the block title specific and make sure the end time stays after the start time.
            </p>
            <Button className="w-full mint-glow" onClick={handleSaveBlock}>
              Save Block
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
