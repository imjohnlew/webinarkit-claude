-- WebinarKit Clone - Initial Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────
-- WEBINAR SERIES
-- A series is a named container for one or more webinars.
-- ─────────────────────────────────────────
CREATE TABLE webinar_series (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL,
  name              TEXT NOT NULL,
  sharing_enabled   BOOLEAN NOT NULL DEFAULT false,
  shared_by_name    TEXT,
  sharing_url       TEXT,
  status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────
-- WEBINARS
-- An individual automated/replay webinar inside a series.
-- ─────────────────────────────────────────
CREATE TABLE webinars (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id             UUID NOT NULL REFERENCES webinar_series(id) ON DELETE CASCADE,
  user_id               UUID NOT NULL,
  name                  TEXT NOT NULL,
  title                 TEXT,
  duration_hours        INT NOT NULL DEFAULT 0,
  duration_minutes      INT NOT NULL DEFAULT 0,
  duration_seconds      INT NOT NULL DEFAULT 0,
  attendee_sign_in      BOOLEAN NOT NULL DEFAULT true,
  password              TEXT,
  domain                TEXT,
  brand_image_url       TEXT,
  date_format           TEXT NOT NULL DEFAULT 'en-US',
  instant_watch_enabled BOOLEAN NOT NULL DEFAULT true,
  just_in_time_enabled  BOOLEAN NOT NULL DEFAULT false,
  -- just-in-time: show session starting in X minutes from registration
  just_in_time_minutes  INT DEFAULT 15,
  status                TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────
-- WEBINAR SCHEDULES
-- Defines when a webinar runs — recurring (Every) or one-time (On).
--
-- type = 'Every' (ongoing/recurring):
--   day = 'Day' | 'Monday' | 'Tuesday' | ... | 'Sunday'
--
-- type = 'On' (specific date):
--   day = ISO date string e.g. '2025-03-15'
-- ─────────────────────────────────────────
CREATE TABLE webinar_schedules (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webinar_id       UUID NOT NULL REFERENCES webinars(id) ON DELETE CASCADE,
  type             TEXT NOT NULL CHECK (type IN ('Every', 'On')),
  day              TEXT NOT NULL,  -- 'Day','Monday'...'Sunday' or YYYY-MM-DD
  time             TEXT NOT NULL,  -- '8:00', '12:30', etc.
  period           TEXT NOT NULL CHECK (period IN ('AM', 'PM')),
  timezone         TEXT NOT NULL DEFAULT 'UTC',
  sessions_to_show INT NOT NULL DEFAULT 1,  -- how many upcoming slots to surface
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────
-- WEBINAR BLOCKOUT DATES
-- Days when no sessions should be shown/generated.
-- ─────────────────────────────────────────
CREATE TABLE webinar_blockout_dates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webinar_id    UUID NOT NULL REFERENCES webinars(id) ON DELETE CASCADE,
  blockout_date DATE NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (webinar_id, blockout_date)
);

-- ─────────────────────────────────────────
-- WEBINAR SESSIONS
-- Pre-computed upcoming session slots derived from schedules.
-- Regenerated on schedule changes.
-- ─────────────────────────────────────────
CREATE TABLE webinar_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webinar_id    UUID NOT NULL REFERENCES webinars(id) ON DELETE CASCADE,
  schedule_id   UUID REFERENCES webinar_schedules(id) ON DELETE SET NULL,
  session_start TIMESTAMPTZ NOT NULL,
  session_end   TIMESTAMPTZ NOT NULL,
  status        TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (webinar_id, session_start)
);

-- ─────────────────────────────────────────
-- REGISTRATIONS
-- An attendee registration for a specific webinar session.
-- ─────────────────────────────────────────
CREATE TABLE registrations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webinar_id       UUID NOT NULL REFERENCES webinars(id) ON DELETE CASCADE,
  session_id       UUID REFERENCES webinar_sessions(id) ON DELETE SET NULL,
  email            TEXT NOT NULL,
  first_name       TEXT,
  last_name        TEXT,
  watch_token      TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  registered_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  attended         BOOLEAN NOT NULL DEFAULT false,
  watch_percentage INT NOT NULL DEFAULT 0 CHECK (watch_percentage BETWEEN 0 AND 100),
  UNIQUE (webinar_id, session_id, email)
);

-- ─────────────────────────────────────────
-- EMAIL NOTIFICATIONS
-- Per-webinar email templates and enabled flags.
-- ─────────────────────────────────────────
CREATE TYPE email_notification_type AS ENUM (
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
  'did_not_click_replay_button'
);

CREATE TABLE email_notifications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webinar_id        UUID NOT NULL REFERENCES webinars(id) ON DELETE CASCADE,
  notification_type email_notification_type NOT NULL,
  enabled           BOOLEAN NOT NULL DEFAULT false,
  subject           TEXT,
  body_html         TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (webinar_id, notification_type)
);

-- ─────────────────────────────────────────
-- WEBINAR INTEGRATIONS
-- Per-webinar third-party integration settings.
-- ─────────────────────────────────────────
CREATE TABLE webinar_integrations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webinar_id     UUID NOT NULL REFERENCES webinars(id) ON DELETE CASCADE,
  provider       TEXT NOT NULL,  -- 'google_calendar', 'highlevel', 'webhook'
  config         JSONB NOT NULL DEFAULT '{}',
  enabled        BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (webinar_id, provider)
);

-- ─────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────
CREATE INDEX idx_webinars_series_id        ON webinars(series_id);
CREATE INDEX idx_webinars_user_id          ON webinars(user_id);
CREATE INDEX idx_webinar_schedules_webinar ON webinar_schedules(webinar_id);
CREATE INDEX idx_webinar_sessions_webinar  ON webinar_sessions(webinar_id);
CREATE INDEX idx_webinar_sessions_start    ON webinar_sessions(session_start);
CREATE INDEX idx_registrations_webinar     ON registrations(webinar_id);
CREATE INDEX idx_registrations_session     ON registrations(session_id);
CREATE INDEX idx_registrations_email       ON registrations(email);
CREATE INDEX idx_registrations_token       ON registrations(watch_token);

-- ─────────────────────────────────────────
-- UPDATED_AT TRIGGER
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_webinar_series_updated_at
  BEFORE UPDATE ON webinar_series
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_webinars_updated_at
  BEFORE UPDATE ON webinars
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_email_notifications_updated_at
  BEFORE UPDATE ON email_notifications
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
