import supabase from '../config/supabase.js'

export default async function seriesRoutes(app) {
  const auth = { onRequest: [app.authenticate] }

  // ── List all series for the authenticated user ─────────────────────────────
  app.get('/', auth, async (req, reply) => {
    const userId = req.user.sub

    const { data, error } = await supabase
      .from('webinar_series')
      .select(`
        *,
        webinars(id, name, status, instant_watch_enabled)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) return reply.code(500).send({ error: error.message })
    return data
  })

  // ── Get a single series ────────────────────────────────────────────────────
  app.get('/:id', auth, async (req, reply) => {
    const userId = req.user.sub
    const { id } = req.params

    const { data, error } = await supabase
      .from('webinar_series')
      .select(`
        *,
        webinars(id, name, status, instant_watch_enabled, just_in_time_enabled)
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) return reply.code(404).send({ error: 'Series not found' })
    return data
  })

  // ── Create a series ────────────────────────────────────────────────────────
  app.post('/', auth, async (req, reply) => {
    const userId = req.user.sub
    const { name, sharing_enabled = false, shared_by_name, sharing_url } = req.body

    if (!name) return reply.code(400).send({ error: 'name is required' })

    const { data, error } = await supabase
      .from('webinar_series')
      .insert({ user_id: userId, name, sharing_enabled, shared_by_name, sharing_url })
      .select()
      .single()

    if (error) return reply.code(500).send({ error: error.message })
    return reply.code(201).send(data)
  })

  // ── Update a series ────────────────────────────────────────────────────────
  app.patch('/:id', auth, async (req, reply) => {
    const userId = req.user.sub
    const { id } = req.params
    const { name, sharing_enabled, shared_by_name, sharing_url, status } = req.body

    const updates = {}
    if (name !== undefined)            updates.name = name
    if (sharing_enabled !== undefined) updates.sharing_enabled = sharing_enabled
    if (shared_by_name !== undefined)  updates.shared_by_name = shared_by_name
    if (sharing_url !== undefined)     updates.sharing_url = sharing_url
    if (status !== undefined)          updates.status = status

    const { data, error } = await supabase
      .from('webinar_series')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) return reply.code(500).send({ error: error.message })
    return data
  })

  // ── Delete a series ────────────────────────────────────────────────────────
  app.delete('/:id', auth, async (req, reply) => {
    const userId = req.user.sub
    const { id } = req.params

    const { error } = await supabase
      .from('webinar_series')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) return reply.code(500).send({ error: error.message })
    return reply.code(204).send()
  })

  // ── Clone a series (deep copy: series + webinars + schedules) ─────────────
  app.post('/:id/clone', auth, async (req, reply) => {
    const userId = req.user.sub
    const { id } = req.params

    // Fetch original series with webinars and schedules
    const { data: original, error: fetchErr } = await supabase
      .from('webinar_series')
      .select(`
        *,
        webinars(
          *,
          webinar_schedules(*),
          webinar_blockout_dates(*),
          email_notifications(*)
        )
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (fetchErr) return reply.code(404).send({ error: 'Series not found' })

    // Insert cloned series
    const { data: newSeries, error: seriesErr } = await supabase
      .from('webinar_series')
      .insert({
        user_id: userId,
        name: `${original.name} (copy)`,
        sharing_enabled: false,
      })
      .select()
      .single()

    if (seriesErr) return reply.code(500).send({ error: seriesErr.message })

    // Clone each webinar and its children
    for (const webinar of original.webinars ?? []) {
      const { webinar_schedules, webinar_blockout_dates, email_notifications, id: _wid, series_id: _sid, created_at: _ca, updated_at: _ua, ...webinarFields } = webinar

      const { data: newWebinar, error: wErr } = await supabase
        .from('webinars')
        .insert({ ...webinarFields, series_id: newSeries.id, user_id: userId })
        .select()
        .single()

      if (wErr) return reply.code(500).send({ error: wErr.message })

      if (webinar_schedules?.length) {
        await supabase.from('webinar_schedules').insert(
          webinar_schedules.map(({ id: _id, webinar_id: _wid2, created_at: _ca2, ...s }) => ({
            ...s,
            webinar_id: newWebinar.id,
          }))
        )
      }

      if (webinar_blockout_dates?.length) {
        await supabase.from('webinar_blockout_dates').insert(
          webinar_blockout_dates.map(({ id: _id, webinar_id: _wid2, created_at: _ca2, ...b }) => ({
            ...b,
            webinar_id: newWebinar.id,
          }))
        )
      }

      if (email_notifications?.length) {
        await supabase.from('email_notifications').insert(
          email_notifications.map(({ id: _id, webinar_id: _wid2, created_at: _ca2, updated_at: _ua2, ...n }) => ({
            ...n,
            webinar_id: newWebinar.id,
          }))
        )
      }
    }

    return reply.code(201).send(newSeries)
  })
}
