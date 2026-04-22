import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Profile, Course, Task, Event, Block, Session, MoodLog, Semester, Notification } from './types';
import { generateSampleData } from './sampleData';

interface FocusStore {
  profile: Profile;
  courses: Course[];
  tasks: Task[];
  events: Event[];
  blocks: Block[];
  sessions: Session[];
  moodLogs: MoodLog[];
  semesters: Semester[];
  notifications: Notification[];

  // Actions
  updateProfile: (updates: Partial<Profile>) => void;
  updatePreferences: (updates: Partial<Profile['preferences']>) => void;
  addXP: (amount: number) => void;
  
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string) => void;

  addCourse: (course: Omit<Course, 'id'>) => void;
  updateCourse: (id: string, updates: Partial<Course>) => void;
  deleteCourse: (id: string) => void;

  addEvent: (event: Omit<Event, 'id'>) => void;
  updateEvent: (id: string, updates: Partial<Event>) => void;
  deleteEvent: (id: string) => void;

  addBlock: (block: Omit<Block, 'id'>) => void;
  updateBlock: (id: string, updates: Partial<Block>) => void;
  deleteBlock: (id: string) => void;

  addSession: (session: Omit<Session, 'id'>) => void;
  updateSession: (id: string, updates: Partial<Session>) => void;

  addMoodLog: (log: Omit<MoodLog, 'id'>) => void;

  addSemester: (semester: Omit<Semester, 'id'>) => void;
  updateSemester: (id: string, updates: Partial<Semester>) => void;
  deleteSemester: (id: string) => void;

  addNotification: (notification: Omit<Notification, 'id'>) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;

  loadSampleData: () => void;
  resetData: () => void;
  
  activeFocusSessionId: string | null;
  setActiveFocusSessionId: (id: string | null) => void;
}

const defaultProfile: Profile = {
  name: '',
  university: '',
  year: '',
  preferences: {
    sessionMin: 25,
    breakMin: 5,
    dailyGoalMin: 120,
    weeklyTargetHours: 15,
    notifications: { tasks: true, exams: true, classes: true, streak: true },
    theme: 'dark',
    fontSize: 'normal',
    highContrast: false,
  },
  xp: 0,
  level: 1,
  streak: { count: 0, lastDate: '' },
  badges: [],
  onboardingDone: false,
  demoTourDone: false,
};

export const useStore = create<FocusStore>()(
  persist(
    (set) => ({
      profile: defaultProfile,
      courses: [],
      tasks: [],
      events: [],
      blocks: [],
      sessions: [],
      moodLogs: [],
      semesters: [],
      notifications: [],
      activeFocusSessionId: null,

      updateProfile: (updates) => set((state) => ({ profile: { ...state.profile, ...updates } })),
      updatePreferences: (updates) => set((state) => ({
        profile: { ...state.profile, preferences: { ...state.profile.preferences, ...updates } }
      })),
      addXP: (amount) => set((state) => {
        const newXp = state.profile.xp + amount;
        const newLevel = Math.floor(newXp / 100) + 1;
        return { profile: { ...state.profile, xp: newXp, level: newLevel } };
      }),

      addTask: (task) => set((state) => ({
        tasks: [...state.tasks, { ...task, id: crypto.randomUUID(), createdAt: new Date().toISOString() }]
      })),
      updateTask: (id, updates) => set((state) => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
      })),
      deleteTask: (id) => set((state) => ({
        tasks: state.tasks.filter(t => t.id !== id)
      })),
      completeTask: (id) => set((state) => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, completedAt: new Date().toISOString() } : t)
      })),

      addCourse: (course) => set((state) => ({
        courses: [...state.courses, { ...course, id: crypto.randomUUID() }]
      })),
      updateCourse: (id, updates) => set((state) => ({
        courses: state.courses.map(c => c.id === id ? { ...c, ...updates } : c)
      })),
      deleteCourse: (id) => set((state) => ({
        courses: state.courses.filter(c => c.id !== id)
      })),

      addEvent: (event) => set((state) => ({
        events: [...state.events, { ...event, id: crypto.randomUUID() }]
      })),
      updateEvent: (id, updates) => set((state) => ({
        events: state.events.map(e => e.id === id ? { ...e, ...updates } : e)
      })),
      deleteEvent: (id) => set((state) => ({
        events: state.events.filter(e => e.id !== id)
      })),

      addBlock: (block) => set((state) => ({
        blocks: [...state.blocks, { ...block, id: crypto.randomUUID() }]
      })),
      updateBlock: (id, updates) => set((state) => ({
        blocks: state.blocks.map(b => b.id === id ? { ...b, ...updates } : b)
      })),
      deleteBlock: (id) => set((state) => ({
        blocks: state.blocks.filter(b => b.id !== id)
      })),

      addSession: (session) => set((state) => ({
        sessions: [...state.sessions, { ...session, id: crypto.randomUUID() }]
      })),
      updateSession: (id, updates) => set((state) => ({
        sessions: state.sessions.map(s => s.id === id ? { ...s, ...updates } : s)
      })),

      addMoodLog: (log) => set((state) => ({
        moodLogs: [...state.moodLogs, { ...log, id: crypto.randomUUID() }]
      })),

      addSemester: (semester) => set((state) => ({
        semesters: [...state.semesters, { ...semester, id: crypto.randomUUID() }]
      })),
      updateSemester: (id, updates) => set((state) => ({
        semesters: state.semesters.map(s => s.id === id ? { ...s, ...updates } : s)
      })),
      deleteSemester: (id) => set((state) => ({
        semesters: state.semesters.filter(s => s.id !== id)
      })),

      addNotification: (notification) => set((state) => ({
        notifications: [...state.notifications, { ...notification, id: crypto.randomUUID() }]
      })),
      markNotificationRead: (id) => set((state) => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
      })),
      clearNotifications: () => set((state) => ({
        notifications: state.notifications.filter(n => !n.read)
      })),

      setActiveFocusSessionId: (id) => set({ activeFocusSessionId: id }),

      loadSampleData: () => set((state) => {
        const sample = generateSampleData(state.profile.name || 'George');
        return {
          ...state,
          ...sample,
          profile: { ...state.profile, onboardingDone: true }
        };
      }),

      resetData: () => set({
        profile: defaultProfile,
        courses: [],
        tasks: [],
        events: [],
        blocks: [],
        sessions: [],
        moodLogs: [],
        semesters: [],
        notifications: [],
        activeFocusSessionId: null
      }),
    }),
    {
      name: 'focusos-storage',
    }
  )
);
