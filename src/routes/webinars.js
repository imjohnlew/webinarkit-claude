import supabase from '../config/supabase.js'
import { generateSessions } from '../services/scheduler.js'

export default async function webinarRoutes(app) {
  const auth = { onRequest: [app.authenticate] }

  // ── List webinars (optionally filter by series) ───────────────────────────
  app.get('/', auth, async (req, reply) => {
    const userId = req.user.sub
    const { series_id } = req.query

    let query = supabase
      .from('webinars')
      .select(`
        *,
        webinar_schedules(*),
        webinar_blockout_dates(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (series_id) query = query.eq('series_id', series_id)

    const { data, error } = await query
    if (error) return reply.code(500).send({ error: error.message })
    return data
  })

  // ── Get a single webinar ───────────────────────────────────────────────────
  app.get('/:id', auth, async (req, reply) => {
    const userId = req.user.sub
    const { id } = req.params

    const { data, error } = await supabase
      .from('webinars')
      .select(`
        *,
        webinar_schedules(*),
        webinar_blockout_dates(*),
        email_notifications(*),
        webinar_integrations(*)
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) return reply.code(404).send({ error: 'Webinar not found' })
    return data
  })

  // ── Create a webinar ──────────────────────────────────────────────────────
  app.post('/', auth, async (req, reply) => {
    const userId = req.user.sub
    const {
      series_id,
      name,
      title,
      duration_hours = 0,
      duration_minutes = 0,
      duration_seconds = 0,
      attendee_sign_in = true,
      password,
      domain,
      brand_image_url,
      date_format = 'en-US',
      instant_watch_enabled = true,
      just_in_time_enabled = false,
      just_in_time_minutes = 15,
    } = req.body

    if (!series_id) return reply.code(400).send({ error: 'series_id is required' })
    if (!name)      return reply.code(400).send({ error: 'name is required' })

    // Verify series belongs to this user
    const { data: series } = await supabase
      .from('webinar_series')
      .select('id')
      .eq('id', series_id)
      .eq('user_id', userId)
      .single()

    if (!series) return reply.code(403).send({ error: 'Series not found' })

    const { data, error } = await supabase
      .from('webinars')
      .insert({
        series_id, user_id: userId, name, title,
        duration_hours, duration_minutes, duration_seconds,
        attendee_sign_in, password, domain, brand_image_url,
        date_format, instant_watch_enabled, just_in_time_enabled, just_in_time_minutes,
      })
      .select()
      .single()

    if (error) return reply.code(500).send({ error: error.message })
    return reply.code(201).send(data)
  })

  // ── Update a webinar ──────────────────────────────────────────────────────
  app.patch('/:id', auth, async (req, reply) => {
    const userId = req.user.sub
    const { id } = req.params

    const allowed = [
      'name', 'title', 'duration_hours', 'duration_minutes', 'duration_seconds',
      'attendee_sign_in', 'password', 'domain', 'brand_image_url', 'date_format',
      'instant_watch_enabled', 'just_in_time_enabled', 'just_in_time_minutes', 'status',
    ]

    const updates = {}
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key]
    }

    const { data, error } = await supabase
      .from('webinars')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) return reply.code(500).send({ error: error.message })
    return data
  })

  // ── Delete a webinar ──────────────────────────────────────────────────────
  app.delete('/:id', auth, async (req, reply) => {
    const userId = req.user.sub
    const { id } = req.params

    const { error } = await supabase
      .from('webinars')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) return reply.code(500).send({ error: error.message })
    return reply.code(204).send()
  })

  // ── Get upcoming sessions for a webinar ───────────────────────────────────
  // Computes on-the-fly from schedules (does not hit webinar_sessions table)
  app.get('/:id/upcoming', auth, async (req, reply) => {
    const userId = req.user.sub
    const { id } = req.params
    const { limit = 10 } = req.query

    const { data: webinar, error } = await supabase
      .from('webinars')
      .select('*, webinar_schedules(*), webinar_blockout_dates(*)')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) return reply.code(404).send({ error: 'Webinar not found' })

    const sessions = generateSessions(webinar, { limit: Number(limit) })
    return sessions
  })

  // ── Get analytics summary for a webinar ──────────────────────────────────
  app.get('/:id/analytics', auth, async (req, reply) => {
    const userId = req.user.sub
    const { id } = req.params

    // Verify ownership
    const { data: webinar } = await supabase
      .from('webinars')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (!webinar) return reply.code(404).send({ error: 'Webinar not found' })

    const { data: regs } = await supabase
      .from('registrations')
      .select('attended, watch_percentage, registered_at')
      .eq('webinar_id', id)

    const total = regs?.length ?? 0
    const attended = regs?.filter(r => r.attended).length ?? 0
    const avgWatch = total
      ? Math.round(regs.reduce((s, r) => s + r.watch_percentage, 0) / total)
      : 0

    return {
      total_registrations: total,
      total_attended: attended,
      attendance_rate: total ? Math.round((attended / total) * 100) : 0,
      avg_watch_percentage: avgWatch,
    }
  })
}
