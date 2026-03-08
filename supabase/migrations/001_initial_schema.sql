-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- WEBINARS
-- The core replay webinar definition (video, host info, etc.)
-- ============================================================
create table if not exists webinars (
  id              uuid primary key default uuid_generate_v4(),
  title           text not null,
  description     text,
  video_url       text not null,           -- URL to the replay video
  host_name       text not null,
  host_email      text not null,
  host_bio        text,
  cover_image_url text,
  status          text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- WEBINAR SCHEDULES
-- Defines when a webinar airs (one-time or weekly recurrence)
-- ============================================================
create table if not exists webinar_schedules (
  id                   uuid primary key default uuid_generate_v4(),
  webinar_id           uuid not null references webinars(id) on delete cascade,
  timezone             text not null default 'UTC',  -- IANA timezone, e.g. 'America/New_York'
  start_datetime       timestamptz not null,          -- First (or only) occurrence
  duration_minutes     int not null default 60,
  recurrence_type      text not null default 'once' check (recurrence_type in ('once', 'weekly')),
  -- For weekly: array of ISO weekday numbers 0=Sun,1=Mon,...,6=Sat
  -- E.g. [1,3] = every Monday and Wednesday
  recurrence_days      int[] default null,
  recurrence_end_date  date default null,             -- NULL = recur indefinitely
  is_active            boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- ============================================================
-- WEBINAR SESSIONS
-- Individual instances of a scheduled webinar
-- Auto-generated from the schedule via the session generator job
-- ============================================================
create table if not exists webinar_sessions (
  id           uuid primary key default uuid_generate_v4(),
  webinar_id   uuid not null references webinars(id) on delete cascade,
  schedule_id  uuid not null references webinar_schedules(id) on delete cascade,
  scheduled_at timestamptz not null,        -- Exact start time of this session
  ends_at      timestamptz not null,        -- scheduled_at + duration_minutes
  status       text not null default 'upcoming' check (status in ('upcoming', 'live', 'ended', 'cancelled')),
  created_at   timestamptz not null default now(),
  -- Prevent duplicate sessions for the same schedule+time
  unique (schedule_id, scheduled_at)
);

-- ============================================================
-- REGISTRANTS
-- People who sign up for a specific session
-- ============================================================
create table if not exists registrants (
  id                   uuid primary key default uuid_generate_v4(),
  webinar_id           uuid not null references webinars(id) on delete cascade,
  session_id           uuid not null references webinar_sessions(id) on delete cascade,
  first_name           text not null,
  last_name            text not null,
  email                text not null,
  phone                text,
  -- Reminder tracking
  reminder_sent_24h    boolean not null default false,
  reminder_sent_1h     boolean not null default false,
  -- Watch link token (unique per registrant)
  watch_token          uuid not null default uuid_generate_v4(),
  registered_at        timestamptz not null default now(),
  created_at           timestamptz not null default now(),
  -- One registration per email per session
  unique (session_id, email)
);

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_webinar_schedules_webinar_id on webinar_schedules(webinar_id);
create index idx_webinar_sessions_webinar_id  on webinar_sessions(webinar_id);
create index idx_webinar_sessions_schedule_id on webinar_sessions(schedule_id);
create index idx_webinar_sessions_scheduled_at on webinar_sessions(scheduled_at);
create index idx_registrants_session_id       on registrants(session_id);
create index idx_registrants_email            on registrants(email);
create index idx_registrants_watch_token      on registrants(watch_token);

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger webinars_updated_at
  before update on webinars
  for each row execute function update_updated_at();

create trigger webinar_schedules_updated_at
  before update on webinar_schedules
  for each row execute function update_updated_at();

-- ============================================================
-- ENABLE ROW LEVEL SECURITY (optional, disable for service-role API)
-- ============================================================
alter table webinars          enable row level security;
alter table webinar_schedules enable row level security;
alter table webinar_sessions  enable row level security;
alter table registrants       enable row level security;

-- Allow full access via service role key (used by the backend)
create policy "service_role_all_webinars"          on webinars          for all using (true);
create policy "service_role_all_schedules"         on webinar_schedules for all using (true);
create policy "service_role_all_sessions"          on webinar_sessions  for all using (true);
create policy "service_role_all_registrants"       on registrants       for all using (true);
