import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, AlertCircle, TrendingUp, Zap, Calendar, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, subDays, isSameDay } from 'date-fns';
import { toast } from 'sonner';
import { useLocation } from 'wouter';

export default function Hub() {
  const [, setLocation] = useLocation();
  const profile = useStore(state => state.profile);
  const tasks = useStore(state => state.tasks);
  const sessions = useStore(state => state.sessions);
  const addMoodLog = useStore(state => state.addMoodLog);
  const moodLogs = useStore(state => state.moodLogs);
  const addBlock = useStore(state => state.addBlock);

  const pendingTasks = tasks.filter(t => !t.completedAt);
  const overdueTasks = pendingTasks.filter(t => new Date(t.dueAt) < new Date());

  const thisWeekSessions = sessions.filter(s => new Date(s.startedAt) >= subDays(new Date(), 7));
  const lastWeekSessions = sessions.filter(s => new Date(s.startedAt) >= subDays(new Date(), 14) && new Date(s.startedAt) < subDays(new Date(), 7));

  const thisWeekMin = thisWeekSessions.reduce((acc, s) => acc + s.actualMin, 0);
  const lastWeekMin = lastWeekSessions.reduce((acc, s) => acc + s.actualMin, 0);
  const focusDelta = lastWeekMin === 0 ? 100 : Math.round(((thisWeekMin - lastWeekMin) / lastWeekMin) * 100);

  const handleMood = (emoji: string) => {
    addMoodLog({ date: new Date().toISOString(), emoji });
    toast.success('Mood logged');
  };

  const handleRescue = () => {
    let currentHour = new Date().getHours() + 1;
    overdueTasks.forEach(t => {
      const start = new Date();
      start.setHours(currentHour, 0, 0, 0);
      const end = new Date(start.getTime() + 30 * 60000);
      addBlock({ title: t.title, taskId: t.id, start: start.toISOString(), end: end.toISOString() });
      currentHour++;
    });
    toast.success(`Rescued ${overdueTasks.length} tasks to schedule`);
    setLocation('/schedule');
  };

  const handleStreakGuard = () => {
    const start = new Date();
    start.setMinutes(start.getMinutes() + 5);
    const end = new Date(start.getTime() + 25 * 60000);
    addBlock({ title: 'Streak Guard', start: start.toISOString(), end: end.toISOString() });
    toast.success('Scheduled a 25min session to save your streak');
    setLocation('/schedule');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Smart Hub.</h1>
      </div>

      {(thisWeekMin > 600 || thisWeekSessions.length > 8) && (
        <Card className="glass border-destructive/30 bg-destructive/5">
          <CardContent className="p-6 space-y-2">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-destructive" />
              <h3 className="font-bold text-lg text-destructive">Burnout Warning</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              You've logged {thisWeekMin} minutes across {thisWeekSessions.length} sessions this week. 
              Take a full day off to recover.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="glass border-primary/20">
          <CardContent className="p-6 space-y-4 h-full flex flex-col">
            <div className="flex items-center gap-3">
              <Brain className="w-6 h-6 text-primary" />
              <h3 className="font-bold text-lg">AI Insight</h3>
            </div>
            <p className="text-muted-foreground text-sm flex-1">
              {profile.streak.count > 3 
                ? "Your momentum is building. Your completion rate is higher when you schedule sessions before noon." 
                : "A 25-minute session today will get your streak going. Small steps build big habits."}
            </p>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6 space-y-4 text-center h-full flex flex-col justify-center">
            <h3 className="font-bold">Daily Mood Check-in</h3>
            <div className="flex justify-center gap-4 text-4xl">
              {['😴', '😐', '🙂', '😊', '🔥'].map(emoji => (
                <button key={emoji} onClick={() => handleMood(emoji)} className="hover:scale-110 transition-transform active:scale-95">
                  {emoji}
                </button>
              ))}
            </div>
            {moodLogs.length > 0 && isSameDay(new Date(moodLogs[moodLogs.length - 1].date), new Date()) && (
              <p className="text-xs text-muted-foreground mt-2">Logged today: {moodLogs[moodLogs.length - 1].emoji}</p>
            )}
          </CardContent>
        </Card>

        <Card className="glass border-warning/20">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-warning" />
              <h3 className="font-bold text-lg">Rescue Overdue</h3>
            </div>
            <p className="text-muted-foreground text-sm flex-1">
              You have {overdueTasks.length} overdue tasks. Auto-schedule them into open slots today?
            </p>
            <Button disabled={overdueTasks.length === 0} size="sm" variant="outline" className="w-full text-warning border-warning/30 hover:bg-warning hover:text-warning-foreground" onClick={handleRescue}>
              Rescue Tasks
            </Button>
          </CardContent>
        </Card>

        <Card className="glass border-info/20">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-info" />
              <h3 className="font-bold text-lg">Streak Guard</h3>
            </div>
            <p className="text-muted-foreground text-sm flex-1">
              Haven't focused today? Schedule a quick 25-minute session to maintain your streak.
            </p>
            <Button size="sm" variant="outline" className="w-full text-info border-info/30 hover:bg-info hover:text-info-foreground" onClick={handleStreakGuard}>
              Protect Streak
            </Button>
          </CardContent>
        </Card>

        <Card className="glass md:col-span-2">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-6 h-6 text-primary" />
              <h3 className="font-bold text-lg">Weekly Comparison</h3>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Focus Min</p>
                <p className="text-2xl font-bold">{thisWeekMin}</p>
                <p className={`text-xs ${focusDelta >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  {focusDelta >= 0 ? '↑' : '↓'} {Math.abs(focusDelta)}%
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Sessions</p>
                <p className="text-2xl font-bold">{thisWeekSessions.length}</p>
                <p className="text-xs text-muted-foreground">vs {lastWeekSessions.length} last week</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Avg Length</p>
                <p className="text-2xl font-bold">
                  {thisWeekSessions.length ? Math.round(thisWeekMin / thisWeekSessions.length) : 0}m
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
