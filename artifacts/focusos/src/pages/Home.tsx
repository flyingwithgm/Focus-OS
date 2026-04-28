import React from 'react';
import { useLocation } from 'wouter';
import { useStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { Target, CheckCircle2, AlertCircle, BookOpen, ChevronRight, Zap, Flame, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { format, isToday, differenceInHours } from 'date-fns';

export default function Home() {
  const [, setLocation] = useLocation();
  const profile = useStore(state => state.profile);
  const tasks = useStore(state => state.tasks);
  const events = useStore(state => state.events);
  const blocks = useStore(state => state.blocks);
  const sessions = useStore(state => state.sessions);

  const pendingTasks = tasks.filter(t => !t.completedAt);
  const overdueTasks = pendingTasks.filter(t => new Date(t.dueAt) < new Date());
  const todayTasks = pendingTasks.filter(t => isToday(new Date(t.dueAt)));

  const upcomingExams = events
    .filter(e => e.type === 'exam' && new Date(e.start) > new Date())
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  const examMode = upcomingExams.some(e => differenceInHours(new Date(e.start), new Date()) <= 48);

  const todaySessions = sessions.filter(s => isToday(new Date(s.startedAt)));
  const todayFocusMin = todaySessions.reduce((acc, s) => acc + s.actualMin, 0);
  const todayBlocks = blocks.filter(block => isToday(new Date(block.start)));
  const completedTodayBlocks = todayBlocks.filter(
    block => block.completedAt || (block.taskId && tasks.find(task => task.id === block.taskId)?.completedAt)
  );
  const plannedTodayMin = todayBlocks.reduce(
    (acc, block) => acc + Math.max(0, (new Date(block.end).getTime() - new Date(block.start).getTime()) / 60000),
    0
  );
  const completedTodayMin = completedTodayBlocks.reduce(
    (acc, block) => acc + Math.max(0, (new Date(block.end).getTime() - new Date(block.start).getTime()) / 60000),
    0
  );

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="page-shell">
      {examMode && (
        <div className="rounded-2xl bg-destructive px-4 py-2 text-center text-sm font-bold tracking-widest text-destructive-foreground animate-pulse">
          EXAM MODE ACTIVE
        </div>
      )}

      <header className="section-card overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"
        >
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Daily cockpit</div>
            <h1 className="balanced-title">{greeting()}, {profile.name || 'Commander'}.</h1>
            <p className="text-muted-foreground">Level {profile.level} • {profile.xp} XP</p>
          </div>
          <div className="self-start rounded-2xl bg-background/40 px-4 py-3 sm:text-right">
            <div className="flex items-center gap-1 text-warning sm:justify-end">
              <Flame className="w-5 h-5 fill-warning" />
              <span className="font-bold">{profile.streak.count} Day Streak</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Keep momentum alive today.</p>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          className="relative mt-5 h-3 overflow-hidden rounded-full bg-background/60"
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${profile.xp % 100}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="absolute inset-y-0 left-0 bg-primary mint-glow"
          />
        </motion.div>
      </header>

      <div className="space-y-2">
        {overdueTasks.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
            <div className="flex flex-col gap-4 rounded-[1.4rem] border border-destructive/20 bg-destructive/10 p-4 text-destructive sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">You have {overdueTasks.length} overdue task(s).</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation('/plan')}
                className="w-full border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground sm:w-auto"
              >
                Rescue
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      <div className="mobile-scroll-row hide-scrollbar sm:grid-cols-2 xl:grid-cols-4">
        <Card
          className="glass min-w-[250px] snap-start cursor-pointer border-l-4 border-l-primary transition-colors hover:border-primary/50 sm:min-w-0"
          onClick={() => setLocation('/plan')}
        >
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold">{todayTasks.length}</h3>
            <p className="text-sm text-muted-foreground">Tasks due today</p>
          </CardContent>
        </Card>

        <Card
          className="glass min-w-[250px] snap-start cursor-pointer border-l-4 border-l-info transition-colors hover:border-info/50 sm:min-w-0"
          onClick={() => setLocation('/analytics')}
        >
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-info/20 text-info">
                <Target className="w-5 h-5" />
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold">
              {todayFocusMin} <span className="text-sm font-normal text-muted-foreground">/ {profile.preferences.dailyGoalMin}m</span>
            </h3>
            <p className="text-sm text-muted-foreground">Focus time today</p>
          </CardContent>
        </Card>

        <Card
          className="glass min-w-[250px] snap-start cursor-pointer border-l-4 border-l-warning transition-colors hover:border-warning/50 sm:min-w-0"
          onClick={() => setLocation('/calendar')}
        >
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/20 text-warning">
                <BookOpen className="w-5 h-5" />
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold">{upcomingExams.length}</h3>
            <p className="text-sm text-muted-foreground">Upcoming exams</p>
          </CardContent>
        </Card>

        <Card
          className="glass min-w-[250px] snap-start cursor-pointer border-l-4 border-l-primary/70 transition-colors hover:border-primary/50 sm:min-w-0"
          onClick={() => setLocation('/schedule')}
        >
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary">
                <CalendarClock className="w-5 h-5" />
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold">
              {completedTodayMin}<span className="text-sm font-normal text-muted-foreground"> / {plannedTodayMin || 0}m</span>
            </h3>
            <p className="text-sm text-muted-foreground">Scheduled work completed today</p>
          </CardContent>
        </Card>
      </div>

      <Button
        size="lg"
        className="mt-2 h-16 w-full rounded-2xl bg-primary text-lg text-primary-foreground shadow-[0_0_30px_rgba(11,231,164,0.3)] transition-all hover:bg-primary/90 hover:shadow-[0_0_40px_rgba(11,231,164,0.5)] mint-glow"
        onClick={() => setLocation('/focus')}
      >
        <Zap className="mr-2 h-6 w-6 fill-current" />
        Start Focus Session
      </Button>

      {upcomingExams.length > 0 && (
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 font-bold">
            <BookOpen className="w-5 h-5 text-warning" /> Upcoming Exams
          </h3>
          <div className="space-y-3">
            {upcomingExams.slice(0, 3).map(exam => (
              <div key={exam.id} className="glass flex items-center justify-between rounded-xl border-l-4 border-l-warning p-4">
                <div>
                  <h4 className="font-medium">{exam.title}</h4>
                  <p className="text-sm text-muted-foreground">{format(new Date(exam.start), 'MMM d, h:mm a')}</p>
                </div>
                <div className="rounded bg-warning/20 px-2 py-1 text-xs font-medium text-warning">
                  {differenceInHours(new Date(exam.start), new Date()) <= 48 ? 'SOON' : `${format(new Date(exam.start), 'd')} days left`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
