import { addDays, endOfDay, max, setHours, setMinutes, startOfDay } from 'date-fns';
import type { Block, Task } from './types';

const QUARTER_HOUR_MS = 15 * 60 * 1000;

const roundUpToQuarterHour = (date: Date) => {
  const rounded = new Date(date);
  rounded.setSeconds(0, 0);
  const minutes = rounded.getMinutes();
  const remainder = minutes % 15;
  if (remainder !== 0) {
    rounded.setMinutes(minutes + (15 - remainder));
  }
  return rounded;
};

const getDayWindow = (date: Date, startHour: number, endHour: number) => {
  const dayStart = setMinutes(setHours(startOfDay(date), startHour), 0);
  const dayEnd = setMinutes(setHours(startOfDay(date), endHour), 0);
  return { dayStart, dayEnd };
};

const overlaps = (start: Date, end: Date, block: Block) => {
  const blockStart = new Date(block.start);
  const blockEnd = new Date(block.end);
  return start < blockEnd && end > blockStart;
};

export function buildAutoSchedulePlan(tasks: Task[], blocks: Block[], now = new Date()) {
  const scheduledTaskIds = new Set(
    blocks
      .filter((block) => !!block.taskId && new Date(block.end) >= startOfDay(now))
      .map((block) => block.taskId as string)
  );

  const candidateTasks = tasks
    .filter((task) => !task.completedAt && !scheduledTaskIds.has(task.id))
    .sort((a, b) => {
      const aOverdue = new Date(a.dueAt) < now ? 1 : 0;
      const bOverdue = new Date(b.dueAt) < now ? 1 : 0;
      if (aOverdue !== bOverdue) return bOverdue - aOverdue;

      const priorityRank = { high: 3, medium: 2, low: 1 };
      if (priorityRank[a.priority] !== priorityRank[b.priority]) {
        return priorityRank[b.priority] - priorityRank[a.priority];
      }

      return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
    });

  const tasksToSchedule = candidateTasks.filter((task) => task.priority === 'high' || new Date(task.dueAt) < now);

  if (tasksToSchedule.length === 0) {
    return [];
  }

  const plannedBlocks: Omit<Block, 'id'>[] = [];
  const workingBlocks = [...blocks];

  for (let dayOffset = 0; dayOffset < 5 && tasksToSchedule.length > 0; dayOffset++) {
    const day = addDays(now, dayOffset);
    const { dayStart, dayEnd } = getDayWindow(day, 8, 22);
    let cursor = dayOffset === 0 ? max([roundUpToQuarterHour(now), dayStart]) : dayStart;

    while (cursor < dayEnd && tasksToSchedule.length > 0) {
      const task = tasksToSchedule[0];
      const durationMs = Math.max(task.estMin, 15) * 60 * 1000;
      const candidateEnd = new Date(cursor.getTime() + durationMs);

      if (candidateEnd > dayEnd) {
        break;
      }

      const conflictingBlock = workingBlocks
        .filter((block) => {
          const blockStart = new Date(block.start);
          return blockStart < endOfDay(day) && new Date(block.end) > startOfDay(day);
        })
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
        .find((block) => overlaps(cursor, candidateEnd, block));

      if (conflictingBlock) {
        cursor = roundUpToQuarterHour(new Date(conflictingBlock.end));
        continue;
      }

      const newBlock: Omit<Block, 'id'> = {
        title: task.title,
        taskId: task.id,
        start: cursor.toISOString(),
        end: candidateEnd.toISOString(),
      };

      plannedBlocks.push(newBlock);
      workingBlocks.push(newBlock as Block);
      tasksToSchedule.shift();
      cursor = roundUpToQuarterHour(new Date(candidateEnd.getTime() + QUARTER_HOUR_MS));
    }
  }

  return plannedBlocks;
}
