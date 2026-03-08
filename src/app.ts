import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import cron from 'node-cron';

import { env } from './config/env';
import { webinarRoutes } from './routes/webinars';
import { scheduleRoutes } from './routes/schedules';
import { registrantRoutes } from './routes/registrants';
import { runReminderJob } from './jobs/reminderSender';
import { runSessionGeneratorJob } from './jobs/sessionGenerator';

const app = Fastify({
  logger: {
    transport:
      env.NODE_ENV === 'development'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
  },
});

async function bootstrap() {
  // Security & CORS
  await app.register(helmet);
  await app.register(cors, {
    origin: env.NODE_ENV === 'production' ? env.APP_URL : true,
  });

  // Health check
  app.get('/health', async () => ({ status: 'ok', ts: new Date().toISOString() }));

  // API routes
  await app.register(webinarRoutes, { prefix: '/webinars' });

  // Schedule + session routes nested under /webinars/:webinarId
  await app.register(
    async (instance) => {
      await instance.register(scheduleRoutes, { prefix: '/schedules' });
      await instance.register(registrantRoutes, { prefix: '' });
    },
    { prefix: '/webinars/:webinarId' },
  );

  // Public watch link route
  app.get<{ Params: { token: string } }>('/watch/:token', async (req, reply) => {
    // Delegate to registrant service for token resolution
    const { registrantService } = await import('./services/registrantService');
    const { webinarService } = await import('./services/webinarService');
    const { supabase } = await import('./config/supabase');

    const registrant = await registrantService.getByWatchToken(req.params.token);
    if (!registrant) return reply.status(404).send({ error: 'Invalid or expired watch link' });

    const [webinar, sessionRes] = await Promise.all([
      webinarService.getById(registrant.webinar_id),
      supabase
        .from('webinar_sessions')
        .select('*')
        .eq('id', registrant.session_id)
        .single(),
    ]);

    return reply.send({
      data: {
        registrant: {
          first_name: registrant.first_name,
          last_name: registrant.last_name,
        },
        webinar,
        session: sessionRes.data,
      },
    });
  });

  // ----------------------------------------------------------------
  // Background Jobs (cron)
  // ----------------------------------------------------------------

  // Every 15 minutes — send email reminders
  cron.schedule('*/15 * * * *', async () => {
    try {
      await runReminderJob();
    } catch (err) {
      app.log.error({ err }, 'Reminder job failed');
    }
  });

  // Every day at midnight — generate upcoming sessions for weekly schedules
  cron.schedule('0 0 * * *', async () => {
    try {
      await runSessionGeneratorJob();
    } catch (err) {
      app.log.error({ err }, 'Session generator job failed');
    }
  });

  // Run session generator once on startup to ensure fresh sessions exist
  runSessionGeneratorJob().catch((err) =>
    app.log.error({ err }, 'Startup session generator failed'),
  );

  // Start server
  await app.listen({ port: env.PORT, host: '0.0.0.0' });
  app.log.info(`Server running on port ${env.PORT}`);
}

bootstrap().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
