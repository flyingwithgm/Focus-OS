import { z } from 'zod';

export const ClassSessionSchema = z.object({
  id: z.string(),
  title: z.string(),
  courseId: z.string().optional(),
  dayOfWeek: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
  startTime: z.string(), // e.g., "09:00"
  endTime: z.string(),   // e.g., "10:30"
  location: z.string().optional(),
  color: z.string().default('--info'),
  attendance: z.record(z.string(), z.enum(['present', 'absent', 'late'])).optional(),
});

export type ClassSession = z.infer<typeof ClassSessionSchema>;