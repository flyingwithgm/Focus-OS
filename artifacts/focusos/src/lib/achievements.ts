import { useStore } from './store';
import { toast } from 'sonner';

export const BADGES = [
  { id: 'first_session', name: 'First Session', description: 'Complete your first focus session', icon: 'Target' },
  { id: 'week_warrior', name: 'Week Warrior', description: '7-day streak', icon: 'Flame' },
  { id: 'ten_hours', name: 'Ten Hours', description: '10 total focus hours', icon: 'Clock' },
  { id: 'task_master', name: 'Task Master', description: '50 tasks completed', icon: 'CheckCircle' },
  { id: 'gpa_guardian', name: 'GPA Guardian', description: 'Set a GPA target', icon: 'Shield' },
  { id: 'night_owl', name: 'Night Owl', description: 'Session after 10pm', icon: 'Moon' },
  { id: 'early_bird', name: 'Early Bird', description: 'Session before 7am', icon: 'Sun' },
  { id: 'perfect_week', name: 'Perfect Week', description: 'Hit weekly target 4 weeks in a row', icon: 'Calendar' },
  { id: 'comeback_kid', name: 'Comeback Kid', description: 'Restore a streak after breaking it', icon: 'RefreshCw' },
  { id: 'scholar', name: 'Scholar', description: 'Reach GPA 3.5+', icon: 'GraduationCap' },
];

export function checkAchievements() {
  const store = useStore.getState();
  const { profile, tasks, sessions } = store;
  
  const earnedBadgeIds = new Set(profile.badges.map(b => b.id));
  const newBadges: { id: string; unlockedAt: string }[] = [];

  const unlock = (id: string) => {
    if (!earnedBadgeIds.has(id)) {
      newBadges.push({ id, unlockedAt: new Date().toISOString() });
      earnedBadgeIds.add(id);
      const badgeDef = BADGES.find(b => b.id === id);
      if (badgeDef) {
        toast.success(`Achievement Unlocked: ${badgeDef.name}!`, { icon: '🏆' });
      }
    }
  };

  // Check logic
  if (sessions.length > 0) unlock('first_session');
  if (profile.streak.count >= 7) unlock('week_warrior');
  
  const totalFocusMin = sessions.reduce((acc, s) => acc + s.actualMin, 0);
  if (totalFocusMin >= 600) unlock('ten_hours');

  const completedTasks = tasks.filter(t => t.completedAt);
  if (completedTasks.length >= 50) unlock('task_master');

  // GPA Guardian - assuming target is stored somewhere, let's say target is set if it exists in store (will handle later)

  sessions.forEach(s => {
    const d = new Date(s.startedAt);
    const hour = d.getHours();
    if (hour >= 22) unlock('night_owl');
    if (hour < 7) unlock('early_bird');
  });

  if (newBadges.length > 0) {
    store.updateProfile({ badges: [...profile.badges, ...newBadges] });
  }
}
