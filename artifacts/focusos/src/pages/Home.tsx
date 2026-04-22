import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { Target, CheckCircle2, AlertCircle, BookOpen, ChevronRight, Zap, Flame, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { format, isToday, differenceInHours, addDays } from 'date-fns';

export default function Home() {
  const [location, setLocation] = useLocation();
  const profile = useStore(state => state.profile);
  const tasks = useStore(state => state.tasks);
  const events = useStore(state => state.events);
  const sessions = useStore(state => state.sessions);

  const pendingTasks = tasks.filter(t => !t.completedAt);
  const overdueTasks = pendingTasks.filter(t => new Date(t.dueAt) < new Date());
  const todayTasks = pendingTasks.filter(t => isToday(new Date(t.dueAt)));
  
  const upcomingExams = events.filter(e => e.type === 'exam' && new Date(e.start) > new Date()).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  const examMode = upcomingExams.some(e => differenceInHours(new Date(e.start), new Date()) <= 48);

  const todaySessions = sessions.filter(s => isToday(new Date(s.startedAt)));
  const todayFocusMin = todaySessions.reduce((acc, s) => acc + s.actualMin, 0);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {examMode && (
        <div className="bg-destructive text-destructive-foreground px-4 py-2 rounded-xl text-center font-bold tracking-widest text-sm animate-pulse">
          EXAM MODE ACTIVE
        </div>
      )}

      <header className="mb-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{greeting()}, {profile.name || 'Commander'}.</h1>
            <p className="text-muted-foreground mt-1">Level {profile.level} • {profile.xp} XP</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-warning">
              <Flame className="w-5 h-5 fill-warning" />
              <span className="font-bold">{profile.streak.count} Day Streak</span>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, scaleX: 0 }} animate={{ opacity: 1, scaleX: 1 }} className="h-3 bg-secondary rounded-full mt-4 overflow-hidden relative">
          <motion.div 
            initial={{ width: 0 }} 
            animate={{ width: `${(profile.xp % 100)}%` }} 
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute inset-y-0 left-0 bg-primary mint-glow" 
          />
        </motion.div>
      </header>

      {/* Signal Center */}
      <div className="space-y-2">
        {overdueTasks.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
            <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">You have {overdueTasks.length} overdue task(s).</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => setLocation('/plan')} className="border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground">
                Rescue
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Swipeable Widgets */}
      <div className="flex overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 gap-4 snap-x hide-scrollbar">
        <Card className="glass min-w-[240px] flex-1 snap-start cursor-pointer hover:border-primary/50 transition-colors border-l-4 border-l-primary" onClick={() => setLocation('/plan')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold">{todayTasks.length}</h3>
            <p className="text-muted-foreground text-sm">Tasks due today</p>
          </CardContent>
        </Card>

        <Card className="glass min-w-[240px] flex-1 snap-start cursor-pointer hover:border-info/50 transition-colors border-l-4 border-l-info" onClick={() => setLocation('/analytics')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-full bg-info/20 flex items-center justify-center text-info">
                <Target className="w-5 h-5" />
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold">{todayFocusMin} <span className="text-sm font-normal text-muted-foreground">/ {profile.preferences.dailyGoalMin}m</span></h3>
            <p className="text-muted-foreground text-sm">Focus time today</p>
          </CardContent>
        </Card>
        
        <Card className="glass min-w-[240px] flex-1 snap-start cursor-pointer hover:border-warning/50 transition-colors border-l-4 border-l-warning" onClick={() => setLocation('/calendar')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center text-warning">
                <BookOpen className="w-5 h-5" />
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold">{upcomingExams.length}</h3>
            <p className="text-muted-foreground text-sm">Upcoming exams</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Button size="lg" className="w-full h-16 text-lg rounded-2xl mint-glow bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_30px_rgba(11,231,164,0.3)] hover:shadow-[0_0_40px_rgba(11,231,164,0.5)] transition-all" onClick={() => setLocation('/focus')}>
          <Zap className="w-6 h-6 mr-2 fill-current" />
          Start Focus Session
        </Button>
      </div>

      {upcomingExams.length > 0 && (
        <div className="mt-8 space-y-4">
          <h3 className="font-bold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-warning" /> Upcoming Exams
          </h3>
          <div className="space-y-3">
            {upcomingExams.slice(0, 3).map(exam => (
              <div key={exam.id} className="p-4 rounded-xl glass border-l-4 border-l-warning flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{exam.title}</h4>
                  <p className="text-sm text-muted-foreground">{format(new Date(exam.start), 'MMM d, h:mm a')}</p>
                </div>
                <div className="text-xs font-medium px-2 py-1 rounded bg-warning/20 text-warning">
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
