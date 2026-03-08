import supabase from '../config/supabase.js'
import { generateSessions } from '../services/scheduler.js'

const VALID_DAYS = ['Day', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const VALID_PERIODS = ['AM', 'PM']

/** Verify the webinar belongs to the authenticated user. */
async function getOwnedWebinar(webinarId, userId) {
  const { data } = await supabase
    .from('webinars')
    .select('id, duration_hours, duration_minutes, duration_seconds, webinar_schedules(*), webinar_blockout_dates(*)')
    .eq('id', webinarId)
    .eq('user_id', userId)
    .single()
  return data
}

export default async function scheduleRoutes(app) {
  const auth = { onRequest: [app.authenticate] }

  // ══════════════════════════════════════════════════════════════════════════
  // SCHEDULED DATES
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * GET /api/webinars/:webinarId/schedules
   * List all schedule rules for a webinar.
   */
  app.get('/:webinarId/schedules', auth, async (req, reply) => {
    const userId = req.user.sub
    const { webinarId } = req.params

    const webinar = await getOwnedWebinar(webinarId, userId)
    if (!webinar) return reply.code(404).send({ error: 'Webinar not found' })

    const { data, error } = await supabase
      .from('webinar_schedules')
      .select('*')
      .eq('webinar_id', webinarId)
      .order('created_at', { ascending: true })

    if (error) return reply.code(500).send({ error: error.message })
    return data
  })

  /**
   * POST /api/webinars/:webinarId/schedules
   * Add a new schedule rule.
   *
   * Body:
   *   type             "Every" | "On"
   *   day              "Day"|"Monday"|…|"Sunday"  (type=Every)
   *                    "YYYY-MM-DD"               (type=On)
   *   time             "8:00"
   *   period           "AM" | "PM"
   *   timezone         IANA string, e.g. "Asia/Kuala_Lumpur"
   *   sessions_to_show number (default 1)
   */
  app.post('/:webinarId/schedules', auth, async (req, reply) => {
    const userId = req.user.sub
    const { webinarId } = req.params
    const {
      type,
      day,
      time,
      period,
      timezone = 'UTC',
      sessions_to_show = 1,
    } = req.body

    const webinar = await getOwnedWebinar(webinarId, userId)
    if (!webinar) return reply.code(404).send({ error: 'Webinar not found' })

    // Validation
    if (!['Every', 'On'].includes(type)) {
      return reply.code(400).send({ error: 'type must be "Every" or "On"' })
    }
    if (type === 'Every' && !VALID_DAYS.includes(day)) {
      return reply.code(400).send({ error: `day must be one of: ${VALID_DAYS.join(', ')}` })
    }
    if (type === 'On' && !/^\d{4}-\d{2}-\d{2}$/.test(day)) {
      return reply.code(400).send({ error: 'day must be YYYY-MM-DD for type "On"' })
    }
    if (!time || !/^\d{1,2}:\d{2}$/.test(time)) {
      return reply.code(400).send({ error: 'time must be in "H:MM" format' })
    }
    if (!VALID_PERIODS.includes(period)) {
      return reply.code(400).send({ error: 'period must be "AM" or "PM"' })
    }

    const { data, error } = await supabase
      .from('webinar_schedules')
      .insert({ webinar_id: webinarId, type, day, time, period, timezone, sessions_to_show })
      .select()
      .single()

    if (error) return reply.code(500).send({ error: error.message })

    // Return the new schedule with upcoming sessions preview
    const updatedWebinar = await getOwnedWebinar(webinarId, userId)
    const upcoming = generateSessions(updatedWebinar, { limit: sessions_to_show })

    return reply.code(201).send({ schedule: data, upcoming })
  })

  /**
   * PATCH /api/webinars/:webinarId/schedules/:scheduleId
   * Update an existing schedule rule.
   */
  app.patch('/:webinarId/schedules/:scheduleId', auth, async (req, reply) => {
    const userId = req.user.sub
    const { webinarId, scheduleId } = req.params

    const webinar = await getOwnedWebinar(webinarId, userId)
    if (!webinar) return reply.code(404).send({ error: 'Webinar not found' })

    const allowed = ['type', 'day', 'time', 'period', 'timezone', 'sessions_to_show']
    const updates = {}
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key]
    }

    const { data, error } = await supabase
      .from('webinar_schedules')
      .update(updates)
      .eq('id', scheduleId)
      .eq('webinar_id', webinarId)
      .select()
      .single()

    if (error) return reply.code(500).send({ error: error.message })
    return data
  })

  /**
   * DELETE /api/webinars/:webinarId/schedules/:scheduleId
   * Remove a schedule rule.
   */
  app.delete('/:webinarId/schedules/:scheduleId', auth, async (req, reply) => {
    const userId = req.user.sub
    const { webinarId, scheduleId } = req.params

    const webinar = await getOwnedWebinar(webinarId, userId)
    if (!webinar) return reply.code(404).send({ error: 'Webinar not found' })

    const { error } = await supabase
      .from('webinar_schedules')
      .delete()
      .eq('id', scheduleId)
      .eq('webinar_id', webinarId)

    if (error) return reply.code(500).send({ error: error.message })
    return reply.code(204).send()
  })

  // ══════════════════════════════════════════════════════════════════════════
  // BLOCKOUT DATES
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * GET /api/webinars/:webinarId/blockouts
   * List all blockout dates.
   */
  app.get('/:webinarId/blockouts', auth, async (req, reply) => {
    const userId = req.user.sub
    const { webinarId } = req.params

    const webinar = await getOwnedWebinar(webinarId, userId)
    if (!webinar) return reply.code(404).send({ error: 'Webinar not found' })

    const { data, error } = await supabase
      .from('webinar_blockout_dates')
      .select('*')
      .eq('webinar_id', webinarId)
      .order('blockout_date', { ascending: true })

    if (error) return reply.code(500).send({ error: error.message })
    return data
  })

  /**
   * POST /api/webinars/:webinarId/blockouts
   * Add a blockout date.
   *
   * Body: { date: "YYYY-MM-DD" }
   */
  app.post('/:webinarId/blockouts', auth, async (req, reply) => {
    const userId = req.user.sub
    const { webinarId } = req.params
    const { date } = req.body

    const webinar = await getOwnedWebinar(webinarId, userId)
    if (!webinar) return reply.code(404).send({ error: 'Webinar not found' })

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return reply.code(400).send({ error: 'date must be YYYY-MM-DD' })
    }

    const { data, error } = await supabase
      .from('webinar_blockout_dates')
      .insert({ webinar_id: webinarId, blockout_date: date })
      .select()
      .single()

    if (error) {
      // Unique violation = already exists
      if (error.code === '23505') return reply.code(409).send({ error: 'Blockout date already exists' })
      return reply.code(500).send({ error: error.message })
    }

    return reply.code(201).send(data)
  })

  /**
   * DELETE /api/webinars/:webinarId/blockouts/:blockoutId
   * Remove a blockout date.
   */
  app.delete('/:webinarId/blockouts/:blockoutId', auth, async (req, reply) => {
    const userId = req.user.sub
    const { webinarId, blockoutId } = req.params

    const webinar = await getOwnedWebinar(webinarId, userId)
    if (!webinar) return reply.code(404).send({ error: 'Webinar not found' })

    const { error } = await supabase
      .from('webinar_blockout_dates')
      .delete()
      .eq('id', blockoutId)
      .eq('webinar_id', webinarId)

    if (error) return reply.code(500).send({ error: error.message })
    return reply.code(204).send()
  })

  // ══════════════════════════════════════════════════════════════════════════
  // INSTANT WATCH / JUST-IN-TIME SETTINGS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * PATCH /api/webinars/:webinarId/instant-watch
   * Toggle instant watch sessions on/off.
   *
   * Body: { enabled: boolean }
   */
  app.patch('/:webinarId/instant-watch', auth, async (req, reply) => {
    const userId = req.user.sub
    const { webinarId } = req.params
    const { enabled } = req.body

    if (typeof enabled !== 'boolean') {
      return reply.code(400).send({ error: 'enabled must be a boolean' })
    }

    const { data, error } = await supabase
      .from('webinars')
      .update({ instant_watch_enabled: enabled })
      .eq('id', webinarId)
      .eq('user_id', userId)
      .select('id, instant_watch_enabled')
      .single()

    if (error) return reply.code(500).send({ error: error.message })
    return data
  })

  /**
   * PATCH /api/webinars/:webinarId/just-in-time
   * Toggle just-in-time sessions on/off.
   *
   * Body: { enabled: boolean, minutes?: number }
   */
  app.patch('/:webinarId/just-in-time', auth, async (req, reply) => {
    const userId = req.user.sub
    const { webinarId } = req.params
    const { enabled, minutes } = req.body

    if (typeof enabled !== 'boolean') {
      return reply.code(400).send({ error: 'enabled must be a boolean' })
    }

    const updates = { just_in_time_enabled: enabled }
    if (minutes !== undefined) updates.just_in_time_minutes = minutes

    const { data, error } = await supabase
      .from('webinars')
      .update(updates)
      .eq('id', webinarId)
      .eq('user_id', userId)
      .select('id, just_in_time_enabled, just_in_time_minutes')
      .single()

    if (error) return reply.code(500).send({ error: error.message })
    return data
  })
}
