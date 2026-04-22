import React from 'react';
import { useStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, Clock, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function Plan() {
  const tasks = useStore(state => state.tasks);
  const addTask = useStore(state => state.addTask);
  const completeTask = useStore(state => state.completeTask);
  const deleteTask = useStore(state => state.deleteTask);
  const courses = useStore(state => state.courses);

  const [newTask, setNewTask] = React.useState({ title: '', priority: 'medium' as any, estMin: 30, courseId: 'none' });

  const pendingTasks = tasks.filter(t => !t.completedAt).sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
  const completedTasks = tasks.filter(t => t.completedAt).sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());

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
    toast.success('Task completed!', {
      action: {
        label: 'Undo',
        onClick: () => useStore.getState().updateTask(id, { completedAt: undefined })
      }
    });
  };

  const handleDelete = (id: string) => {
    const task = tasks.find(t => t.id === id);
    deleteTask(id);
    toast.success('Task deleted', {
      action: {
        label: 'Undo',
        onClick: () => {
          if (task) useStore.getState().addTask(task);
        }
      }
    });
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

      <div className="space-y-3">
        <AnimatePresence>
          {pendingTasks.map((task, i) => (
            <motion.div 
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-xl glass border-l-4 group flex items-center justify-between"
              style={{ borderLeftColor: task.priority === 'high' ? 'var(--color-destructive)' : task.priority === 'medium' ? 'var(--color-warning, #f2ad46)' : 'var(--color-info, #57a3ff)' }}
            >
              <div className="flex items-center gap-3">
                <button onClick={() => handleComplete(task.id)} className="text-muted-foreground hover:text-primary transition-colors">
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
              <button onClick={() => handleDelete(task.id)} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {pendingTasks.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>All clear. Good job.</p>
          </div>
        )}
      </div>
    </div>
  );
}
