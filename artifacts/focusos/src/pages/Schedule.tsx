import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { Clock, Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Schedule() {
  const blocks = useStore(state => state.blocks);
  const addBlock = useStore(state => state.addBlock);
  const deleteBlock = useStore(state => state.deleteBlock);

  const [newTitle, setNewTitle] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');

  const handleAdd = () => {
    if (!newTitle) return;
    const now = new Date();
    const startParts = startTime.split(':');
    const endParts = endTime.split(':');
    
    const start = new Date(now.setHours(parseInt(startParts[0]), parseInt(startParts[1]), 0)).toISOString();
    const end = new Date(now.setHours(parseInt(endParts[0]), parseInt(endParts[1]), 0)).toISOString();

    addBlock({ title: newTitle, start, end });
    setNewTitle('');
  };

  const todayBlocks = blocks
    .filter(b => isSameDay(new Date(b.start), new Date()))
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Time Blocks.</h1>
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
        ) : (
          todayBlocks.map((block) => (
            <div key={block.id} className="p-4 rounded-xl glass border-l-4 border-l-primary flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab opacity-50 hover:opacity-100" />
                <div>
                  <h4 className="font-medium">{block.title}</h4>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(block.start), 'h:mm a')} - {format(new Date(block.end), 'h:mm a')}
                  </p>
                </div>
              </div>
              <button onClick={() => deleteBlock(block.id)} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
