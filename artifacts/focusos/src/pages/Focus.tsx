import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, X, Music, Volume2, Target, Settings2, SkipForward, Link2, Calendar, CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { audioPlayer } from '@/lib/audio';
import { toast } from 'sonner';
import { checkAchievements } from '@/lib/achievements';
import confetti from 'canvas-confetti';

export default function Focus() {
  const [location, setLocation] = useLocation();
  const profile = useStore(state => state.profile);
  const tasks = useStore(state => state.tasks);
  const courses = useStore(state => state.courses);
  const updateTask = useStore(state => state.updateTask);
  const activeSessionId = useStore(state => state.activeFocusSessionId);
  const setActiveSession = useStore(state => state.setActiveFocusSessionId);
  const addSession = useStore(state => state.addSession);
  const addXP = useStore(state => state.addXP);
  const addBlock = useStore(state => state.addBlock);

  const [phase, setPhase] = useState<'config' | 'timer' | 'quality'>('config');
  const [timeLeft, setTimeLeft] = useState(profile.preferences.sessionMin * 60);
  const [isActive, setIsActive] = useState(false);
  const [showMusic, setShowMusic] = useState(false);
  const [volume, setVolume] = useState(50);
  const [track, setTrack] = useState<'ambient' | 'lofi' | 'rain' | null>(null);

  const [pomodoro, setPomodoro] = useState({ workMin: profile.preferences.sessionMin, breakMin: profile.preferences.breakMin, cycles: 4 });
  const [currentCycle, setCurrentCycle] = useState(1);
  const [isBreak, setIsBreak] = useState(false);

  const timerRef = useRef<number | null>(null);
  const totalTime = (isBreak ? pomodoro.breakMin : pomodoro.workMin) * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;
  const searchParams = new URLSearchParams(window.location.search);
  const taskId = searchParams.get('taskId');
  const linkedTask = tasks.find(task => task.id === taskId);
  const linkedCourse = courses.find(course => course.id === linkedTask?.courseId);
  const completedSubtasks = linkedTask?.subtasks?.filter(subtask => subtask.completed).length ?? 0;
  const totalSubtasks = linkedTask?.subtasks?.length ?? 0;

  const toggleLinkedSubtask = (subtaskId: string) => {
    if (!linkedTask?.subtasks) return;
    const nextSubtasks = linkedTask.subtasks.map((subtask) =>
      subtask.id === subtaskId ? { ...subtask, completed: !subtask.completed } : subtask
    );
    const allDone = nextSubtasks.length > 0 && nextSubtasks.every((subtask) => subtask.completed);
    updateTask(linkedTask.id, {
      subtasks: nextSubtasks,
      completedAt: allDone ? new Date().toISOString() : undefined,
    });
  };

  const handleCycleComplete = useCallback(() => {
    audioPlayer.stop();
    setIsActive(false);
    
    if (isBreak) {
      setIsBreak(false);
      setTimeLeft(pomodoro.workMin * 60);
      if (currentCycle >= pomodoro.cycles) {
        setPhase('quality');
      } else {
        setCurrentCycle(c => c + 1);
      }
    } else {
      setIsBreak(true);
      setTimeLeft(pomodoro.breakMin * 60);
      toast.info('Time for a break!');
    }
  }, [isBreak, pomodoro, currentCycle]);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      handleCycleComplete();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft, handleCycleComplete]);

  useEffect(() => {
    return () => {
      audioPlayer.stop();
    };
  }, []);

  const handlePlayPause = useCallback(() => {
    setIsActive(!isActive);
    if (!isActive && track && !isBreak) {
      audioPlayer.resume();
    } else if (isActive) {
      audioPlayer.pause();
    }
  }, [isActive, track, isBreak]);

  const submitSession = useCallback((quality: 'done' | 'partial' | 'rescheduled') => {
    const actualMin = Math.round((pomodoro.workMin * 60 - timeLeft) / 60) + ((currentCycle - 1) * pomodoro.workMin);
    addSession({
      startedAt: new Date(Date.now() - actualMin * 60000).toISOString(),
      endedAt: new Date().toISOString(),
      plannedMin: pomodoro.workMin * pomodoro.cycles,
      actualMin: Math.max(1, actualMin),
      quality,
      taskId: linkedTask?.id,
    });
    
    let xpEarned = 0;
    if (quality === 'done') xpEarned = 10;
    else if (quality === 'partial') xpEarned = 5;
    else xpEarned = 1;
    
    addXP(xpEarned);
    
    if (quality === 'rescheduled') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      addBlock({
        title: linkedTask ? `${linkedTask.title} (Rescheduled)` : 'Rescheduled Session',
        taskId: linkedTask?.id,
        start: tomorrow.toISOString(),
        end: new Date(tomorrow.getTime() + pomodoro.workMin * 60000).toISOString()
      });
    }
    
    if (Math.floor(profile.xp / 100) < Math.floor((profile.xp + xpEarned) / 100)) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#0be7a4', '#57a3ff', '#f2ad46'] });
      toast.success('Level Up!', { icon: '⭐' });
    } else {
      toast.success(`Session logged! +${xpEarned} XP`);
    }

    checkAchievements();
    setActiveSession(null);
    setLocation('/');
  }, [pomodoro, timeLeft, currentCycle, addSession, addXP, addBlock, profile.xp, setActiveSession, setLocation, linkedTask]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phase === 'timer') {
        if (e.code === 'Space') {
          e.preventDefault();
          handlePlayPause();
        }
      } else if (phase === 'quality') {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          submitSession('done');
        } else if (e.key === 'Enter' && e.shiftKey) {
          submitSession('partial');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, handlePlayPause, submitSession]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (phase === 'timer' && isActive) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [phase, isActive]);

  const startTimer = () => {
    setPhase('timer');
    setTimeLeft(pomodoro.workMin * 60);
    setIsActive(true);
    if (!activeSessionId) {
      setActiveSession(crypto.randomUUID());
    }
  };

  const handleTrackChange = (newTrack: 'ambient' | 'lofi' | 'rain') => {
    if (track === newTrack) {
      audioPlayer.pause();
      setTrack(null);
    } else {
      setTrack(newTrack);
      audioPlayer.play(newTrack);
    }
  };

  const handleVolumeChange = (vals: number[]) => {
    const v = vals[0];
    setVolume(v);
    audioPlayer.setVolume(v / 100);
  };

  const handleEndEarly = () => {
    if (confirm('Are you sure you want to end this session early?')) {
      setIsActive(false);
      audioPlayer.stop();
      setPhase('quality');
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (phase === 'config') {
    return (
      <div className="max-w-2xl mx-auto space-y-8 p-4 mt-8">
        <h1 className="text-3xl font-bold tracking-tight text-center mb-8">Focus Setup</h1>
        
        <div className="glass p-6 rounded-3xl space-y-6">
          {!linkedTask && (
            <div className="rounded-2xl border border-white/10 bg-background/40 p-4">
              <div className="text-sm font-semibold">No linked task</div>
              <p className="mt-2 text-sm text-muted-foreground">
                You can still start a free-form focus session, or launch focus from Plan or Schedule to keep your work connected.
              </p>
            </div>
          )}
          {linkedTask && (
            <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Link2 className="w-4 h-4" /> Linked Task
              </div>
              <div className="mt-2 text-lg font-bold">{linkedTask.title}</div>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Due {new Date(linkedTask.dueAt).toLocaleString()}
                </span>
                {linkedCourse && <span>{linkedCourse.code}</span>}
                <span>{linkedTask.estMin} min planned</span>
                {totalSubtasks > 0 && <span>{completedSubtasks}/{totalSubtasks} subtasks done</span>}
              </div>
              {linkedTask.notes && (
                <p className="mt-3 text-sm text-muted-foreground">{linkedTask.notes}</p>
              )}
              {totalSubtasks > 0 && (
                <div className="mt-4 space-y-2">
                  {linkedTask.subtasks?.map((subtask) => (
                    <button
                      key={subtask.id}
                      type="button"
                      onClick={() => toggleLinkedSubtask(subtask.id)}
                      className="flex w-full items-center gap-3 rounded-xl border border-white/5 bg-background/40 px-3 py-2 text-left"
                    >
                      {subtask.completed ? <CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> : <Circle className="w-4 h-4 text-muted-foreground shrink-0" />}
                      <span className={`text-sm ${subtask.completed ? 'line-through text-muted-foreground' : ''}`}>{subtask.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            <Label className="text-muted-foreground uppercase tracking-wider text-xs font-bold mb-4 block">Presets</Label>
            <div className="flex flex-wrap gap-3">
              {[25, 45, 60, 90].map(m => (
                <Button key={m} variant={pomodoro.workMin === m ? 'default' : 'secondary'} className={`rounded-full ${pomodoro.workMin === m ? 'mint-glow' : ''}`} onClick={() => setPomodoro({ ...pomodoro, workMin: m })}>
                  {m} min
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/5">
            <Label className="text-muted-foreground uppercase tracking-wider text-xs font-bold mb-2 flex items-center gap-2">
              <Settings2 className="w-4 h-4" /> Pomodoro Customizer
            </Label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Work (min)</Label>
                <Input type="number" value={pomodoro.workMin} onChange={e => setPomodoro({ ...pomodoro, workMin: parseInt(e.target.value) || 25 })} className="bg-background/50" />
              </div>
              <div className="space-y-2">
                <Label>Break (min)</Label>
                <Input type="number" value={pomodoro.breakMin} onChange={e => setPomodoro({ ...pomodoro, breakMin: parseInt(e.target.value) || 5 })} className="bg-background/50" />
              </div>
              <div className="space-y-2">
                <Label>Cycles</Label>
                <Input type="number" value={pomodoro.cycles} onChange={e => setPomodoro({ ...pomodoro, cycles: parseInt(e.target.value) || 1 })} className="bg-background/50" />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/5">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-muted-foreground uppercase tracking-wider text-xs font-bold flex items-center gap-2">
                <Music className="w-4 h-4" /> Focus Audio
              </Label>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant={track === 'lofi' ? 'default' : 'secondary'} className={`rounded-full ${track === 'lofi' ? 'mint-glow' : ''}`} onClick={() => handleTrackChange('lofi')}>Lo-Fi</Button>
              <Button size="sm" variant={track === 'ambient' ? 'default' : 'secondary'} className={`rounded-full ${track === 'ambient' ? 'mint-glow' : ''}`} onClick={() => handleTrackChange('ambient')}>Ambient</Button>
              <Button size="sm" variant={track === 'rain' ? 'default' : 'secondary'} className={`rounded-full ${track === 'rain' ? 'mint-glow' : ''}`} onClick={() => handleTrackChange('rain')}>Rain</Button>
            </div>
            {track && (
              <div className="flex items-center gap-4 mt-2">
                <Volume2 className="w-4 h-4 text-muted-foreground" />
                <Slider value={[volume]} min={0} max={100} step={1} onValueChange={handleVolumeChange} className="flex-1" />
              </div>
            )}
          </div>
        </div>

        <Button size="lg" className="w-full h-16 text-xl rounded-2xl mint-glow" onClick={startTimer}>
          Start Focus
        </Button>
      </div>
    );
  }

  if (phase === 'quality') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background p-4 text-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-sm w-full space-y-6">
          <Target className="w-16 h-16 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-bold">Session Complete</h2>
          <p className="text-muted-foreground">
            {linkedTask ? `How did "${linkedTask.title}" go?` : 'How was your focus?'}
          </p>
          
          <div className="flex flex-col gap-3 mt-8">
            <Button size="lg" className="w-full text-lg mint-glow h-14" onClick={() => submitSession('done')}>
              Focused (Done) <span className="text-primary-foreground/70 ml-auto">+10 XP</span>
            </Button>
            <Button size="lg" variant="secondary" className="w-full text-lg h-14" onClick={() => submitSession('partial')}>
              Okay (Partial) <span className="text-foreground/50 ml-auto">+5 XP</span>
            </Button>
            <Button size="lg" variant="outline" className="w-full text-lg border-white/10 h-14" onClick={() => submitSession('rescheduled')}>
              Distracted (Reschedule) <span className="text-foreground/50 ml-auto">+1 XP</span>
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden px-4 transition-colors duration-1000 ${isBreak ? 'bg-[#0a1835]' : 'bg-background'}`}>
      <div 
        className="absolute inset-0 opacity-10 transition-opacity duration-1000 pointer-events-none"
        style={{ 
          background: `radial-gradient(circle at center, ${isBreak ? 'var(--color-info)' : 'var(--color-primary)'} 0%, transparent ${Math.max(30, progress)}%)` 
        }}
      />

      <div className="absolute left-4 right-4 top-4 z-10 flex items-center justify-between sm:left-6 sm:right-6 sm:top-6">
        <Button variant="ghost" size="icon" onClick={handleEndEarly} className="rounded-full text-muted-foreground hover:bg-destructive/20 hover:text-destructive">
          <X className="w-6 h-6" />
        </Button>
        <div className={`glass px-4 py-1.5 rounded-full text-sm font-medium tracking-widest uppercase border ${isBreak ? 'text-info border-info/30' : 'text-primary border-primary/30'}`}>
          {isBreak ? 'BREAK' : 'FOCUS'} • {currentCycle}/{pomodoro.cycles}
        </div>
        <Button variant="ghost" size="icon" onClick={() => setShowMusic(!showMusic)} className={`rounded-full transition-colors ${showMusic || track ? 'text-primary mint-glow bg-primary/10' : 'text-muted-foreground'}`}>
          <Music className="w-6 h-6" />
        </Button>
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {linkedTask && (
          <div className="mb-6 w-full max-w-xl space-y-3 px-2 sm:px-0">
            <div className="rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm text-primary text-center">
              Focusing on: <span className="font-semibold">{linkedTask.title}</span>
            </div>
            {totalSubtasks > 0 && (
              <div className="rounded-2xl border border-white/10 bg-background/40 p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="text-sm font-semibold">Checklist</div>
                  <div className="text-xs text-muted-foreground">{completedSubtasks}/{totalSubtasks} done</div>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {linkedTask.subtasks?.map((subtask) => (
                    <button
                      key={subtask.id}
                      type="button"
                      onClick={() => toggleLinkedSubtask(subtask.id)}
                      className="flex w-full items-center gap-3 rounded-xl border border-white/5 bg-background/50 px-3 py-2 text-left"
                    >
                      {subtask.completed ? <CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> : <Circle className="w-4 h-4 text-muted-foreground shrink-0" />}
                      <span className={`text-sm ${subtask.completed ? 'line-through text-muted-foreground' : ''}`}>{subtask.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        <div className="relative mb-8 h-72 w-72 sm:mb-12 sm:h-96 sm:w-96">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="50%" cy="50%" r="48%" className="stroke-secondary fill-none" strokeWidth="8" />
            <circle 
              cx="50%" cy="50%" r="48%" 
              className={`fill-none transition-all duration-1000 ease-linear ${isBreak ? 'stroke-info drop-shadow-[0_0_15px_rgba(87,163,255,0.5)]' : 'stroke-primary drop-shadow-[0_0_15px_rgba(11,231,164,0.5)]'}`} 
              strokeWidth="8" 
              strokeLinecap="round"
              strokeDasharray="300%"
              strokeDashoffset={`${300 - (progress * 3)}%`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-6xl sm:text-8xl font-bold tabular-nums tracking-tighter drop-shadow-lg">
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        <div className="flex gap-3 sm:gap-4">
          <Button 
            size="lg" 
            className={`h-16 w-16 rounded-full sm:h-20 sm:w-20 ${isActive ? 'bg-secondary hover:bg-secondary/80 text-foreground' : `${isBreak ? 'bg-info shadow-info/30' : 'bg-primary mint-glow shadow-primary/30'} text-primary-foreground shadow-lg`} transition-all duration-300 transform hover:scale-105 active:scale-95`}
            onClick={handlePlayPause}
          >
            {isActive ? <Pause className="h-7 w-7 sm:h-8 sm:w-8" /> : <Play className="ml-1 h-7 w-7 sm:h-8 sm:w-8" />}
          </Button>
          
          <Button size="icon" variant="ghost" className="h-16 w-16 rounded-full bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground sm:h-20 sm:w-20" onClick={handleCycleComplete}>
            <SkipForward className="h-5 w-5 sm:h-6 sm:w-6" />
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {showMusic && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="absolute bottom-12 left-1/2 -translate-x-1/2 glass rounded-2xl p-6 w-[90%] max-w-md z-20 shadow-2xl border-white/10"
          >
            <h3 className="font-bold mb-4 flex items-center gap-2"><Music className="w-4 h-4" /> Focus Audio</h3>
            <div className="flex justify-between gap-2 mb-6">
              <Button variant={track === 'lofi' ? 'default' : 'secondary'} className={track === 'lofi' ? 'mint-glow' : ''} onClick={() => handleTrackChange('lofi')}>Lo-Fi</Button>
              <Button variant={track === 'ambient' ? 'default' : 'secondary'} className={track === 'ambient' ? 'mint-glow' : ''} onClick={() => handleTrackChange('ambient')}>Ambient</Button>
              <Button variant={track === 'rain' ? 'default' : 'secondary'} className={track === 'rain' ? 'mint-glow' : ''} onClick={() => handleTrackChange('rain')}>Rain</Button>
            </div>
            {track && (
              <div className="flex items-center gap-4">
                <Volume2 className="w-5 h-5 text-muted-foreground" />
                <Slider value={[volume]} min={0} max={100} step={1} onValueChange={handleVolumeChange} className="flex-1" />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
