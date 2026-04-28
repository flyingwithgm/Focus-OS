import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export function GpaTrajectoryChart({
  chartData,
}: {
  chartData: { name: string; gpa: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <Tooltip contentStyle={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)', borderRadius: '8px' }} />
        <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
        <YAxis domain={['auto', 'auto']} stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} width={30} />
        <Line type="monotone" dataKey="gpa" stroke="var(--color-info)" strokeWidth={3} dot={{ r: 4, fill: 'var(--color-info)' }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
