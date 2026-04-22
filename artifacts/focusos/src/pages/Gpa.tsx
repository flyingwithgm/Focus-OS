import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { calculateSemesterGPA, calculateCumulativeGPA, SCALES } from '@/lib/gpa';
import { Plus, Trash2, Target, TrendingUp, AlertCircle, Wand2 } from 'lucide-react';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, YAxis } from 'recharts';
import { motion } from 'framer-motion';

export default function Gpa() {
  const profile = useStore(state => state.profile);
  const semesters = useStore(state => state.semesters);
  const courses = useStore(state => state.courses);
  const sessions = useStore(state => state.sessions);
  const addSemester = useStore(state => state.addSemester);
  const updateSemester = useStore(state => state.updateSemester);
  const deleteSemester = useStore(state => state.deleteSemester);
  
  const [scale, setScale] = useState<string>(profile.university || 'UG');
  const [newSemesterName, setNewSemesterName] = useState('');
  const [baselineGpa, setBaselineGpa] = useState<number>(0);
  const [baselineCredits, setBaselineCredits] = useState<number>(0);
  const [targetGpa, setTargetGpa] = useState<number>(0);
  const [isSimulator, setIsSimulator] = useState(false);

  const cumulativeGPA = calculateCumulativeGPA(semesters, scale, baselineGpa, baselineCredits);
  const scaleInfo = SCALES[scale as keyof typeof SCALES] || SCALES['UG'];

  const handleAddSemester = () => {
    if (!newSemesterName) return;
    addSemester({ label: newSemesterName, courses: [] });
    setNewSemesterName('');
  };

  const handleAddCourseToSemester = (semId: string) => {
    const sem = semesters.find(s => s.id === semId);
    if (!sem) return;
    updateSemester(semId, {
      courses: [...sem.courses, { courseId: `custom-${Date.now()}`, credits: 3 }]
    });
  };

  const handleRemoveCourse = (semId: string, courseIdx: number) => {
    const sem = semesters.find(s => s.id === semId);
    if (!sem) return;
    const newCourses = [...sem.courses];
    newCourses.splice(courseIdx, 1);
    updateSemester(semId, { courses: newCourses });
  };

  const chartData = semesters.map((sem, i) => ({
    name: sem.label || `Sem ${i + 1}`,
    gpa: calculateSemesterGPA(sem, scale)
  }));

  // Target GPA Tracker
  let totalCreditsSoFar = baselineCredits;
  let totalPointsSoFar = baselineGpa * baselineCredits;
  semesters.forEach(s => s.courses.forEach(c => {
    if (c.grade) {
      totalCreditsSoFar += c.credits;
      const pt = (scaleInfo.grades as Record<string, { points: number }>)[c.grade]?.points || 0;
      totalPointsSoFar += pt * c.credits;
    }
  }));

  // Assuming remaining credits to graduate is approx 120 - current
  const remainingCredits = Math.max(0, 120 - totalCreditsSoFar);
  const requiredAverage = remainingCredits > 0 && targetGpa > 0
    ? ((targetGpa * 120) - totalPointsSoFar) / remainingCredits
    : 0;
  
  const isTargetAchievable = requiredAverage <= 4.0; // Assuming 4.0 is max, adjust based on scale
  const targetColor = !targetGpa ? 'text-muted-foreground' : requiredAverage <= 3.5 ? 'text-primary' : isTargetAchievable ? 'text-warning' : 'text-destructive';

  // Grade Predictor
  const last3Semesters = semesters.slice(-3);
  let slope = 0;
  if (last3Semesters.length >= 2) {
    const gpas = last3Semesters.map(s => calculateSemesterGPA(s, scale));
    slope = gpas[gpas.length - 1] - gpas[0]; // Simple difference
  }
  const weeklyStudyHours = sessions.reduce((acc, s) => acc + s.actualMin, 0) / 60; // simple total / weeks
  const predictedGpa = cumulativeGPA + (slope * 0.5) + (weeklyStudyHours > 20 ? 0.1 : 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">GPA Calculator.</h1>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 glass px-3 py-1.5 rounded-xl">
            <Label htmlFor="sim-mode" className="text-sm font-medium">Simulator</Label>
            <Switch id="sim-mode" checked={isSimulator} onCheckedChange={setIsSimulator} />
          </div>
          <Select value={scale} onValueChange={setScale}>
            <SelectTrigger className="w-[180px] glass"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(SCALES).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass md:col-span-1 flex flex-col justify-center text-center py-6">
          <CardContent className="p-0">
            <p className="text-muted-foreground uppercase tracking-wider text-xs font-bold mb-2">Cumulative GPA</p>
            <motion.h2 
              key={cumulativeGPA} 
              initial={{ scale: 0.8, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              className={`text-5xl font-bold ${isSimulator ? 'text-warning mint-glow' : 'text-primary'}`}
            >
              {cumulativeGPA.toFixed(2)}
            </motion.h2>
          </CardContent>
        </Card>

        <Card className="glass md:col-span-2">
          <CardContent className="p-4 h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)', borderRadius: '8px' }} />
                <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis domain={['auto', 'auto']} stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} width={30} />
                <Line type="monotone" dataKey="gpa" stroke="var(--color-info)" strokeWidth={3} dot={{ r: 4, fill: 'var(--color-info)' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Target className="w-4 h-4 text-primary"/> Target Tracker</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 items-center">
              <Label className="flex-1">Target GPA</Label>
              <Input type="number" step="0.1" value={targetGpa || ''} onChange={e => setTargetGpa(parseFloat(e.target.value))} className="w-24 bg-background/50" />
            </div>
            {targetGpa > 0 && (
              <div className="p-3 rounded-lg bg-background/30 text-sm">
                To graduate with {targetGpa}, you need to average a <strong className={targetColor}>{requiredAverage.toFixed(2)}</strong> for your remaining {remainingCredits} credits.
                {!isTargetAchievable && <span className="block mt-1 text-destructive text-xs">This might mathematically exceed the maximum possible GPA.</span>}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Wand2 className="w-4 h-4 text-info"/> AI Predictor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Based on current trajectory:</p>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold text-info">{(predictedGpa).toFixed(2)}</span>
                  <span className="text-xs text-muted-foreground mb-1">± 0.15</span>
                </div>
              </div>
              <div className="px-3 py-1 rounded bg-info/10 text-info text-xs font-bold uppercase">
                {last3Semesters.length >= 2 ? 'High Confidence' : 'Low Confidence'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="glass p-6 rounded-2xl space-y-4">
        <h3 className="font-bold">Prior Credits (Baseline)</h3>
        <div className="flex gap-4">
          <div className="flex-1 space-y-1">
            <Label className="text-xs">Baseline GPA</Label>
            <Input type="number" step="0.01" value={baselineGpa || ''} onChange={e => setBaselineGpa(parseFloat(e.target.value))} className="bg-background/50" />
          </div>
          <div className="flex-1 space-y-1">
            <Label className="text-xs">Baseline Credits</Label>
            <Input type="number" value={baselineCredits || ''} onChange={e => setBaselineCredits(parseFloat(e.target.value))} className="bg-background/50" />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {semesters.map((sem) => (
          <div key={sem.id} className={`glass p-6 rounded-2xl space-y-4 ${isSimulator ? 'border-warning/50' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                {sem.label}
              </h3>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-lg font-bold text-info">{calculateSemesterGPA(sem, scale).toFixed(2)}</span>
                  <span className="text-xs text-muted-foreground ml-1">GPA</span>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/20" onClick={() => deleteSemester(sem.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-2">
                <div className="col-span-5 md:col-span-6">Course</div>
                <div className="col-span-3 text-center">Cr</div>
                <div className="col-span-3 text-center">Grade</div>
                <div className="col-span-1"></div>
              </div>
              
              {sem.courses.map((course, idx) => {
                const globalCourse = courses.find(c => c.id === course.courseId);
                const title = globalCourse ? globalCourse.code : `Course ${idx + 1}`;
                const gradeKeys = Object.keys(scaleInfo.grades);
                const currentGradeIdx = gradeKeys.indexOf(course.grade || gradeKeys[0]);
                
                return (
                  <div key={idx} className="flex flex-col gap-2 bg-background/30 p-2 rounded-xl border border-white/5">
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-5 md:col-span-6">
                        <Input 
                          value={title} 
                          readOnly={!!globalCourse}
                          className="h-8 bg-transparent border-none shadow-none focus-visible:ring-0 px-1 text-sm font-medium"
                          placeholder="Course Name"
                        />
                      </div>
                      <div className="col-span-3">
                        <Input 
                          type="number" 
                          value={course.credits} 
                          onChange={(e) => {
                            const newCourses = [...sem.courses];
                            newCourses[idx].credits = Number(e.target.value);
                            updateSemester(sem.id, { courses: newCourses });
                          }}
                          className="h-8 text-center bg-background/50"
                        />
                      </div>
                      <div className="col-span-3">
                        <Select 
                          value={course.grade || ''} 
                          onValueChange={(v) => {
                            const newCourses = [...sem.courses];
                            newCourses[idx].grade = v;
                            updateSemester(sem.id, { courses: newCourses });
                          }}
                        >
                          <SelectTrigger className={`h-8 bg-background/50 border-none ${isSimulator ? 'border-warning/50 text-warning' : ''}`}><SelectValue placeholder="-" /></SelectTrigger>
                          <SelectContent>
                            {gradeKeys.map(g => (
                              <SelectItem key={g} value={g}>{g}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-1 text-right">
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveCourse(sem.id, idx)}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {isSimulator && (
                      <div className="px-2 pb-1 pt-2 border-t border-white/5">
                        <Slider 
                          min={0} 
                          max={gradeKeys.length - 1} 
                          step={1} 
                          value={[Math.max(0, gradeKeys.length - 1 - currentGradeIdx)]} 
                          onValueChange={v => {
                            const newGrade = gradeKeys[gradeKeys.length - 1 - v[0]];
                            const newCourses = [...sem.courses];
                            newCourses[idx].grade = newGrade;
                            updateSemester(sem.id, { courses: newCourses });
                          }}
                          className="[&_[role=slider]]:bg-warning [&_[role=slider]]:border-warning"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <Button variant="outline" size="sm" className="w-full mt-2 border-dashed text-muted-foreground" onClick={() => handleAddCourseToSemester(sem.id)}>
              <Plus className="w-4 h-4 mr-2" /> Add Course
            </Button>
          </div>
        ))}

        <div className="flex gap-2 pt-4">
          <Input 
            placeholder="New Semester Name..." 
            value={newSemesterName} 
            onChange={(e) => setNewSemesterName(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && handleAddSemester()}
            className="glass"
          />
          <Button onClick={handleAddSemester} className="mint-glow whitespace-nowrap">
            <Plus className="w-4 h-4 md:mr-2" /> <span className="hidden md:inline">Add Semester</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

const X = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
);
