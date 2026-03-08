import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { webinarService } from '../services/webinarService';

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  video_url: z.string().url(),
  host_name: z.string().min(1),
  host_email: z.string().email(),
  host_bio: z.string().optional(),
  cover_image_url: z.string().url().optional(),
});

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  video_url: z.string().url().optional(),
  host_name: z.string().optional(),
  host_email: z.string().email().optional(),
  host_bio: z.string().optional(),
  cover_image_url: z.string().url().optional(),
  status: z.enum(['draft', 'active', 'archived']).optional(),
});

export async function webinarRoutes(app: FastifyInstance) {
  // GET /webinars
  app.get('/', async (_req, reply) => {
    const webinars = await webinarService.list();
    return reply.send({ data: webinars });
  });

  // GET /webinars/:id
  app.get<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const webinar = await webinarService.getById(req.params.id);
    if (!webinar) return reply.status(404).send({ error: 'Webinar not found' });
    return reply.send({ data: webinar });
  });

  // POST /webinars
  app.post('/', async (req, reply) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
    }
    const webinar = await webinarService.create(parsed.data);
    return reply.status(201).send({ data: webinar });
  });

  // PUT /webinars/:id
  app.put<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
    }
    const webinar = await webinarService.update(req.params.id, parsed.data);
    if (!webinar) return reply.status(404).send({ error: 'Webinar not found' });
    return reply.send({ data: webinar });
  });

  // DELETE /webinars/:id
  app.delete<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const deleted = await webinarService.delete(req.params.id);
    if (!deleted) return reply.status(404).send({ error: 'Webinar not found' });
    return reply.status(204).send();
  });
}
