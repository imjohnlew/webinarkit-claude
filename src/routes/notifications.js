import supabase from '../config/supabase.js'

const NOTIFICATION_TYPES = [
  'confirmation',
  '2day_reminder',
  '1day_reminder',
  '3hour_reminder',
  '30min_reminder',
  'attended',
  'did_not_attend',
  'watched_25',
  'watched_50',
  'watched_75',
  'watched_100',
  'clicked_offer',
  'did_not_click_offer',
  'right_after',
  '1day_after',
  '2days_after',
  '3days_after',
  'viewed_replay',
  'did_not_view_replay',
  'clicked_replay_button',
  'did_not_click_replay_button',
]

export default async function notificationRoutes(app) {
  const auth = { onRequest: [app.authenticate] }

  // ── List all notification configs for a webinar ───────────────────────────
  app.get('/:webinarId/notifications', auth, async (req, reply) => {
    const userId = req.user.sub
    const { webinarId } = req.params

    const { data: webinar } = await supabase
      .from('webinars')
      .select('id')
      .eq('id', webinarId)
      .eq('user_id', userId)
      .single()

    if (!webinar) return reply.code(404).send({ error: 'Webinar not found' })

    const { data, error } = await supabase
      .from('email_notifications')
      .select('*')
      .eq('webinar_id', webinarId)
      .order('created_at', { ascending: true })

    if (error) return reply.code(500).send({ error: error.message })

    // Return all types, filling in defaults for any not yet configured
    const configured = new Map(data.map(n => [n.notification_type, n]))
    return NOTIFICATION_TYPES.map(type => configured.get(type) ?? {
      webinar_id: webinarId,
      notification_type: type,
      enabled: false,
      subject: null,
      body_html: null,
    })
  })

  // ── Upsert a single notification config ───────────────────────────────────
  /**
   * PUT /api/webinars/:webinarId/notifications/:type
   *
   * Body:
   *   enabled    boolean
   *   subject    string (optional)
   *   body_html  string (optional)
   */
  app.put('/:webinarId/notifications/:type', auth, async (req, reply) => {
    const userId = req.user.sub
    const { webinarId, type } = req.params
    const { enabled, subject, body_html } = req.body

    const { data: webinar } = await supabase
      .from('webinars')
      .select('id')
      .eq('id', webinarId)
      .eq('user_id', userId)
      .single()

    if (!webinar) return reply.code(404).send({ error: 'Webinar not found' })
    if (!NOTIFICATION_TYPES.includes(type)) {
      return reply.code(400).send({ error: `Invalid notification type. Valid types: ${NOTIFICATION_TYPES.join(', ')}` })
    }

    const { data, error } = await supabase
      .from('email_notifications')
      .upsert(
        { webinar_id: webinarId, notification_type: type, enabled, subject, body_html },
        { onConflict: 'webinar_id,notification_type' }
      )
      .select()
      .single()

    if (error) return reply.code(500).send({ error: error.message })
    return data
  })
}
