import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'

import seriesRoutes from './routes/series.js'
import webinarRoutes from './routes/webinars.js'
import scheduleRoutes from './routes/schedules.js'
import registrationRoutes from './routes/registrations.js'
import notificationRoutes from './routes/notifications.js'

const app = Fastify({ logger: true })

// ── Plugins ──────────────────────────────────────────────────────────────────
await app.register(cors, { origin: true })

await app.register(jwt, { secret: process.env.JWT_SECRET })

// ── Auth decorator ────────────────────────────────────────────────────────────
app.decorate('authenticate', async (request, reply) => {
  try {
    await request.jwtVerify()
  } catch {
    reply.code(401).send({ error: 'Unauthorized' })
  }
})

// ── Routes ────────────────────────────────────────────────────────────────────
await app.register(seriesRoutes,       { prefix: '/api/series' })
await app.register(webinarRoutes,      { prefix: '/api/webinars' })
await app.register(scheduleRoutes,     { prefix: '/api/webinars' })
await app.register(registrationRoutes, { prefix: '/api/registrations' })
await app.register(notificationRoutes, { prefix: '/api/webinars' })

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', async () => ({ status: 'ok' }))

// ── Start ─────────────────────────────────────────────────────────────────────
try {
  await app.listen({
    port: Number(process.env.PORT ?? 3000),
    host: process.env.HOST ?? '0.0.0.0',
  })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
