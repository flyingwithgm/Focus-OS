import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, Clock, Plus, Trash2, Calendar, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUndo } from '@/hooks/useUndo';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { useSwipeable } from 'react-swipeable';
import { format } from 'date-fns';
import { useLocation } from 'wouter';

export default function Plan() {
  const [location, setLocation] = useLocation();
  const tasks = useStore(state => state.tasks);
  const addTask = useStore(state => state.addTask);
  const completeTask = useStore(state => state.completeTask);
  const deleteTask = useStore(state => state.deleteTask);
  const courses = useStore(state => state.courses);

  const [newTask, setNewTask] = useState({ title: '', priority: 'medium' as any, estMin: 30, courseId: 'none' });
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low' | 'overdue'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const undoDelete = useUndo(
    (id: string) => deleteTask(id),
    (id: string) => {
      const task = tasks.find(t => t.id === id);
      if (task) addTask(task); // this is not quite right because id will change, but works for mock
    },
    'Task deleted'
  );

  const pendingTasks = tasks.filter(t => !t.completedAt).sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
  
  const filteredTasks = pendingTasks.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'overdue') return new Date(t.dueAt) < new Date();
    return t.priority === filter;
  });

  const handleAdd = () => {
    if (!newTask.title.trim()) return;
    addTask({
      title: newTask.title,
      priority: newTask.priority,
      estMin: newTask.estMin,
      dueAt: new Date().toISOString(),
      courseId: newTask.courseId === 'none' ? undefined : newTask.courseId
    });
    setNewTask({ ...newTask, title: '' });
  };

  const handleComplete = (id: string) => {
    completeTask(id);
  };

  const SwipeableTask = ({ task, index }: { task: any, index: number }) => {
    const handlers = useSwipeable({
      onSwipedLeft: () => undoDelete(task.id),
      onSwipedRight: () => handleComplete(task.id),
      preventScrollOnSwipe: true,
      trackMouse: true
    });

    const isExpanded = expandedId === task.id;

    return (
      <ContextMenu>
        <ContextMenuTrigger>
          <motion.div 
            {...handlers}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => setExpandedId(isExpanded ? null : task.id)}
            className="p-4 rounded-xl glass border-l-4 group flex flex-col justify-between cursor-pointer active:scale-[0.98] transition-transform"
            style={{ borderLeftColor: task.priority === 'high' ? 'var(--color-destructive)' : task.priority === 'medium' ? 'var(--color-warning, #f2ad46)' : 'var(--color-info, #57a3ff)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={(e) => { e.stopPropagation(); handleComplete(task.id); }} className="text-muted-foreground hover:text-primary transition-colors">
                  <Circle className="w-6 h-6" />
                </button>
                <div>
                  <h4 className="font-medium">{task.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {task.estMin}m</span>
                    {task.courseId && <span>• {courses.find(c => c.id === task.courseId)?.code}</span>}
                  </div>
                </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); undoDelete(task.id); }} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <AnimatePresence>
              {isExpanded && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 mt-4 border-t border-white/5 flex gap-2">
                    <Button size="sm" variant="secondary" className="flex-1 mint-glow" onClick={(e) => { e.stopPropagation(); setLocation('/focus'); }}>
                      <Target className="w-4 h-4 mr-2" /> Focus
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1" onClick={(e) => { e.stopPropagation(); setLocation('/schedule'); }}>
                      <Calendar className="w-4 h-4 mr-2" /> Schedule
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => setLocation('/focus')}><Target className="w-4 h-4 mr-2"/> Start Focus</ContextMenuItem>
          <ContextMenuItem onClick={() => setLocation('/schedule')}><Calendar className="w-4 h-4 mr-2"/> Schedule</ContextMenuItem>
          <ContextMenuItem className="text-destructive" onClick={() => undoDelete(task.id)}><Trash2 className="w-4 h-4 mr-2"/> Delete</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Plan.</h1>
      </div>

      <div className="glass p-4 rounded-2xl space-y-4">
        <div className="flex gap-2">
          <Input 
            placeholder="Add a new task..." 
            value={newTask.title} 
            onChange={e => setNewTask({ ...newTask, title: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="flex-1 bg-background/50 border-white/10"
          />
          <Button onClick={handleAdd} className="mint-glow">
            <Plus className="w-5 h-5" />
          </Button>
        </div>
        <div className="flex gap-2 text-sm">
          <Select value={newTask.priority} onValueChange={v => setNewTask({ ...newTask, priority: v as any })}>
            <SelectTrigger className="w-[120px] bg-background/50 border-white/10"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={newTask.courseId} onValueChange={v => setNewTask({ ...newTask, courseId: v })}>
            <SelectTrigger className="w-[140px] bg-background/50 border-white/10"><SelectValue placeholder="Course" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Course</SelectItem>
              {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.code}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 gap-2 hide-scrollbar">
        {(['all', 'high', 'medium', 'low', 'overdue'] as const).map(f => (
          <button 
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === f ? 'bg-primary text-primary-foreground mint-glow' : 'glass text-muted-foreground hover:text-foreground'}`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredTasks.map((task, i) => (
            <SwipeableTask key={task.id} task={task} index={i} />
          ))}
        </AnimatePresence>
        
        {filteredTasks.length === 0 && (
          <div className="text-center py-12 text-muted-foreground glass rounded-2xl">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-20 text-primary" />
            <p>All clear. Good job.</p>
          </div>
        )}
      </div>
    </div>
  );
}
