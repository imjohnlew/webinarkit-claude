import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { scheduleService } from '../services/scheduleService';
import { webinarService } from '../services/webinarService';

const weekdaySchema = z.union([
  z.literal(0), z.literal(1), z.literal(2), z.literal(3),
  z.literal(4), z.literal(5), z.literal(6),
]);

const createScheduleSchema = z.object({
  timezone: z.string().min(1),
  start_datetime: z.string().datetime({ offset: true }),
  duration_minutes: z.number().int().min(1).max(480).optional(),
  recurrence_type: z.enum(['once', 'weekly']),
  recurrence_days: z.array(weekdaySchema).optional(),
  recurrence_end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
}).refine(
  (d) => d.recurrence_type !== 'weekly' || (d.recurrence_days && d.recurrence_days.length > 0),
  { message: 'recurrence_days is required for weekly schedules', path: ['recurrence_days'] },
);

const updateScheduleSchema = z.object({
  timezone: z.string().optional(),
  start_datetime: z.string().datetime({ offset: true }).optional(),
  duration_minutes: z.number().int().min(1).max(480).optional(),
  recurrence_type: z.enum(['once', 'weekly']).optional(),
  recurrence_days: z.array(weekdaySchema).optional(),
  recurrence_end_date: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
});

type WebinarParams = { webinarId: string };
type ScheduleParams = { webinarId: string; scheduleId: string };

export async function scheduleRoutes(app: FastifyInstance) {
  // GET /webinars/:webinarId/schedules
  app.get<{ Params: WebinarParams }>('/', async (req, reply) => {
    const webinar = await webinarService.getById(req.params.webinarId);
    if (!webinar) return reply.status(404).send({ error: 'Webinar not found' });

    const schedules = await scheduleService.listForWebinar(req.params.webinarId);
    return reply.send({ data: schedules });
  });

  // POST /webinars/:webinarId/schedules
  app.post<{ Params: WebinarParams }>('/', async (req, reply) => {
    const webinar = await webinarService.getById(req.params.webinarId);
    if (!webinar) return reply.status(404).send({ error: 'Webinar not found' });

    const parsed = createScheduleSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
    }

    const schedule = await scheduleService.create(req.params.webinarId, parsed.data);

    // Auto-generate sessions immediately after creating the schedule
    const sessions = await scheduleService.generateSessions(schedule.id);

    return reply.status(201).send({ data: schedule, sessions_generated: sessions.length });
  });

  // PUT /webinars/:webinarId/schedules/:scheduleId
  app.put<{ Params: ScheduleParams }>('/:scheduleId', async (req, reply) => {
    const parsed = updateScheduleSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
    }

    const schedule = await scheduleService.update(req.params.scheduleId, parsed.data);
    if (!schedule) return reply.status(404).send({ error: 'Schedule not found' });

    return reply.send({ data: schedule });
  });

  // DELETE /webinars/:webinarId/schedules/:scheduleId
  app.delete<{ Params: ScheduleParams }>('/:scheduleId', async (req, reply) => {
    const deleted = await scheduleService.delete(req.params.scheduleId);
    if (!deleted) return reply.status(404).send({ error: 'Schedule not found' });
    return reply.status(204).send();
  });

  // POST /webinars/:webinarId/schedules/:scheduleId/generate-sessions
  // Manually trigger session generation (e.g. to refresh upcoming sessions)
  app.post<{ Params: ScheduleParams; Querystring: { horizon_days?: string } }>(
    '/:scheduleId/generate-sessions',
    async (req, reply) => {
      const horizonDays = parseInt(req.query.horizon_days ?? '90', 10);
      const sessions = await scheduleService.generateSessions(req.params.scheduleId, horizonDays);
      return reply.send({ data: sessions, count: sessions.length });
    },
  );

  // GET /webinars/:webinarId/sessions  (upcoming sessions)
  app.get<{ Params: WebinarParams }>('/sessions', async (req, reply) => {
    const sessions = await scheduleService.listUpcomingSessions(req.params.webinarId);
    return reply.send({ data: sessions });
  });

  // GET /webinars/:webinarId/sessions/next
  app.get<{ Params: WebinarParams }>('/sessions/next', async (req, reply) => {
    const session = await scheduleService.nextSession(req.params.webinarId);
    if (!session) return reply.status(404).send({ error: 'No upcoming sessions found' });
    return reply.send({ data: session });
  });
}
