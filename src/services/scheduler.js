import { DateTime } from 'luxon'

/**
 * Day-name → ISO weekday number (1=Mon … 7=Sun)
 */
const DAY_MAP = {
  Monday:    1,
  Tuesday:   2,
  Wednesday: 3,
  Thursday:  4,
  Friday:    5,
  Saturday:  6,
  Sunday:    7,
}

/**
 * Parse a schedule's time + period into { hour, minute }.
 *
 * @param {string} time   e.g. "8:00", "12:30"
 * @param {string} period "AM" | "PM"
 */
function parseTime(time, period) {
  const [rawHour, minute] = time.split(':').map(Number)
  let hour = rawHour

  if (period === 'AM') {
    if (hour === 12) hour = 0          // 12:xx AM → 0:xx
  } else {
    if (hour !== 12) hour = hour + 12  // 1–11 PM → 13–23
  }

  return { hour, minute }
}

/**
 * Build a Luxon DateTime for a given date + schedule time in its timezone.
 *
 * @param {DateTime} date      Any Luxon DateTime (time ignored)
 * @param {object}   schedule
 * @param {string}   tz        IANA timezone
 */
function buildSessionStart(date, schedule, tz) {
  const { hour, minute } = parseTime(schedule.time, schedule.period)
  return date.setZone(tz).set({ hour, minute, second: 0, millisecond: 0 })
}

/**
 * Returns the next N upcoming session starts for a single schedule rule,
 * starting from `from` (default: now), respecting blockout dates.
 *
 * @param {object}   schedule          Row from webinar_schedules
 * @param {Set}      blockoutSet       Set of 'YYYY-MM-DD' strings
 * @param {DateTime} from              Lower bound (exclusive)
 * @param {number}   limit             Max results
 * @returns {DateTime[]}
 */
function nextSessionsForSchedule(schedule, blockoutSet, from, limit) {
  const tz = schedule.timezone || 'UTC'
  const sessions = []

  if (schedule.type === 'On') {
    // ── Specific one-time date ───────────────────────────────────────────────
    const dt = buildSessionStart(
      DateTime.fromISO(schedule.day, { zone: tz }),
      schedule,
      tz
    )
    if (dt > from && !blockoutSet.has(dt.toISODate())) {
      sessions.push(dt)
    }
    return sessions
  }

  // ── Ongoing / recurring ──────────────────────────────────────────────────
  const isEveryDay = schedule.day === 'Day'
  const targetWeekday = isEveryDay ? null : DAY_MAP[schedule.day]

  let cursor = from.setZone(tz).plus({ minutes: 1 })

  // Walk forward day by day until we have enough sessions
  // Max walk: 2 years to avoid infinite loops
  const maxDate = from.plus({ years: 2 })

  while (sessions.length < limit && cursor < maxDate) {
    const matchesDay = isEveryDay || cursor.weekday === targetWeekday

    if (matchesDay) {
      const dt = buildSessionStart(cursor, schedule, tz)

      if (dt > from && !blockoutSet.has(dt.toISODate())) {
        sessions.push(dt)
      }
    }

    // Advance by 1 day
    cursor = cursor.plus({ days: 1 }).startOf('day')
  }

  return sessions
}

/**
 * Generate upcoming sessions for a webinar.
 *
 * Merges all schedule rules, deduplicates by start time, sorts ascending.
 *
 * @param {object} webinar   Webinar row with webinar_schedules[] and webinar_blockout_dates[]
 * @param {object} opts
 * @param {number} opts.limit      Max sessions to return (default 10)
 * @param {Date}   opts.from       Lower bound (default now)
 * @returns {{ schedule_id, start, end, timezone }[]}
 */
export function generateSessions(webinar, { limit = 10, from } = {}) {
  const schedules = webinar.webinar_schedules ?? []
  const blockouts  = webinar.webinar_blockout_dates ?? []

  const blockoutSet = new Set(blockouts.map(b =>
    typeof b.blockout_date === 'string' ? b.blockout_date : DateTime.fromJSDate(b.blockout_date).toISODate()
  ))

  const fromDt = from
    ? DateTime.fromJSDate(from instanceof Date ? from : new Date(from))
    : DateTime.now()

  // Duration of the webinar in minutes
  const durationMs =
    ((webinar.duration_hours ?? 0) * 3600 +
     (webinar.duration_minutes ?? 0) * 60 +
     (webinar.duration_seconds ?? 0)) * 1000

  const allSessions = []

  for (const schedule of schedules) {
    // sessions_to_show controls how many upcoming slots this schedule contributes
    const perScheduleLimit = schedule.sessions_to_show ?? 1

    const starts = nextSessionsForSchedule(schedule, blockoutSet, fromDt, perScheduleLimit)

    for (const start of starts) {
      allSessions.push({
        schedule_id: schedule.id,
        start:       start.toISO(),
        end:         start.plus(durationMs).toISO(),
        timezone:    schedule.timezone,
      })
    }
  }

  // Sort by start time, deduplicate by start, return top `limit`
  const seen = new Set()
  return allSessions
    .sort((a, b) => (a.start > b.start ? 1 : -1))
    .filter(s => {
      if (seen.has(s.start)) return false
      seen.add(s.start)
      return true
    })
    .slice(0, limit)
}

/**
 * Generate the "instant watch" session — a session that starts at the
 * current moment (or optionally X minutes in the future for JIT).
 *
 * @param {object} webinar
 * @param {number} offsetMinutes  Minutes added to now (0 = instant, >0 = JIT)
 */
export function generateInstantSession(webinar, offsetMinutes = 0) {
  const start = DateTime.now().plus({ minutes: offsetMinutes })
  const durationMs =
    ((webinar.duration_hours ?? 0) * 3600 +
     (webinar.duration_minutes ?? 0) * 60 +
     (webinar.duration_seconds ?? 0)) * 1000

  return {
    schedule_id: null,
    start: start.toISO(),
    end:   start.plus(durationMs).toISO(),
    timezone: 'UTC',
  }
}
