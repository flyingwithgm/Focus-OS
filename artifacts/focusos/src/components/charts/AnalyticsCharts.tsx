import { Area, AreaChart, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type TrendPoint = {
  name: string;
  minutes: number;
  planned: number;
  completed: number;
};

type PriorityPoint = {
  name: string;
  value: number;
  color: string;
};

type GpaPoint = {
  name: string;
  gpa: number;
};

export function AnalyticsCharts({
  last7DaysData,
  priorityData,
  gpaData,
}: {
  last7DaysData: TrendPoint[];
  priorityData: PriorityPoint[];
  gpaData: GpaPoint[];
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="glass border-white/5">
        <CardHeader>
          <CardTitle className="text-base font-medium text-muted-foreground">Focus Trend (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={last7DaysData}>
                <defs>
                  <linearGradient id="colorMin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)', borderRadius: '8px' }} />
                <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Area type="monotone" dataKey="planned" stroke="var(--color-info)" strokeWidth={2} fillOpacity={0} />
                <Area type="monotone" dataKey="completed" stroke="var(--color-warning)" strokeWidth={2} fillOpacity={0} />
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

      <Card className="glass border-white/5 md:col-span-2">
        <CardHeader>
          <CardTitle className="text-base font-medium text-muted-foreground">GPA Trajectory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full">
            {gpaData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={gpaData}>
                  <Tooltip contentStyle={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)', borderRadius: '8px' }} />
                  <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <Line type="monotone" dataKey="gpa" stroke="var(--color-info)" strokeWidth={3} dot={{ r: 4, fill: 'var(--color-info)' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-muted-foreground text-sm">No semester data yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
