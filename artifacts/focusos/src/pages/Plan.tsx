import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, Clock, Plus, Trash2, Calendar, Target, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUndo } from '@/hooks/useUndo';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { useSwipeable } from 'react-swipeable';
import { addMinutes, format } from 'date-fns';
import { useLocation } from 'wouter';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Priority, Task } from '@/lib/types';
import { toast } from 'sonner';
import { buildAutoSchedulePlan } from '@/lib/scheduling';

const createDefaultDueAt = () => {
  const due = new Date();
  due.setHours(18, 0, 0, 0);
  return due.toISOString();
};

const toDateInputValue = (value: string) => format(new Date(value), 'yyyy-MM-dd');
const toTimeInputValue = (value: string) => format(new Date(value), 'HH:mm');

const mergeDateAndTime = (date: string, time: string) => {
  const parsed = new Date(`${date}T${time}`);
  return Number.isNaN(parsed.getTime()) ? createDefaultDueAt() : parsed.toISOString();
};

const createDraftTask = () => ({
  title: '',
  priority: 'medium' as Priority,
  estMin: 30,
  notes: '',
  subtaskInput: '',
  subtasks: [] as { id: string; title: string; completed: boolean }[],
  courseId: 'none',
  dueDate: toDateInputValue(createDefaultDueAt()),
  dueTime: '18:00',
});

const createScheduleDraft = (task: Task) => {
  const start = new Date();
  start.setMinutes(Math.ceil(start.getMinutes() / 15) * 15, 0, 0);
  if (start <= new Date()) {
    start.setMinutes(start.getMinutes() + 15);
  }
  const end = addMinutes(start, Math.max(task.estMin, 15));

  return {
    date: format(start, 'yyyy-MM-dd'),
    startTime: format(start, 'HH:mm'),
    endTime: format(end, 'HH:mm'),
  };
};

const getTaskCompletionPatch = (subtasks: { id: string; title: string; completed: boolean }[]) => {
  const allDone = subtasks.length > 0 && subtasks.every((subtask) => subtask.completed);
  return allDone ? new Date().toISOString() : undefined;
};

export default function Plan() {
  const [location, setLocation] = useLocation();
  const tasks = useStore(state => state.tasks);
  const addTask = useStore(state => state.addTask);
  const blocks = useStore(state => state.blocks);
  const addBlock = useStore(state => state.addBlock);
  const updateTask = useStore(state => state.updateTask);
  const completeTask = useStore(state => state.completeTask);
  const deleteTask = useStore(state => state.deleteTask);
  const courses = useStore(state => state.courses);

  const [newTask, setNewTask] = useState(createDraftTask);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTask, setEditTask] = useState(createDraftTask);
  const [schedulingTask, setSchedulingTask] = useState<Task | null>(null);
  const [scheduleDraft, setScheduleDraft] = useState({ date: '', startTime: '09:00', endTime: '10:00' });
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low' | 'overdue'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const undoDelete = useUndo(
    (task: Task) => deleteTask(task.id),
    (task: Task) => {
      addTask({
        title: task.title,
        priority: task.priority,
        estMin: task.estMin,
        dueAt: task.dueAt,
        notes: task.notes,
        subtasks: task.subtasks,
        courseId: task.courseId,
        completedAt: task.completedAt,
      });
    },
    'Task deleted'
  );

  const pendingTasks = tasks.filter(t => !t.completedAt).sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
  const urgentTaskCount = pendingTasks.filter((task) => task.priority === 'high' || new Date(task.dueAt) < new Date()).length;
  const scheduledTaskIds = new Set(blocks.filter((block) => block.taskId).map((block) => block.taskId));
  
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
      dueAt: mergeDateAndTime(newTask.dueDate, newTask.dueTime),
      notes: newTask.notes.trim() || undefined,
      subtasks: newTask.subtasks.length > 0 ? newTask.subtasks : undefined,
      courseId: newTask.courseId === 'none' ? undefined : newTask.courseId
    });
    setNewTask(createDraftTask());
  };

  const handleComplete = (id: string) => {
    completeTask(id);
  };

  const addSubtaskToDraft = (mode: 'new' | 'edit') => {
    const source = mode === 'new' ? newTask : editTask;
    const title = source.subtaskInput.trim();
    if (!title) return;

    const nextSubtask = { id: crypto.randomUUID(), title, completed: false };
    if (mode === 'new') {
      setNewTask({ ...newTask, subtasks: [...newTask.subtasks, nextSubtask], subtaskInput: '' });
    } else {
      setEditTask({ ...editTask, subtasks: [...editTask.subtasks, nextSubtask], subtaskInput: '' });
    }
  };

  const toggleDraftSubtask = (mode: 'new' | 'edit', subtaskId: string) => {
    if (mode === 'new') {
      setNewTask({
        ...newTask,
        subtasks: newTask.subtasks.map((subtask) => subtask.id === subtaskId ? { ...subtask, completed: !subtask.completed } : subtask),
      });
      return;
    }

    setEditTask({
      ...editTask,
      subtasks: editTask.subtasks.map((subtask) => subtask.id === subtaskId ? { ...subtask, completed: !subtask.completed } : subtask),
    });
  };

  const removeDraftSubtask = (mode: 'new' | 'edit', subtaskId: string) => {
    if (mode === 'new') {
      setNewTask({ ...newTask, subtasks: newTask.subtasks.filter((subtask) => subtask.id !== subtaskId) });
      return;
    }

    setEditTask({ ...editTask, subtasks: editTask.subtasks.filter((subtask) => subtask.id !== subtaskId) });
  };

  const openTaskEditor = (task: Task) => {
    setEditingTaskId(task.id);
    setEditTask({
      title: task.title,
      priority: task.priority,
      estMin: task.estMin,
      notes: task.notes ?? '',
      subtaskInput: '',
      subtasks: task.subtasks ?? [],
      courseId: task.courseId ?? 'none',
      dueDate: toDateInputValue(task.dueAt),
      dueTime: toTimeInputValue(task.dueAt),
    });
  };

  const handleSaveTask = () => {
    if (!editingTaskId || !editTask.title.trim()) return;
    updateTask(editingTaskId, {
      title: editTask.title,
      priority: editTask.priority,
      estMin: editTask.estMin,
      dueAt: mergeDateAndTime(editTask.dueDate, editTask.dueTime),
      notes: editTask.notes.trim() || undefined,
      subtasks: editTask.subtasks,
      completedAt: getTaskCompletionPatch(editTask.subtasks),
      courseId: editTask.courseId === 'none' ? undefined : editTask.courseId,
    });
    setEditingTaskId(null);
  };

  const openScheduleTask = (task: Task) => {
    setSchedulingTask(task);
    setScheduleDraft(createScheduleDraft(task));
  };

  const handleScheduleTask = () => {
    if (!schedulingTask) return;

    const start = new Date(`${scheduleDraft.date}T${scheduleDraft.startTime}`);
    const end = new Date(`${scheduleDraft.date}T${scheduleDraft.endTime}`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      toast.error('Choose a valid date and time');
      return;
    }

    if (end <= start) {
      toast.error('End time must be after start time');
      return;
    }

    const hasConflict = blocks.some((block) => {
      const blockStart = new Date(block.start);
      const blockEnd = new Date(block.end);
      return start < blockEnd && end > blockStart;
    });

    if (hasConflict) {
      toast.error('This slot overlaps with an existing block');
      return;
    }

    addBlock({
      title: schedulingTask.title,
      taskId: schedulingTask.id,
      start: start.toISOString(),
      end: end.toISOString(),
    });

    toast.success('Task added to your schedule');
    setSchedulingTask(null);
    setLocation('/schedule');
  };

  const startTaskFocus = (taskId: string) => {
    setLocation(`/focus?taskId=${taskId}`);
  };

  const handleAutoSchedule = () => {
    const plannedBlocks = buildAutoSchedulePlan(tasks, blocks);
    if (plannedBlocks.length === 0) {
      toast.error('No open slots found for overdue or high-priority tasks');
      return;
    }

    plannedBlocks.forEach((block) => addBlock(block));
    toast.success(`Scheduled ${plannedBlocks.length} urgent task block${plannedBlocks.length === 1 ? '' : 's'}`);
    setLocation('/schedule');
  };

  const SwipeableTask = ({ task, index }: { task: any, index: number }) => {
    const handlers = useSwipeable({
      onSwipedLeft: () => undoDelete(task),
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
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="rounded-full bg-background/50 px-2 py-1">
                      Due {format(new Date(task.dueAt), 'MMM d, h:mm a')}
                    </span>
                    {scheduledTaskIds.has(task.id) && (
                      <span className="rounded-full bg-primary/10 px-2 py-1 text-primary">
                        Scheduled
                      </span>
                    )}
                  </div>
                  {task.notes && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{task.notes}</p>
                  )}
                  {task.subtasks?.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {task.subtasks.filter((subtask: any) => subtask.completed).length}/{task.subtasks.length} subtasks done
                    </p>
                  )}
                </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); undoDelete(task); }} className="text-muted-foreground hover:text-destructive opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
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
                  <div className="mt-4 flex flex-col gap-2 border-t border-white/5 pt-4 sm:flex-row">
                    <Button size="sm" variant="outline" className="flex-1" onClick={(e) => { e.stopPropagation(); openTaskEditor(task); }}>
                      <Pencil className="w-4 h-4 mr-2" /> Edit
                    </Button>
                    <Button size="sm" variant="secondary" className="flex-1 mint-glow" onClick={(e) => { e.stopPropagation(); startTaskFocus(task.id); }}>
                      <Target className="w-4 h-4 mr-2" /> Focus
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1" onClick={(e) => { e.stopPropagation(); openScheduleTask(task); }}>
                      <Calendar className="w-4 h-4 mr-2" /> Schedule
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => openTaskEditor(task)}><Pencil className="w-4 h-4 mr-2"/> Edit Task</ContextMenuItem>
          <ContextMenuItem onClick={() => startTaskFocus(task.id)}><Target className="w-4 h-4 mr-2"/> Start Focus</ContextMenuItem>
          <ContextMenuItem onClick={() => openScheduleTask(task)}><Calendar className="w-4 h-4 mr-2"/> Schedule Task</ContextMenuItem>
          <ContextMenuItem className="text-destructive" onClick={() => undoDelete(task)}><Trash2 className="w-4 h-4 mr-2"/> Delete</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  };

  return (
    <div className="page-shell">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Plan.</h1>
        <Button onClick={handleAutoSchedule} variant="outline" className="w-full border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground sm:w-auto">
          Auto-Schedule {urgentTaskCount > 0 ? `(${urgentTaskCount})` : ''}
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="metric-card">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Open Tasks</p>
          <p className="mt-2 text-2xl font-bold">{pendingTasks.length}</p>
          <p className="mt-1 text-sm text-muted-foreground">Everything still on your radar.</p>
        </div>
        <div className="metric-card">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Urgent Now</p>
          <p className="mt-2 text-2xl font-bold">{urgentTaskCount}</p>
          <p className="mt-1 text-sm text-muted-foreground">High priority or already overdue.</p>
        </div>
        <div className="metric-card">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Scheduled</p>
          <p className="mt-2 text-2xl font-bold">{scheduledTaskIds.size}</p>
          <p className="mt-1 text-sm text-muted-foreground">Tasks already assigned time blocks.</p>
        </div>
      </div>

      <div className="section-card space-y-4">
        <div className="flex items-start gap-2">
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
        <div className="grid gap-2 text-sm sm:grid-cols-[120px_140px]">
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
        <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <Input
            type="date"
            value={newTask.dueDate}
            onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })}
            className="bg-background/50 border-white/10"
          />
          <Input
            type="time"
            value={newTask.dueTime}
            onChange={e => setNewTask({ ...newTask, dueTime: e.target.value })}
            className="bg-background/50 border-white/10"
          />
        </div>
        <div className="w-full">
          <Input
            type="number"
            min="5"
            step="5"
            placeholder="Estimated minutes"
            value={newTask.estMin}
            onChange={e => setNewTask({ ...newTask, estMin: Number(e.target.value) || 0 })}
            className="bg-background/50 border-white/10"
          />
        </div>
        <Textarea
          placeholder="Notes, links, or extra context..."
          value={newTask.notes}
          onChange={e => setNewTask({ ...newTask, notes: e.target.value })}
          className="bg-background/50 border-white/10 min-h-24"
        />
        <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="Add a subtask..."
              value={newTask.subtaskInput}
              onChange={e => setNewTask({ ...newTask, subtaskInput: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && addSubtaskToDraft('new')}
              className="bg-background/50 border-white/10"
            />
            <Button type="button" variant="outline" onClick={() => addSubtaskToDraft('new')}>
              Add
            </Button>
          </div>
          {newTask.subtasks.length > 0 && (
            <div className="space-y-2">
              {newTask.subtasks.map((subtask) => (
                <div key={subtask.id} className="flex items-center gap-2 rounded-xl bg-background/40 px-3 py-2 border border-white/5">
                  <button type="button" onClick={() => toggleDraftSubtask('new', subtask.id)} className="text-primary">
                    {subtask.completed ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                  </button>
                  <span className={`flex-1 text-sm ${subtask.completed ? 'line-through text-muted-foreground' : ''}`}>{subtask.title}</span>
                  <button type="button" onClick={() => removeDraftSubtask('new', subtask.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Tap a task to reveal actions. Swipe right to complete it, or swipe left to delete it.
        </p>
      </div>

      <div className="hide-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
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
          <div className="text-center py-12 text-muted-foreground glass rounded-2xl space-y-4">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-20 text-primary" />
            <div className="space-y-1">
              <p className="text-base font-medium text-foreground">
                {filter === 'all' ? 'All clear. Good job.' : `No ${filter} tasks right now.`}
              </p>
              <p>
                {filter === 'all'
                  ? 'Add your next task above or auto-schedule urgent work when it shows up.'
                  : 'Try another filter or head back to all tasks.'}
              </p>
            </div>
            {filter !== 'all' && (
              <Button variant="outline" onClick={() => setFilter('all')}>
                Show All Tasks
              </Button>
            )}
          </div>
        )}
      </div>

      <Dialog open={!!editingTaskId} onOpenChange={(open) => !open && setEditingTaskId(null)}>
        <DialogContent className="sm:max-w-[460px] glass border-white/10">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Input
              placeholder="Task title"
              value={editTask.title}
              onChange={e => setEditTask({ ...editTask, title: e.target.value })}
              className="bg-background/50"
            />
            <div className="grid grid-cols-2 gap-3">
              <Select value={editTask.priority} onValueChange={v => setEditTask({ ...editTask, priority: v as any })}>
                <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                min="5"
                step="5"
                value={editTask.estMin}
                onChange={e => setEditTask({ ...editTask, estMin: Number(e.target.value) || 0 })}
                className="bg-background/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="date"
                value={editTask.dueDate}
                onChange={e => setEditTask({ ...editTask, dueDate: e.target.value })}
                className="bg-background/50"
              />
              <Input
                type="time"
                value={editTask.dueTime}
                onChange={e => setEditTask({ ...editTask, dueTime: e.target.value })}
                className="bg-background/50"
              />
            </div>
            <Textarea
              placeholder="Notes, links, or extra context..."
              value={editTask.notes}
              onChange={e => setEditTask({ ...editTask, notes: e.target.value })}
              className="bg-background/50 min-h-24"
            />
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a subtask..."
                  value={editTask.subtaskInput}
                  onChange={e => setEditTask({ ...editTask, subtaskInput: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && addSubtaskToDraft('edit')}
                  className="bg-background/50"
                />
                <Button type="button" variant="outline" onClick={() => addSubtaskToDraft('edit')}>
                  Add
                </Button>
              </div>
              {editTask.subtasks.length > 0 && (
                <div className="space-y-2">
                  {editTask.subtasks.map((subtask) => (
                    <div key={subtask.id} className="flex items-center gap-2 rounded-xl bg-background/40 px-3 py-2 border border-white/5">
                      <button type="button" onClick={() => toggleDraftSubtask('edit', subtask.id)} className="text-primary">
                        {subtask.completed ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                      </button>
                      <span className={`flex-1 text-sm ${subtask.completed ? 'line-through text-muted-foreground' : ''}`}>{subtask.title}</span>
                      <button type="button" onClick={() => removeDraftSubtask('edit', subtask.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Select value={editTask.courseId} onValueChange={v => setEditTask({ ...editTask, courseId: v })}>
              <SelectTrigger className="bg-background/50"><SelectValue placeholder="Course" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Course</SelectItem>
                {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.code}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button className="w-full mint-glow" onClick={handleSaveTask}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!schedulingTask} onOpenChange={(open) => !open && setSchedulingTask(null)}>
        <DialogContent className="sm:max-w-[460px] glass border-white/10">
          <DialogHeader>
            <DialogTitle>Schedule Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="rounded-xl bg-background/40 p-3 border border-white/5">
              <div className="font-medium">{schedulingTask?.title}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Estimated focus: {schedulingTask?.estMin ?? 0} minutes
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Input
                type="date"
                value={scheduleDraft.date}
                onChange={e => setScheduleDraft({ ...scheduleDraft, date: e.target.value })}
                className="bg-background/50"
              />
              <Input
                type="time"
                value={scheduleDraft.startTime}
                onChange={e => setScheduleDraft({ ...scheduleDraft, startTime: e.target.value })}
                className="bg-background/50"
              />
              <Input
                type="time"
                value={scheduleDraft.endTime}
                onChange={e => setScheduleDraft({ ...scheduleDraft, endTime: e.target.value })}
                className="bg-background/50"
              />
            </div>
            <Button className="w-full mint-glow" onClick={handleScheduleTask}>
              Add To Schedule
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
