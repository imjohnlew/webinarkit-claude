import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Supabase browser client.
 * Returns null when env vars are not set — all callers handle this gracefully
 * so the app works fully with mock data even without Supabase configured.
 */
export const supabase = (url && key)
  ? createClient(url, key, {
      realtime: {
        params: {
          // Throttle to 10 events/sec per client — prevents thundering herd
          // when 2 000 attendees join simultaneously.
          eventsPerSecond: 10,
        },
      },
    })
  : null

export default supabase
