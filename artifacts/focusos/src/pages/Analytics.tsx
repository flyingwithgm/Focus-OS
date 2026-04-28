import React, { Suspense, lazy } from 'react';
import { useStore } from '@/lib/store';
import { Target, CheckCircle2, TrendingUp, AlertTriangle, CalendarCheck2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { differenceInMinutes, format, subDays } from 'date-fns';
import { motion } from 'framer-motion';
import { calculateSemesterGPA } from '@/lib/gpa';

const AnalyticsCharts = lazy(() =>
  import('@/components/charts/AnalyticsCharts').then((module) => ({ default: module.AnalyticsCharts }))
);

export default function Analytics() {
  const profile = useStore(state => state.profile);
  const tasks = useStore(state => state.tasks);
  const blocks = useStore(state => state.blocks);
  const sessions = useStore(state => state.sessions);
  const semesters = useStore(state => state.semesters);

  const completedTasks = tasks.filter(t => t.completedAt);
  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  const past7Days = Array.from({ length: 7 }).map((_, i) => subDays(new Date(), 6 - i));
  const last7DaysSessions = sessions.filter(s => new Date(s.startedAt) >= past7Days[0]);
  const last7DaysFocusHours = Math.round(last7DaysSessions.reduce((acc, s) => acc + s.actualMin, 0) / 60 * 10) / 10;

  const scheduledBlocks = blocks.filter(block => new Date(block.start) <= new Date());
  const completedBlocks = scheduledBlocks.filter(block => block.completedAt || (block.taskId && tasks.find(task => task.id === block.taskId)?.completedAt));
  const adherenceRate = scheduledBlocks.length > 0 ? Math.round((completedBlocks.length / scheduledBlocks.length) * 100) : 0;
  const plannedFocusMin = scheduledBlocks.reduce((acc, block) => acc + Math.max(0, differenceInMinutes(new Date(block.end), new Date(block.start))), 0);
  const scheduleCompletionMin = completedBlocks.reduce((acc, block) => acc + Math.max(0, differenceInMinutes(new Date(block.end), new Date(block.start))), 0);

  const riskScore = Math.min(100, Math.max(0, 100 - completionRate - adherenceRate * 0.5 + (tasks.filter(t => !t.completedAt && new Date(t.dueAt) < new Date()).length * 10)));
  const riskColor = riskScore > 70 ? 'text-destructive' : riskScore > 40 ? 'text-warning' : 'text-primary';

  const last7DaysData = past7Days.map(d => {
    const daySessions = sessions.filter(s => s.startedAt.startsWith(format(d, 'yyyy-MM-dd')));
    const minutes = daySessions.reduce((acc, s) => acc + s.actualMin, 0);
    const dayBlocks = blocks.filter(block => block.start.startsWith(format(d, 'yyyy-MM-dd')));
    const planned = dayBlocks.reduce((acc, block) => acc + Math.max(0, differenceInMinutes(new Date(block.end), new Date(block.start))), 0);
    const completed = dayBlocks
      .filter(block => block.completedAt || (block.taskId && tasks.find(task => task.id === block.taskId)?.completedAt))
      .reduce((acc, block) => acc + Math.max(0, differenceInMinutes(new Date(block.end), new Date(block.start))), 0);
    return { name: format(d, 'EEE'), minutes, planned, completed };
  });

  const priorityData = [
    { name: 'High', value: tasks.filter(t => t.priority === 'high').length, color: 'var(--color-destructive)' },
    { name: 'Medium', value: tasks.filter(t => t.priority === 'medium').length, color: 'var(--color-warning)' },
    { name: 'Low', value: tasks.filter(t => t.priority === 'low').length, color: 'var(--color-info)' },
  ].filter(d => d.value > 0);

  const gpaData = semesters.map((sem, i) => ({
    name: sem.label || `Sem ${i + 1}`,
    gpa: calculateSemesterGPA(sem, profile.university as any || 'UG')
  }));

  const NumberCounter = ({ value, suffix = '' }: { value: number, suffix?: string }) => {
    const [count, setCount] = React.useState(0);
    React.useEffect(() => {
      let start = 0;
      const end = value;
      if (start === end) return;
      const totalDuration = 1000;
      const incrementTime = Math.max(16, Math.abs(Math.floor(totalDuration / end)));
      const timer = setInterval(() => {
        start += 1;
        setCount(start);
        if (start === end) clearInterval(timer);
      }, incrementTime);
      return () => clearInterval(timer);
    }, [value]);
    return <span>{count}{suffix}</span>;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Analytics.</h1>
      </div>

      {(completionRate < 50 || riskScore > 70) && (
        <Card className="glass border-destructive/30 bg-destructive/5">
          <CardContent className="p-6 flex items-center gap-4">
            <AlertTriangle className="w-8 h-8 text-destructive shrink-0" />
            <div>
              <h3 className="font-bold text-destructive">Course Correction Needed</h3>
              <p className="text-sm text-muted-foreground">Your completion rate is low or risk score is high. Consider renegotiating deadlines or breaking tasks down into smaller steps.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="glass h-full">
            <CardContent className="p-4 flex flex-col justify-center items-center text-center space-y-1 h-full relative overflow-hidden">
              <CheckCircle2 className="w-6 h-6 text-primary mb-1" />
              <h3 className="text-3xl font-bold"><NumberCounter value={completionRate} suffix="%" /></h3>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Completion</p>
              <motion.div className="absolute bottom-0 left-0 h-1 bg-primary mint-glow" initial={{ width: 0 }} animate={{ width: `${completionRate}%` }} transition={{ duration: 1, delay: 0.5 }} />
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="glass h-full">
            <CardContent className="p-4 flex flex-col justify-center items-center text-center space-y-1 h-full relative overflow-hidden">
              <CalendarCheck2 className="w-6 h-6 text-info mb-1" />
              <h3 className="text-3xl font-bold"><NumberCounter value={adherenceRate} suffix="%" /></h3>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Schedule Completion</p>
              <motion.div className="absolute bottom-0 left-0 h-1 bg-info" initial={{ width: 0 }} animate={{ width: `${adherenceRate}%` }} transition={{ duration: 1, delay: 0.5 }} />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="glass h-full">
            <CardContent className="p-4 flex flex-col justify-center items-center text-center space-y-1 h-full relative overflow-hidden">
              <AlertTriangle className={`w-6 h-6 ${riskColor} mb-1`} />
              <h3 className={`text-3xl font-bold ${riskColor}`}><NumberCounter value={riskScore} /></h3>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Risk Score</p>
              <motion.div className={`absolute bottom-0 left-0 h-1 bg-current ${riskColor}`} initial={{ width: 0 }} animate={{ width: `${riskScore}%` }} transition={{ duration: 1, delay: 0.5 }} />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="glass h-full">
            <CardContent className="p-4 flex flex-col justify-center items-center text-center space-y-1 h-full">
              <TrendingUp className="w-6 h-6 text-warning mb-1" />
              <h3 className="text-3xl font-bold"><NumberCounter value={scheduleCompletionMin} /><span className="text-base text-muted-foreground">/{plannedFocusMin}m</span></h3>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Planned Vs Done</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Suspense fallback={<Skeleton className="h-[460px] w-full rounded-3xl" />}>
        <AnalyticsCharts last7DaysData={last7DaysData} priorityData={priorityData} gpaData={gpaData} />
      </Suspense>
    </div>
  );
}
