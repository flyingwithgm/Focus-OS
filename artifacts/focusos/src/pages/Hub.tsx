import React from 'react';
import { useStore } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, Zap, AlertCircle, Smile, Meh, Frown, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Hub() {
  const profile = useStore(state => state.profile);
  const tasks = useStore(state => state.tasks);
  const addMoodLog = useStore(state => state.addMoodLog);
  const moodLogs = useStore(state => state.moodLogs);

  const overdueTasks = tasks.filter(t => !t.completedAt && new Date(t.dueAt) < new Date());

  const handleMood = (emoji: string) => {
    addMoodLog({ date: new Date().toISOString(), emoji });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Smart Hub.</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="glass border-primary/20">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Brain className="w-6 h-6 text-primary" />
              <h3 className="font-bold text-lg">AI Assistant</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              Your focus pattern this week is excellent in the mornings. Consider shifting your heaviest tasks before 12 PM for maximum efficiency.
            </p>
          </CardContent>
        </Card>

        <Card className="glass border-warning/20">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-warning" />
              <h3 className="font-bold text-lg">Action Needed</h3>
            </div>
            {overdueTasks.length > 0 ? (
              <div>
                <p className="text-muted-foreground text-sm mb-3">
                  You have {overdueTasks.length} overdue tasks. Let's knock them out right now or reschedule them.
                </p>
                <Button size="sm" variant="outline" className="w-full text-warning border-warning/30 hover:bg-warning hover:text-warning-foreground">
                  Rescue Tasks
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">You're all caught up. Keep it up!</p>
            )}
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6 space-y-4 text-center">
            <h3 className="font-bold">Daily Mood Check-in</h3>
            <div className="flex justify-center gap-4">
              <button onClick={() => handleMood('🙁')} className="text-4xl hover:scale-110 transition-transform active:scale-95">🙁</button>
              <button onClick={() => handleMood('😐')} className="text-4xl hover:scale-110 transition-transform active:scale-95">😐</button>
              <button onClick={() => handleMood('🙂')} className="text-4xl hover:scale-110 transition-transform active:scale-95">🙂</button>
            </div>
            {moodLogs.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">Logged today: {moodLogs[moodLogs.length - 1].emoji}</p>
            )}
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-info" />
              <h3 className="font-bold text-lg">Weekly Comparison</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              You focused 15% more this week compared to last week. Your top day was Tuesday with 180 minutes of deep work.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
