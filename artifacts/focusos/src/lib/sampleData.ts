import { Course, Task, Event, Semester } from './types';
import { addDays, subDays, addHours, setHours, setMinutes } from 'date-fns';

export function generateSampleData(name: string) {
  const now = new Date();

  const courses: Course[] = [
    { id: 'c1', code: 'CSCD311', title: 'Web Development', credits: 3, color: '#0be7a4' },
    { id: 'c2', code: 'MATH223', title: 'Calculus II', credits: 4, color: '#57a3ff' },
    { id: 'c3', code: 'PHYS105', title: 'Classical Mechanics', credits: 3, color: '#f2ad46' },
  ];

  const tasks: Task[] = [
    {
      id: 't1',
      title: 'Complete React Assignment',
      priority: 'high',
      estMin: 120,
      dueAt: addDays(now, 2).toISOString(),
      courseId: 'c1',
      notes: 'Finish the responsive layout pass and clean up the mobile navigation.',
      subtasks: [
        { id: 't1-s1', title: 'Build desktop layout', completed: true },
        { id: 't1-s2', title: 'Fix mobile nav', completed: false },
      ],
      createdAt: now.toISOString()
    },
    { id: 't2', title: 'Read Chapter 4', priority: 'medium', estMin: 60, dueAt: addDays(now, 3).toISOString(), courseId: 'c2', notes: 'Focus on integration techniques and examples.', createdAt: now.toISOString() },
    { id: 't3', title: 'Physics Lab Report', priority: 'high', estMin: 90, dueAt: addDays(now, 1).toISOString(), courseId: 'c3', createdAt: now.toISOString() },
    { id: 't4', title: 'Buy groceries', priority: 'low', estMin: 30, dueAt: addDays(now, 4).toISOString(), createdAt: now.toISOString() },
  ];

  const events: Event[] = [
    { id: 'e1', type: 'class', title: 'Web Dev Lecture', courseId: 'c1', start: setMinutes(setHours(now, 10), 0).toISOString(), end: setMinutes(setHours(now, 11), 30).toISOString(), recurrence: 'weekly' },
    { id: 'e2', type: 'deadline', title: 'React Assignment Due', courseId: 'c1', start: addDays(now, 2).toISOString(), end: addDays(now, 2).toISOString() },
    { id: 'e3', type: 'exam', title: 'Calculus Midterm', courseId: 'c2', start: addDays(now, 5).toISOString(), end: addHours(addDays(now, 5), 2).toISOString() },
  ];

  const semesters: Semester[] = [
    {
      id: 's1',
      label: 'Year 2, Semester 1',
      courses: [
        { courseId: 'c1', credits: 3, grade: 'A' },
        { courseId: 'c2', credits: 4, grade: 'B+' },
        { courseId: 'c3', credits: 3, grade: 'A-' },
      ]
    }
  ];

  return { courses, tasks, events, semesters };
}
