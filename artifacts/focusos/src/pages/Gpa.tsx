import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { calculateSemesterGPA, calculateCumulativeGPA, SCALES } from '@/lib/gpa';
import { Plus, Trash2, Target, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Gpa() {
  const profile = useStore(state => state.profile);
  const semesters = useStore(state => state.semesters);
  const courses = useStore(state => state.courses);
  const addSemester = useStore(state => state.addSemester);
  const updateSemester = useStore(state => state.updateSemester);
  
  const [scale, setScale] = useState<keyof typeof SCALES>(profile.university as keyof typeof SCALES || 'UG');
  const [newSemesterName, setNewSemesterName] = useState('');

  // Fallback if the profile scale isn't valid
  useEffect(() => {
    if (SCALES[profile.university as keyof typeof SCALES]) {
      setScale(profile.university as keyof typeof SCALES);
    }
  }, [profile.university]);

  const cumulativeGPA = calculateCumulativeGPA(semesters, scale);
  const scaleInfo = SCALES[scale];

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

  const chartData = semesters.map((sem, i) => ({
    name: sem.label || `Sem ${i + 1}`,
    gpa: calculateSemesterGPA(sem, scale)
  }));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">GPA Simulator.</h1>
        <Select value={scale} onValueChange={(v) => setScale(v as any)}>
          <SelectTrigger className="w-[200px] glass"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(SCALES).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="glass">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-muted-foreground uppercase tracking-wider text-xs font-bold mb-1">Cumulative GPA</p>
              <h2 className="text-4xl font-bold text-primary">{cumulativeGPA.toFixed(2)}</h2>
            </div>
            <Target className="w-12 h-12 text-primary opacity-20" />
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6 h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="gpa" stroke="var(--color-info, #57a3ff)" strokeWidth={3} dot={{ r: 4, fill: 'var(--color-info)' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        {semesters.map((sem) => (
          <div key={sem.id} className="glass p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">{sem.label}</h3>
              <div className="text-right">
                <span className="text-lg font-bold text-info">{calculateSemesterGPA(sem, scale).toFixed(2)}</span>
                <span className="text-xs text-muted-foreground ml-1">GPA</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-2">
                <div className="col-span-6">Course</div>
                <div className="col-span-3 text-center">Credits</div>
                <div className="col-span-3 text-center">Grade</div>
              </div>
              
              {sem.courses.map((course, idx) => {
                const globalCourse = courses.find(c => c.id === course.courseId);
                const title = globalCourse ? globalCourse.code : `Course ${idx + 1}`;
                
                return (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-background/30 p-2 rounded-xl border border-white/5">
                    <div className="col-span-6">
                      <Input 
                        value={title} 
                        readOnly={!!globalCourse}
                        className="h-8 bg-transparent border-none shadow-none focus-visible:ring-0 px-1"
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
                        <SelectTrigger className="h-8 bg-background/50 border-none"><SelectValue placeholder="-" /></SelectTrigger>
                        <SelectContent>
                          {Object.keys(scaleInfo.grades).map(g => (
                            <SelectItem key={g} value={g}>{g}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                );
              })}
            </div>

            <Button variant="outline" size="sm" className="w-full mt-2 border-dashed" onClick={() => handleAddCourseToSemester(sem.id)}>
              <Plus className="w-4 h-4 mr-2" /> Add Course
            </Button>
          </div>
        ))}

        <div className="flex gap-2">
          <Input 
            placeholder="New Semester (e.g. Year 3, Sem 1)" 
            value={newSemesterName} 
            onChange={(e) => setNewSemesterName(e.target.value)} 
            className="glass"
          />
          <Button onClick={handleAddSemester} className="mint-glow whitespace-nowrap">
            <Plus className="w-4 h-4 mr-2" /> Add Semester
          </Button>
        </div>
      </div>
    </div>
  );
}
