import { z } from 'zod';

/**
 * /class-schedule — see specs/007-class-schedule-config/contracts/class-schedule-endpoints.md
 *
 * Every hour travels as MINUTES SINCE MIDNIGHT, never as a string and never as a date. That is what
 * makes FR-018a hold by construction: a wall-clock hour that no seasonal clock change can shift and
 * that is never converted to the viewer's timezone. A `Date` here would be converted by drivers and
 * browsers alike, and the whole grid would slide by an hour the moment server and client disagree.
 */

export const dayOfWeekSchema = z.enum([
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]);

export type DayOfWeek = z.infer<typeof dayOfWeekSchema>;

/** Declaration order is the order of the week, and therefore the order of the grid. */
export const DAYS_OF_WEEK = dayOfWeekSchema.options;

export const classAgeGroupSchema = z.enum(['menores', 'adultos']);
export type ClassAgeGroup = z.infer<typeof classAgeGroupSchema>;

export const classLevelSchema = z.enum(['iniciantes', 'intermedios', 'avanzados']);
export type ClassLevel = z.infer<typeof classLevelSchema>;

/**
 * The ranges live in the schema because they are properties of the FORMAT — a minute of the day.
 * The business rules (end after start, no overlap, inside the opening hours) live in the domain and
 * answer with a contract error, not with an unhandled ZodError. Same reasoning skater-profile
 * documented for nombre/apellido.
 */
const startMinuteSchema = z.number().int().min(0).max(1439);
const endMinuteSchema = z.number().int().min(1).max(1440);

export const scheduledClassSchema = z.object({
  id: z.string(),
  dayOfWeek: dayOfWeekSchema,
  startsAtMinute: startMinuteSchema,
  endsAtMinute: endMinuteSchema,
  ageGroup: classAgeGroupSchema,
  level: classLevelSchema,
});

export type ScheduledClassResponse = z.infer<typeof scheduledClassSchema>;

export const skateparkDayHoursSchema = z.object({
  dayOfWeek: dayOfWeekSchema,
  closed: z.boolean(),
  opensAtMinute: startMinuteSchema.nullable(),
  closesAtMinute: endMinuteSchema.nullable(),
});

export type SkateparkDayHoursResponse = z.infer<typeof skateparkDayHoursSchema>;

/**
 * GET /class-schedule — the whole section in one read.
 *
 * Grid and hours come together because the screen shows them together and a class cannot be
 * validated against anything without the hours. `hours` carries ONLY the configured days: a missing
 * day is unconfigured, which is not the same as closed (FR-018).
 */
export const getClassScheduleResponseSchema = z.object({
  classes: z.array(scheduledClassSchema),
  hours: z.array(skateparkDayHoursSchema),
});

export type GetClassScheduleResponse = z.infer<typeof getClassScheduleResponseSchema>;

export const GET_CLASS_SCHEDULE_ROUTE = {
  method: 'GET',
  path: '/class-schedule',
} as const;

export const scheduledClassInputSchema = z.object({
  dayOfWeek: dayOfWeekSchema,
  startsAtMinute: startMinuteSchema,
  endsAtMinute: endMinuteSchema,
  ageGroup: classAgeGroupSchema,
  level: classLevelSchema,
});

export type ScheduledClassInput = z.infer<typeof scheduledClassInputSchema>;

export const CREATE_SCHEDULED_CLASS_ROUTE = {
  method: 'POST',
  path: '/class-schedule/classes',
} as const;

export const UPDATE_SCHEDULED_CLASS_ROUTE = {
  method: 'PUT',
  path: '/class-schedule/classes/:id',
} as const;

export const DELETE_SCHEDULED_CLASS_ROUTE = {
  method: 'DELETE',
  path: '/class-schedule/classes/:id',
} as const;

/**
 * The discriminated union makes it impossible BY TYPE to send a closed day carrying hours, or an
 * open day without them — two of the data model's rules are settled before the domain is reached.
 */
export const setSkateparkDayHoursRequestSchema = z.discriminatedUnion('closed', [
  z.object({ closed: z.literal(true) }),
  z.object({
    closed: z.literal(false),
    opensAtMinute: startMinuteSchema,
    closesAtMinute: endMinuteSchema,
  }),
]);

export type SetSkateparkDayHoursRequest = z.infer<typeof setSkateparkDayHoursRequestSchema>;

export const SET_SKATEPARK_DAY_HOURS_ROUTE = {
  method: 'PUT',
  path: '/class-schedule/hours/:dayOfWeek',
} as const;
