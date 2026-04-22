import React from 'react';
import { useStore } from '@/lib/store';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell, Pie, PieChart } from 'recharts';
import { Target, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, subDays } from 'date-fns';

export default function Analytics() {
  const profile = useStore(state => state.profile);
  const tasks = useStore(state => state.tasks);
  const sessions = useStore(state => state.sessions);

  const completedTasks = tasks.filter(t => t.completedAt);
  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  // Chart data mock
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = subDays(new Date(), 6 - i);
    const daySessions = sessions.filter(s => s.startedAt.startsWith(format(d, 'yyyy-MM-dd')));
    const minutes = daySessions.reduce((acc, s) => acc + s.actualMin, 0);
    return { name: format(d, 'EEE'), minutes };
  });

  const priorityData = [
    { name: 'High', value: tasks.filter(t => t.priority === 'high').length, color: 'var(--color-destructive)' },
    { name: 'Medium', value: tasks.filter(t => t.priority === 'medium').length, color: 'var(--color-warning, #f2ad46)' },
    { name: 'Low', value: tasks.filter(t => t.priority === 'low').length, color: 'var(--color-info, #57a3ff)' },
  ].filter(d => d.value > 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Analytics.</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass">
          <CardContent className="p-4 flex flex-col justify-center items-center text-center space-y-1 h-full">
            <CheckCircle2 className="w-6 h-6 text-primary mb-1" />
            <h3 className="text-3xl font-bold">{completionRate}%</h3>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Completion</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4 flex flex-col justify-center items-center text-center space-y-1 h-full">
            <Target className="w-6 h-6 text-info mb-1" />
            <h3 className="text-3xl font-bold">{sessions.length}</h3>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Sessions</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4 flex flex-col justify-center items-center text-center space-y-1 h-full">
            <TrendingUp className="w-6 h-6 text-warning mb-1" />
            <h3 className="text-3xl font-bold">{profile.streak.count}</h3>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Day Streak</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4 flex flex-col justify-center items-center text-center space-y-1 h-full">
            <AlertTriangle className="w-6 h-6 text-destructive mb-1" />
            <h3 className="text-3xl font-bold">{tasks.filter(t => !t.completedAt && new Date(t.dueAt) < new Date()).length}</h3>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Overdue</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass border-white/5">
          <CardHeader>
            <CardTitle className="text-base font-medium text-muted-foreground">Focus Trend (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={last7Days}>
                  <defs>
                    <linearGradient id="colorMin" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip contentStyle={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)', borderRadius: '8px' }} />
                  <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <Area type="monotone" dataKey="minutes" stroke="var(--color-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorMin)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-white/5">
          <CardHeader>
            <CardTitle className="text-base font-medium text-muted-foreground">Tasks by Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full flex items-center justify-center">
              {priorityData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip contentStyle={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)', borderRadius: '8px' }} />
                    <Pie
                      data={priorityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-sm">No tasks yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
