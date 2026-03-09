import { createClient } from '@supabase/supabase-js'

/**
 * Supabase service-role client for backend use.
 *
 * The JS SDK communicates with Supabase through PostgREST (REST API) and
 * Realtime WebSockets — NOT a direct PostgreSQL connection — so Supavisor's
 * Transaction Pooler is NOT required here.
 *
 * Supavisor (port 6543) IS relevant if you add direct Postgres access via
 * `pg` or `postgres.js`. In that case set DATABASE_URL to the pooler URL:
 *   postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
 *
 * For Realtime at scale (2 000 + concurrent attendees), use:
 *   • Broadcast  — fan-out messages (bypasses DB, no RLS cost per subscriber)
 *   • Presence   — track online users in-memory (no DB writes)
 * See: frontend/src/lib/watchChannel.js
 */
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

export default supabase
