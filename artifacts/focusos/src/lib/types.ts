export type Priority = 'high' | 'medium' | 'low';
export type Quality = 'done' | 'partial' | 'rescheduled';

export interface Profile {
  name: string;
  university: string;
  year: string;
  preferences: {
    sessionMin: number;
    breakMin: number;
    dailyGoalMin: number;
    weeklyTargetHours: number;
    notifications: {
      tasks: boolean;
      exams: boolean;
      classes: boolean;
      streak: boolean;
    };
    theme: 'dark' | 'light';
    fontSize: 'normal' | 'large';
    highContrast: boolean;
  };
  xp: number;
  level: number;
  streak: { count: number; lastDate: string };
  badges: { id: string; unlockedAt: string }[];
  onboardingDone: boolean;
  demoTourDone: boolean;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  credits: number;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  priority: Priority;
  estMin: number;
  dueAt: string;
  notes?: string;
  subtasks?: { id: string; title: string; completed: boolean }[];
  courseId?: string;
  completedAt?: string;
  createdAt: string;
}

export interface Event {
  id: string;
  type: 'exam' | 'deadline' | 'class';
  title: string;
  courseId?: string;
  start: string;
  end: string;
  recurrence?: 'weekly';
  attendance?: { date: string; status: 'present' | 'missed' | 'late' }[];
}

export interface Block {
  id: string;
  title: string;
  taskId?: string;
  start: string;
  end: string;
  completedAt?: string;
}

export interface Session {
  id: string;
  startedAt: string;
  endedAt: string;
  plannedMin: number;
  actualMin: number;
  quality: Quality;
  taskId?: string;
}

export interface MoodLog {
  id: string;
  date: string;
  emoji: string;
  note?: string;
}

export interface Semester {
  id: string;
  label: string;
  courses: { courseId: string; credits: number; grade?: string; rawScore?: number }[];
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  scheduledFor: string;
  read: boolean;
}
