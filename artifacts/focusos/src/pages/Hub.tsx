import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, AlertCircle, TrendingUp, Zap, CalendarClock, Sparkles, CheckCircle2, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { differenceInMinutes, format, subDays, isSameDay, isToday } from 'date-fns';
import { toast } from 'sonner';
import { useLocation } from 'wouter';
import { buildAutoSchedulePlan } from '@/lib/scheduling';

export default function Hub() {
  const [, setLocation] = useLocation();
  const profile = useStore(state => state.profile);
  const tasks = useStore(state => state.tasks);
  const blocks = useStore(state => state.blocks);
  const sessions = useStore(state => state.sessions);
  const addMoodLog = useStore(state => state.addMoodLog);
  const moodLogs = useStore(state => state.moodLogs);
  const addBlock = useStore(state => state.addBlock);

  const pendingTasks = tasks.filter(t => !t.completedAt);
  const overdueTasks = pendingTasks.filter(t => new Date(t.dueAt) < new Date());
  const urgentTasks = pendingTasks.filter(t => t.priority === 'high' || new Date(t.dueAt) < new Date());
  const todayBlocks = blocks.filter(block => isToday(new Date(block.start)));
  const completedTodayBlocks = todayBlocks.filter(block => block.completedAt || (block.taskId && tasks.find(task => task.id === block.taskId)?.completedAt));
  const todayPlannedMin = todayBlocks.reduce((acc, block) => acc + Math.max(0, differenceInMinutes(new Date(block.end), new Date(block.start))), 0);
  const todayCompletedMin = completedTodayBlocks.reduce((acc, block) => acc + Math.max(0, differenceInMinutes(new Date(block.end), new Date(block.start))), 0);
  const unscheduledUrgentTasks = urgentTasks.filter(task => !blocks.some(block => block.taskId === task.id && !block.completedAt && new Date(block.end) >= new Date()));
  const morningSessions = sessions.filter(s => {
    const startedAt = new Date(s.startedAt);
    return startedAt.getHours() < 12 && startedAt >= subDays(new Date(), 14);
  });
  const afternoonSessions = sessions.filter(s => {
    const startedAt = new Date(s.startedAt);
    return startedAt.getHours() >= 12 && startedAt >= subDays(new Date(), 14);
  });
  const morningAvg = morningSessions.length ? Math.round(morningSessions.reduce((acc, s) => acc + s.actualMin, 0) / morningSessions.length) : 0;
  const afternoonAvg = afternoonSessions.length ? Math.round(afternoonSessions.reduce((acc, s) => acc + s.actualMin, 0) / afternoonSessions.length) : 0;

  const thisWeekSessions = sessions.filter(s => new Date(s.startedAt) >= subDays(new Date(), 7));
  const lastWeekSessions = sessions.filter(s => new Date(s.startedAt) >= subDays(new Date(), 14) && new Date(s.startedAt) < subDays(new Date(), 7));

  const thisWeekMin = thisWeekSessions.reduce((acc, s) => acc + s.actualMin, 0);
  const lastWeekMin = lastWeekSessions.reduce((acc, s) => acc + s.actualMin, 0);
  const focusDelta = lastWeekMin === 0 ? 100 : Math.round(((thisWeekMin - lastWeekMin) / lastWeekMin) * 100);
  const plannedBlocksPreview = buildAutoSchedulePlan(tasks, blocks);

  const insightCards = [
    unscheduledUrgentTasks.length > 0
      ? {
          title: 'Urgent Work Unscheduled',
          body: `${unscheduledUrgentTasks.length} urgent task${unscheduledUrgentTasks.length === 1 ? '' : 's'} still need calendar time. Auto-scheduling them now will reduce your risk quickly.`,
          icon: AlertCircle,
          tone: 'warning',
        }
      : null,
    todayBlocks.length > 0 && todayCompletedMin < todayPlannedMin * 0.5
      ? {
          title: 'Plan Is Slipping',
          body: `You have completed ${todayCompletedMin} of ${todayPlannedMin} planned minutes today. Trim the plan or start the next linked block now.`,
          icon: CalendarClock,
          tone: 'info',
        }
      : null,
    morningAvg > afternoonAvg + 10
      ? {
          title: 'Morning Bias Detected',
          body: `Your morning sessions average ${morningAvg} minutes versus ${afternoonAvg || 0} in the afternoon. Put difficult work earlier when possible.`,
          icon: Sparkles,
          tone: 'primary',
        }
      : null,
    focusDelta > 15
      ? {
          title: 'Momentum Building',
          body: `You are up ${focusDelta}% versus last week. Keep protecting the time blocks that are already working.`,
          icon: TrendingUp,
          tone: 'primary',
        }
      : null,
    profile.streak.count < 2 && todayBlocks.length === 0
      ? {
          title: 'Easy Win Available',
          body: 'You do not need a huge session today. One scheduled 25-minute block is enough to start momentum again.',
          icon: Zap,
          tone: 'info',
        }
      : null,
  ].filter(Boolean) as Array<{ title: string; body: string; icon: any; tone: 'primary' | 'warning' | 'info' }>;

  const toneClasses = {
    primary: 'border-primary/20 text-primary',
    warning: 'border-warning/20 text-warning',
    info: 'border-info/20 text-info',
  };

  const handleMood = (emoji: string) => {
    addMoodLog({ date: new Date().toISOString(), emoji });
    toast.success('Mood logged');
  };

  const handleRescue = () => {
    const plannedBlocks = buildAutoSchedulePlan(tasks, blocks);
    if (plannedBlocks.length === 0) {
      toast.error('No open slots found for overdue or high-priority tasks');
      return;
    }
    plannedBlocks.forEach((block) => addBlock(block));
    toast.success(`Scheduled ${plannedBlocks.length} task block${plannedBlocks.length === 1 ? '' : 's'} into open slots`);
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
              {insightCards[0]?.body || 'Your schedule, focus time, and overdue work now feed this hub. Keep creating blocks so the guidance keeps getting sharper.'}
            </p>
            {plannedBlocksPreview.length > 0 && (
              <div className="rounded-xl bg-background/40 border border-white/5 p-3 text-sm">
                <div className="font-medium">Auto-plan preview</div>
                <div className="text-muted-foreground text-xs mt-1">
                  {plannedBlocksPreview.length} urgent task block{plannedBlocksPreview.length === 1 ? '' : 's'} can be placed in open slots right now.
                </div>
              </div>
            )}
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
              You have {overdueTasks.length} overdue tasks and {unscheduledUrgentTasks.length} urgent item{unscheduledUrgentTasks.length === 1 ? '' : 's'} without a live block. Auto-schedule them into open slots?
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

        <Card className="glass md:col-span-2">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-6 h-6 text-primary" />
              <h3 className="font-bold text-lg">Planning Signals</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-background/30 p-4">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Today Planned</div>
                <div className="text-2xl font-bold mt-1">{todayPlannedMin}m</div>
                <div className="text-xs text-muted-foreground mt-1">{todayBlocks.length} block{todayBlocks.length === 1 ? '' : 's'} on the board</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-background/30 p-4">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Today Completed</div>
                <div className="text-2xl font-bold mt-1">{todayCompletedMin}m</div>
                <div className="text-xs text-muted-foreground mt-1">{completedTodayBlocks.length} block{completedTodayBlocks.length === 1 ? '' : 's'} finished</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-background/30 p-4">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Urgent Unscheduled</div>
                <div className="text-2xl font-bold mt-1">{unscheduledUrgentTasks.length}</div>
                <div className="text-xs text-muted-foreground mt-1">High-priority or overdue tasks without active blocks</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass md:col-span-2">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-6 h-6 text-primary" />
              <h3 className="font-bold text-lg">Smart Recommendations</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {insightCards.map((insight) => {
                const Icon = insight.icon;
                return (
                  <div key={insight.title} className="rounded-2xl border border-white/10 bg-background/30 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`w-4 h-4 ${toneClasses[insight.tone]}`} />
                      <div className="font-semibold">{insight.title}</div>
                    </div>
                    <div className="text-sm text-muted-foreground">{insight.body}</div>
                  </div>
                );
              })}
              {insightCards.length === 0 && (
                <div className="rounded-2xl border border-white/10 bg-background/30 p-4 text-sm text-muted-foreground md:col-span-2">
                  The hub does not see any major risk right now. Keep logging blocks and sessions so it can spot patterns before they become problems.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
