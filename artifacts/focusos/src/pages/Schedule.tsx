import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { format, isSameDay, parseISO, startOfDay, endOfDay, addMinutes, differenceInMinutes } from 'date-fns';
import { Clock, Plus, Trash2, GripVertical, AlertCircle, LayoutList, Calendar as CalendarIcon, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useLocation } from 'wouter';

export default function Schedule() {
  const [location, setLocation] = useLocation();
  const blocks = useStore(state => state.blocks);
  const tasks = useStore(state => state.tasks);
  const addBlock = useStore(state => state.addBlock);
  const deleteBlock = useStore(state => state.deleteBlock);
  const updateBlock = useStore(state => state.updateBlock);

  const [newTitle, setNewTitle] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [view, setView] = useState<'list' | 'day'>('list');

  const handleAdd = () => {
    if (!newTitle) return;
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

  const handleReorder = (newOrder: typeof todayBlocks) => {
    // Logic to visually reorder, though time-blocks are chronologically sorted.
    // Real reordering would require adjusting the start/end times.
    // For now we'll just update the state to match the reorder if they drag it.
  };

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
              className="absolute left-2 right-2 rounded-lg glass border-l-4 border-l-primary p-2 overflow-hidden shadow-lg group"
              style={{ top: `${top}rem`, height: `${height}rem` }}
              whileHover={{ zIndex: 10, scale: 1.02 }}
            >
              <div className="flex justify-between items-start h-full">
                <div>
                  <h4 className="font-bold text-sm leading-tight">{block.title}</h4>
                  {height > 2 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(bStart, 'h:mm')} - {format(bEnd, 'h:mm')}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setLocation('/focus')}>
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
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
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

      <div className="glass p-4 rounded-2xl flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[200px] space-y-1">
          <label className="text-xs text-muted-foreground ml-1">Block Title</label>
          <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Deep Work..." className="bg-background/50 border-white/10" />
        </div>
        <div className="w-24 space-y-1">
          <label className="text-xs text-muted-foreground ml-1">Start</label>
          <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="bg-background/50 border-white/10" />
        </div>
        <div className="w-24 space-y-1">
          <label className="text-xs text-muted-foreground ml-1">End</label>
          <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="bg-background/50 border-white/10" />
        </div>
        <Button onClick={handleAdd} className="mint-glow h-10 w-10 p-0">
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-primary" /> Today's Schedule</h3>
        
        {todayBlocks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground glass rounded-2xl">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No blocks scheduled for today.</p>
          </div>
        ) : view === 'list' ? (
          <Reorder.Group axis="y" values={todayBlocks} onReorder={handleReorder} className="space-y-3">
            <AnimatePresence>
              {todayBlocks.map((block) => (
                <Reorder.Item key={block.id} value={block} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                  <div className="p-4 rounded-xl glass border-l-4 border-l-primary flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab opacity-50 hover:opacity-100 active:cursor-grabbing" />
                      <div>
                        <h4 className="font-medium">{block.title}</h4>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(block.start), 'h:mm a')} - {format(new Date(block.end), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-primary opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setLocation('/focus')}>
                        <Play className="w-4 h-4" />
                      </Button>
                      <button onClick={() => deleteBlock(block.id)} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
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
    </div>
  );
}
