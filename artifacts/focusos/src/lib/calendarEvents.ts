import { isSameDay, startOfDay } from 'date-fns';
import type { Event } from './types';

export interface EventOccurrence {
  event: Event;
  start: Date;
  end: Date;
  key: string;
}

const isWeeklyClass = (event: Event) => event.type === 'class' && event.recurrence !== undefined ? event.recurrence === 'weekly' : event.type === 'class';

export const getEventOccurrence = (event: Event, day: Date): EventOccurrence | null => {
  const originalStart = new Date(event.start);
  const originalEnd = new Date(event.end);

  if (Number.isNaN(originalStart.getTime()) || Number.isNaN(originalEnd.getTime())) {
    return null;
  }

  if (isSameDay(originalStart, day)) {
    return {
      event,
      start: originalStart,
      end: originalEnd,
      key: `${event.id}-${day.toISOString()}`,
    };
  }

  if (!isWeeklyClass(event)) {
    return null;
  }

  const dayStart = startOfDay(day);
  if (dayStart < startOfDay(originalStart) || day.getDay() !== originalStart.getDay()) {
    return null;
  }

  const start = new Date(day);
  start.setHours(
    originalStart.getHours(),
    originalStart.getMinutes(),
    originalStart.getSeconds(),
    originalStart.getMilliseconds()
  );

  const end = new Date(day);
  end.setHours(
    originalEnd.getHours(),
    originalEnd.getMinutes(),
    originalEnd.getSeconds(),
    originalEnd.getMilliseconds()
  );

  return {
    event,
    start,
    end,
    key: `${event.id}-${day.toISOString()}`,
  };
};

export const getEventsForDay = (events: Event[], day: Date) =>
  events
    .map((event) => getEventOccurrence(event, day))
    .filter((occurrence): occurrence is EventOccurrence => occurrence !== null)
    .sort((a, b) => a.start.getTime() - b.start.getTime());
