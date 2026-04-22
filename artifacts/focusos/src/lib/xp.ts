export const XP_REWARDS = {
  TASK_COMPLETE: 10,
  SESSION_DONE: 20,
  SESSION_PARTIAL: 10,
  STREAK_MAINTAINED: 50
};

export const BADGES = [
  { id: 'first_task', name: 'First Steps', description: 'Complete your first task', icon: 'CheckCircle' },
  { id: 'first_session', name: 'Deep Focus', description: 'Complete your first focus session', icon: 'Brain' },
  { id: 'streak_3', name: 'On Fire', description: 'Maintain a 3-day streak', icon: 'Flame' },
  { id: 'level_5', name: 'Rising Star', description: 'Reach Level 5', icon: 'Star' }
];

export function getLevelForXP(xp: number) {
  return Math.floor(xp / 100) + 1;
}

export function getXPForNextLevel(level: number) {
  return level * 100;
}
