// ── Mock store — localStorage-backed with seed data ────────────────────────
// Replaces real Supabase/backend calls so the UI works without a live server.

function uuid() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)
}

const now = () => new Date().toISOString()

// ── Seed data ────────────────────────────────────────────────────────────────
const SEED = {
  series: [
    { id: 'series-1', name: 'SaaS Growth Masterclass', user_id: '1', created_at: now(), updated_at: now() },
    { id: 'series-2', name: 'AI for Entrepreneurs',    user_id: '1', created_at: now(), updated_at: now() },
    { id: 'series-3', name: 'Agency Lead Generation',  user_id: '1', created_at: now(), updated_at: now() },
  ],
  webinars: [
    {
      id: 'webinar-1', series_id: 'series-1', user_id: '1',
      name: 'Day 1 – Cold Outreach Secrets',
      duration_minutes: 90, video_url: '', replay_enabled: true,
      is_active: true, instant_watch_enabled: false,
      just_in_time_enabled: false, just_in_time_minutes: 15,
      created_at: now(), updated_at: now(),
    },
    {
      id: 'webinar-2', series_id: 'series-1', user_id: '1',
      name: 'Day 2 – Closing High-Ticket',
      duration_minutes: 60, video_url: '', replay_enabled: true,
      is_active: true, instant_watch_enabled: true,
      just_in_time_enabled: false, just_in_time_minutes: 15,
      created_at: now(), updated_at: now(),
    },
    {
      id: 'webinar-3', series_id: 'series-2', user_id: '1',
      name: 'ChatGPT Automation Workshop',
      duration_minutes: 75, video_url: '', replay_enabled: false,
      is_active: true, instant_watch_enabled: false,
      just_in_time_enabled: true, just_in_time_minutes: 30,
      created_at: now(), updated_at: now(),
    },
    {
      id: 'webinar-4', series_id: 'series-3', user_id: '1',
      name: 'Lead Gen Masterclass',
      duration_minutes: 120, video_url: '', replay_enabled: true,
      is_active: false, instant_watch_enabled: false,
      just_in_time_enabled: false, just_in_time_minutes: 15,
      created_at: now(), updated_at: now(),
    },
  ],
  schedules: [
    {
      id: 'sched-1', webinar_id: 'webinar-1', user_id: '1',
      type: 'Every', day: 'Tuesday', time: '8:00', period: 'PM',
      timezone: 'America/New_York', sessions_to_show: 1,
      created_at: now(),
    },
    {
      id: 'sched-2', webinar_id: 'webinar-1', user_id: '1',
      type: 'Every', day: 'Saturday', time: '10:00', period: 'AM',
      timezone: 'America/New_York', sessions_to_show: 1,
      created_at: now(),
    },
    {
      id: 'sched-3', webinar_id: 'webinar-3', user_id: '1',
      type: 'Every', day: 'Thursday', time: '2:00', period: 'PM',
      timezone: 'America/Los_Angeles', sessions_to_show: 1,
      created_at: now(),
    },
  ],
  blockouts: [],
  notifications: [],
  registrations: [
    { id: 'reg-1', webinar_id: 'webinar-1', attended: true,  watch_percentage: 85,  clicked_offer: true,  viewed_replay: false },
    { id: 'reg-2', webinar_id: 'webinar-1', attended: true,  watch_percentage: 42,  clicked_offer: false, viewed_replay: true  },
    { id: 'reg-3', webinar_id: 'webinar-1', attended: false, watch_percentage: 0,   clicked_offer: false, viewed_replay: false },
    { id: 'reg-4', webinar_id: 'webinar-1', attended: true,  watch_percentage: 100, clicked_offer: true,  viewed_replay: false },
    { id: 'reg-5', webinar_id: 'webinar-2', attended: true,  watch_percentage: 60,  clicked_offer: false, viewed_replay: true  },
  ],
  attendee_ranges: [
    { id: 'ar-1', webinar_id: 'webinar-1', min_count: 120, max_count: 280 },
    { id: 'ar-2', webinar_id: 'webinar-2', min_count:  80, max_count: 160 },
    { id: 'ar-3', webinar_id: 'webinar-3', min_count:  50, max_count: 130 },
    { id: 'ar-4', webinar_id: 'webinar-4', min_count:  30, max_count:  90 },
  ],
  chats: [
    { id: 'cm-1',  webinar_id: 'webinar-1', time_seconds: 8,   name: 'Sarah K.',      message: 'So excited for this! 🎉' },
    { id: 'cm-2',  webinar_id: 'webinar-1', time_seconds: 22,  name: 'Mike Johnson',  message: 'Just joined, can\'t wait!' },
    { id: 'cm-3',  webinar_id: 'webinar-1', time_seconds: 45,  name: 'Jennifer Liu',  message: 'Great intro, love it already' },
    { id: 'cm-4',  webinar_id: 'webinar-1', time_seconds: 70,  name: 'David R.',      message: 'This is exactly what I needed 🙌' },
    { id: 'cm-5',  webinar_id: 'webinar-1', time_seconds: 95,  name: 'Sarah K.',      message: 'Question: does this work for B2B?' },
    { id: 'cm-6',  webinar_id: 'webinar-1', time_seconds: 120, name: 'Carlos M.',     message: 'Watching from São Paulo 🇧🇷' },
    { id: 'cm-7',  webinar_id: 'webinar-1', time_seconds: 150, name: 'Mike Johnson',  message: 'Taking notes like crazy 📝' },
    { id: 'cm-8',  webinar_id: 'webinar-1', time_seconds: 185, name: 'Lisa W.',       message: 'This tip alone is worth it!' },
    { id: 'cm-9',  webinar_id: 'webinar-1', time_seconds: 210, name: 'Jennifer Liu',  message: 'Can you repeat the last part?' },
    { id: 'cm-10', webinar_id: 'webinar-1', time_seconds: 240, name: 'David R.',      message: 'We used this method last month and closed 3 deals 💰' },
    { id: 'cm-11', webinar_id: 'webinar-1', time_seconds: 280, name: 'Tom B.',        message: 'Mind blown 🤯' },
    { id: 'cm-12', webinar_id: 'webinar-1', time_seconds: 320, name: 'Sarah K.',      message: 'This is so actionable, thank you!' },
    { id: 'cm-13', webinar_id: 'webinar-1', time_seconds: 360, name: 'Carlos M.',     message: 'Is there a replay available?' },
    { id: 'cm-14', webinar_id: 'webinar-1', time_seconds: 400, name: 'Lisa W.',       message: '100% recommend this to everyone on my team' },
    { id: 'cm-15', webinar_id: 'webinar-1', time_seconds: 440, name: 'Mike Johnson',  message: 'Where can I get the slides?' },
    { id: 'cm-16', webinar_id: 'webinar-1', time_seconds: 480, name: 'Jennifer Liu',  message: '🔥🔥🔥' },
    { id: 'cm-17', webinar_id: 'webinar-1', time_seconds: 520, name: 'Tom B.',        message: 'Already signed up for the offer!' },
    { id: 'cm-18', webinar_id: 'webinar-1', time_seconds: 560, name: 'David R.',      message: 'Best webinar I\'ve attended this year' },
  ],
}

// ── Local storage helpers ────────────────────────────────────────────────────
const KEY = 'wk_mock_store'

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

function save(store) {
  localStorage.setItem(KEY, JSON.stringify(store))
}

function getStore() {
  const existing = load()
  if (existing) {
    // Migrate: add any new top-level keys from SEED that don't exist yet
    let migrated = false
    for (const key of Object.keys(SEED)) {
      if (!(key in existing)) {
        existing[key] = SEED[key]
        migrated = true
      }
    }
    if (migrated) save(existing)
    return existing
  }
  // First load — seed
  save(SEED)
  return SEED
}

function mutate(fn) {
  const store = getStore()
  fn(store)
  save(store)
  return store
}

// ── API surface ──────────────────────────────────────────────────────────────
const mock = {
  // ── Series ─────────────────────────────────────────────────────────────────
  listSeries() {
    const { series, webinars, schedules } = getStore()
    return series.map(s => ({
      ...s,
      webinars: webinars
        .filter(w => w.series_id === s.id)
        .map(w => ({
          ...w,
          webinar_schedules: schedules.filter(sc => sc.webinar_id === w.id),
        })),
    }))
  },

  createSeries(data) {
    const item = { id: uuid(), user_id: '1', created_at: now(), updated_at: now(), ...data }
    mutate(store => store.series.push(item))
    return { ...item, webinars: [] }
  },

  updateSeries(id, data) {
    let item
    mutate(store => {
      const idx = store.series.findIndex(s => s.id === id)
      if (idx >= 0) { store.series[idx] = { ...store.series[idx], ...data, updated_at: now() }; item = store.series[idx] }
    })
    return item
  },

  deleteSeries(id) {
    mutate(store => {
      store.series = store.series.filter(s => s.id !== id)
      const webinarIds = store.webinars.filter(w => w.series_id === id).map(w => w.id)
      store.webinars = store.webinars.filter(w => w.series_id !== id)
      store.schedules = store.schedules.filter(s => !webinarIds.includes(s.webinar_id))
      store.blockouts = store.blockouts.filter(b => !webinarIds.includes(b.webinar_id))
    })
  },

  cloneSeries(id) {
    const store = getStore()
    const original = store.series.find(s => s.id === id)
    if (!original) return null
    const newSeries = { ...original, id: uuid(), name: `${original.name} (copy)`, created_at: now(), updated_at: now() }
    const webinarMap = {}
    const newWebinars = store.webinars
      .filter(w => w.series_id === id)
      .map(w => { const nid = uuid(); webinarMap[w.id] = nid; return { ...w, id: nid, series_id: newSeries.id, created_at: now(), updated_at: now() } })
    const newSchedules = store.schedules
      .filter(s => s.webinar_id in webinarMap)
      .map(s => ({ ...s, id: uuid(), webinar_id: webinarMap[s.webinar_id], created_at: now() }))
    mutate(s => { s.series.push(newSeries); s.webinars.push(...newWebinars); s.schedules.push(...newSchedules) })
    return newSeries
  },

  // ── Webinars ────────────────────────────────────────────────────────────────
  listWebinars(seriesId) {
    const { webinars, schedules } = getStore()
    const filtered = seriesId ? webinars.filter(w => w.series_id === seriesId) : webinars
    return filtered.map(w => ({ ...w, webinar_schedules: schedules.filter(s => s.webinar_id === w.id) }))
  },

  getWebinar(id) {
    const { webinars, schedules } = getStore()
    const w = webinars.find(w => w.id === id)
    if (!w) return null
    return { ...w, webinar_schedules: schedules.filter(s => s.webinar_id === id) }
  },

  createWebinar(data) {
    const item = {
      duration_minutes: 60, video_url: '', replay_enabled: true,
      is_active: true, instant_watch_enabled: false, just_in_time_enabled: false,
      just_in_time_minutes: 15, user_id: '1', created_at: now(), updated_at: now(),
      ...data, id: uuid(),
    }
    mutate(store => store.webinars.push(item))
    return { ...item, webinar_schedules: [] }
  },

  updateWebinar(id, data) {
    let item
    mutate(store => {
      const idx = store.webinars.findIndex(w => w.id === id)
      if (idx >= 0) { store.webinars[idx] = { ...store.webinars[idx], ...data, updated_at: now() }; item = store.webinars[idx] }
    })
    return item
  },

  deleteWebinar(id) {
    mutate(store => {
      store.webinars = store.webinars.filter(w => w.id !== id)
      store.schedules = store.schedules.filter(s => s.webinar_id !== id)
      store.blockouts = store.blockouts.filter(b => b.webinar_id !== id)
    })
  },

  getUpcoming(webinarId, limit = 5) {
    const { schedules } = getStore()
    const rules = schedules.filter(s => s.webinar_id === webinarId)
    // Generate simple upcoming times for display
    const sessions = []
    const DAY = { Day: null, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 7 }
    const base = new Date()
    rules.forEach(rule => {
      if (rule.type === 'On') {
        const d = new Date(`${rule.day}T${toHH(rule.time, rule.period)}:00`)
        if (d > base) sessions.push({ starts_at: d.toISOString(), schedule_id: rule.id })
      } else {
        const targetDow = DAY[rule.day]
        let d = new Date(base)
        for (let i = 0; i < 60 && sessions.length < limit; i++) {
          d = new Date(d.getTime() + 86400000)
          const dow = d.getDay() === 0 ? 7 : d.getDay()
          if (targetDow === null || dow === targetDow) {
            const [hStr, mStr] = toHH(rule.time, rule.period).split(':')
            d.setHours(parseInt(hStr), parseInt(mStr), 0, 0)
            sessions.push({ starts_at: d.toISOString(), schedule_id: rule.id })
          }
        }
      }
    })
    sessions.sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))
    return sessions.slice(0, limit)
  },

  getAnalytics(webinarId) {
    const { registrations } = getStore()
    const regs = registrations.filter(r => r.webinar_id === webinarId)
    return {
      total_registrations: regs.length,
      attended:      regs.filter(r => r.attended).length,
      clicked_offer: regs.filter(r => r.clicked_offer).length,
      viewed_replay: regs.filter(r => r.viewed_replay).length,
      watched_25:  regs.filter(r => r.watch_percentage >= 25).length,
      watched_50:  regs.filter(r => r.watch_percentage >= 50).length,
      watched_75:  regs.filter(r => r.watch_percentage >= 75).length,
      watched_100: regs.filter(r => r.watch_percentage >= 100).length,
    }
  },

  // ── Schedules ───────────────────────────────────────────────────────────────
  listSchedules(webinarId) {
    return getStore().schedules.filter(s => s.webinar_id === webinarId)
  },

  createSchedule(webinarId, data) {
    const item = { id: uuid(), webinar_id: webinarId, user_id: '1', sessions_to_show: 1, created_at: now(), ...data }
    mutate(store => store.schedules.push(item))
    return item
  },

  updateSchedule(webinarId, scheduleId, data) {
    let item
    mutate(store => {
      const idx = store.schedules.findIndex(s => s.id === scheduleId && s.webinar_id === webinarId)
      if (idx >= 0) { store.schedules[idx] = { ...store.schedules[idx], ...data }; item = store.schedules[idx] }
    })
    return item
  },

  deleteSchedule(webinarId, scheduleId) {
    mutate(store => { store.schedules = store.schedules.filter(s => !(s.id === scheduleId && s.webinar_id === webinarId)) })
  },

  // ── Blockouts ───────────────────────────────────────────────────────────────
  listBlockouts(webinarId) {
    return getStore().blockouts.filter(b => b.webinar_id === webinarId)
  },

  addBlockout(webinarId, date) {
    const item = { id: uuid(), webinar_id: webinarId, date, created_at: now() }
    mutate(store => store.blockouts.push(item))
    return item
  },

  deleteBlockout(webinarId, id) {
    mutate(store => { store.blockouts = store.blockouts.filter(b => !(b.id === id && b.webinar_id === webinarId)) })
  },

  // ── Instant watch / JIT ─────────────────────────────────────────────────────
  setInstantWatch(webinarId, enabled) {
    return mock.updateWebinar(webinarId, { instant_watch_enabled: enabled })
  },

  setJustInTime(webinarId, enabled, minutes) {
    return mock.updateWebinar(webinarId, { just_in_time_enabled: enabled, just_in_time_minutes: minutes })
  },

  // ── Notifications ───────────────────────────────────────────────────────────
  listNotifications(webinarId) {
    return getStore().notifications.filter(n => n.webinar_id === webinarId)
  },

  // ── Attendee range ───────────────────────────────────────────────────────────
  getAttendeeRange(webinarId) {
    const r = (getStore().attendee_ranges || []).find(r => r.webinar_id === webinarId)
    return r || { min_count: 50, max_count: 200 }
  },

  setAttendeeRange(webinarId, min_count, max_count) {
    mutate(store => {
      if (!store.attendee_ranges) store.attendee_ranges = []
      const idx = store.attendee_ranges.findIndex(r => r.webinar_id === webinarId)
      if (idx >= 0) {
        store.attendee_ranges[idx] = { ...store.attendee_ranges[idx], min_count, max_count }
      } else {
        store.attendee_ranges.push({ id: uuid(), webinar_id: webinarId, min_count, max_count })
      }
    })
  },

  // ── Chat messages ────────────────────────────────────────────────────────────
  listChatMessages(webinarId) {
    return getStore().chats
      .filter(c => c.webinar_id === webinarId)
      .sort((a, b) => a.time_seconds - b.time_seconds)
  },

  setChatMessages(webinarId, messages) {
    mutate(store => {
      store.chats = [
        ...store.chats.filter(c => c.webinar_id !== webinarId),
        ...messages.map(m => ({ ...m, webinar_id: webinarId })),
      ]
    })
  },

  upsertNotification(webinarId, type, data) {
    let item
    mutate(store => {
      const idx = store.notifications.findIndex(n => n.webinar_id === webinarId && n.notification_type === type)
      if (idx >= 0) {
        store.notifications[idx] = { ...store.notifications[idx], ...data, webinar_id: webinarId, notification_type: type }
        item = store.notifications[idx]
      } else {
        item = { id: uuid(), webinar_id: webinarId, notification_type: type, created_at: now(), ...data }
        store.notifications.push(item)
      }
    })
    return item
  },
}

function toHH(time, period) {
  const [hRaw, m] = time.split(':')
  let h = parseInt(hRaw)
  if (period === 'AM' && h === 12) h = 0
  if (period === 'PM' && h !== 12) h += 12
  return `${String(h).padStart(2, '0')}:${m || '00'}`
}

export default mock
