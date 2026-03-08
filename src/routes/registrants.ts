import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { registrantService } from '../services/registrantService';
import { webinarService } from '../services/webinarService';
import { env } from '../config/env';

const registerSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  session_id: z.string().uuid(),
});

type WebinarParams = { webinarId: string };
type TokenParams = { token: string };

export async function registrantRoutes(app: FastifyInstance) {
  // POST /webinars/:webinarId/register
  app.post<{ Params: WebinarParams }>('/register', async (req, reply) => {
    const webinar = await webinarService.getById(req.params.webinarId);
    if (!webinar) return reply.status(404).send({ error: 'Webinar not found' });
    if (webinar.status !== 'active') {
      return reply.status(400).send({ error: 'This webinar is not accepting registrations' });
    }

    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
    }

    try {
      const registrant = await registrantService.register(parsed.data);
      const watchUrl = `${env.APP_URL}/watch/${registrant.watch_token}`;
      return reply.status(201).send({
        data: {
          ...registrant,
          watch_url: watchUrl,
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      return reply.status(400).send({ error: message });
    }
  });

  // GET /webinars/:webinarId/registrants
  app.get<{ Params: WebinarParams }>('/registrants', async (req, reply) => {
    const registrants = await registrantService.listForWebinar(req.params.webinarId);
    return reply.send({ data: registrants, count: registrants.length });
  });

  // GET /webinars/:webinarId/sessions/:sessionId/registrants
  app.get<{ Params: { webinarId: string; sessionId: string } }>(
    '/sessions/:sessionId/registrants',
    async (req, reply) => {
      const registrants = await registrantService.listForSession(req.params.sessionId);
      return reply.send({ data: registrants, count: registrants.length });
    },
  );

  // GET /watch/:token  — resolve a watch link to webinar + registrant info
  app.get<{ Params: TokenParams }>('/watch/:token', async (req, reply) => {
    const registrant = await registrantService.getByWatchToken(req.params.token);
    if (!registrant) return reply.status(404).send({ error: 'Invalid or expired watch link' });

    const webinar = await webinarService.getById(registrant.webinar_id);
    return reply.send({
      data: {
        registrant: {
          first_name: registrant.first_name,
          last_name: registrant.last_name,
          email: registrant.email,
        },
        webinar,
        session_id: registrant.session_id,
      },
    });
  });
}
