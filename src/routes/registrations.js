import supabase from '../config/supabase.js'
import { generateSessions, generateInstantSession } from '../services/scheduler.js'

export default async function registrationRoutes(app) {
  const auth = { onRequest: [app.authenticate] }

  // ── Public: Register for a webinar session ────────────────────────────────
  // No auth required — attendees register publicly.
  /**
   * POST /api/registrations
   *
   * Body:
   *   webinar_id   UUID
   *   email        string
   *   first_name   string (optional)
   *   last_name    string (optional)
   *   session_start ISO datetime (optional — omit for instant/JIT watch)
   */
  app.post('/', async (req, reply) => {
    const { webinar_id, email, first_name, last_name, session_start } = req.body

    if (!webinar_id) return reply.code(400).send({ error: 'webinar_id is required' })
    if (!email)      return reply.code(400).send({ error: 'email is required' })

    // Fetch webinar (must be active)
    const { data: webinar, error: wErr } = await supabase
      .from('webinars')
      .select('*, webinar_schedules(*), webinar_blockout_dates(*)')
      .eq('id', webinar_id)
      .eq('status', 'active')
      .single()

    if (wErr || !webinar) return reply.code(404).send({ error: 'Webinar not found or inactive' })

    let sessionId = null
    let sessionData = null

    if (session_start) {
      // Specific scheduled session
      const { data: session } = await supabase
        .from('webinar_sessions')
        .select('id, session_start, session_end')
        .eq('webinar_id', webinar_id)
        .eq('session_start', session_start)
        .single()

      if (session) {
        sessionId = session.id
        sessionData = session
      }
    } else if (webinar.instant_watch_enabled) {
      // Instant watch — create/find a session for now
      const now = new Date().toISOString()
      const { data: existing } = await supabase
        .from('webinar_sessions')
        .select('id, session_start, session_end')
        .eq('webinar_id', webinar_id)
        .lte('session_start', now)
        .gte('session_end', now)
        .order('session_start', { ascending: false })
        .limit(1)
        .single()

      if (existing) {
        sessionId = existing.id
        sessionData = existing
      } else {
        // Create an on-demand instant session
        const instant = generateInstantSession(webinar, 0)
        const { data: newSession } = await supabase
          .from('webinar_sessions')
          .insert({
            webinar_id,
            session_start: instant.start,
            session_end:   instant.end,
          })
          .select()
          .single()
        if (newSession) {
          sessionId = newSession.id
          sessionData = newSession
        }
      }
    } else if (webinar.just_in_time_enabled) {
      // Just-in-time: session starts in X minutes
      const jit = generateInstantSession(webinar, webinar.just_in_time_minutes ?? 15)
      const { data: newSession } = await supabase
        .from('webinar_sessions')
        .insert({
          webinar_id,
          session_start: jit.start,
          session_end:   jit.end,
        })
        .select()
        .single()
      if (newSession) {
        sessionId = newSession.id
        sessionData = newSession
      }
    } else {
      // Pick the next upcoming scheduled session
      const upcoming = generateSessions(webinar, { limit: 1 })
      if (upcoming.length === 0) {
        return reply.code(409).send({ error: 'No upcoming sessions available' })
      }
      // Upsert session in DB
      const { data: newSession } = await supabase
        .from('webinar_sessions')
        .upsert(
          { webinar_id, session_start: upcoming[0].start, session_end: upcoming[0].end },
          { onConflict: 'webinar_id,session_start' }
        )
        .select()
        .single()
      if (newSession) {
        sessionId = newSession.id
        sessionData = newSession
      }
    }

    // Upsert registration (same email + webinar + session = update existing)
    const { data: registration, error: regErr } = await supabase
      .from('registrations')
      .upsert(
        { webinar_id, session_id: sessionId, email, first_name, last_name },
        { onConflict: 'webinar_id,session_id,email', ignoreDuplicates: false }
      )
      .select()
      .single()

    if (regErr) return reply.code(500).send({ error: regErr.message })

    return reply.code(201).send({
      registration,
      session: sessionData,
      watch_url: `${process.env.APP_URL}/watch/${registration.watch_token}`,
    })
  })

  // ── Public: Get watch info via token ──────────────────────────────────────
  app.get('/watch/:token', async (req, reply) => {
    const { token } = req.params

    const { data, error } = await supabase
      .from('registrations')
      .select(`
        id, email, first_name, last_name, attended, watch_percentage,
        webinar_id,
        webinar_sessions(session_start, session_end),
        webinars(name, title, duration_hours, duration_minutes, duration_seconds, instant_watch_enabled)
      `)
      .eq('watch_token', token)
      .single()

    if (error || !data) return reply.code(404).send({ error: 'Invalid or expired watch link' })
    return data
  })

  // ── Public: Update watch progress ─────────────────────────────────────────
  app.patch('/watch/:token/progress', async (req, reply) => {
    const { token } = req.params
    const { watch_percentage, attended } = req.body

    const updates = {}
    if (watch_percentage !== undefined) {
      if (watch_percentage < 0 || watch_percentage > 100) {
        return reply.code(400).send({ error: 'watch_percentage must be 0–100' })
      }
      updates.watch_percentage = watch_percentage
    }
    if (attended !== undefined) updates.attended = attended

    const { data, error } = await supabase
      .from('registrations')
      .update(updates)
      .eq('watch_token', token)
      .select('id, watch_percentage, attended')
      .single()

    if (error) return reply.code(500).send({ error: error.message })
    return data
  })

  // ── Authenticated: List registrations for a webinar ───────────────────────
  app.get('/webinar/:webinarId', auth, async (req, reply) => {
    const userId = req.user.sub
    const { webinarId } = req.params
    const { page = 1, limit = 50 } = req.query

    // Verify ownership
    const { data: webinar } = await supabase
      .from('webinars')
      .select('id')
      .eq('id', webinarId)
      .eq('user_id', userId)
      .single()

    if (!webinar) return reply.code(403).send({ error: 'Forbidden' })

    const offset = (Number(page) - 1) * Number(limit)

    const { data, error, count } = await supabase
      .from('registrations')
      .select('*, webinar_sessions(session_start, session_end)', { count: 'exact' })
      .eq('webinar_id', webinarId)
      .order('registered_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1)

    if (error) return reply.code(500).send({ error: error.message })
    return { data, total: count, page: Number(page), limit: Number(limit) }
  })
}
