// ============================================================
// Domain types matching the Supabase schema
// ============================================================

export type WebinarStatus = 'draft' | 'active' | 'archived';
export type RecurrenceType = 'once' | 'weekly';
export type SessionStatus = 'upcoming' | 'live' | 'ended' | 'cancelled';

// Weekday: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface Webinar {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  host_name: string;
  host_email: string;
  host_bio: string | null;
  cover_image_url: string | null;
  status: WebinarStatus;
  created_at: string;
  updated_at: string;
}

export interface WebinarSchedule {
  id: string;
  webinar_id: string;
  timezone: string;
  start_datetime: string;
  duration_minutes: number;
  recurrence_type: RecurrenceType;
  recurrence_days: Weekday[] | null;
  recurrence_end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WebinarSession {
  id: string;
  webinar_id: string;
  schedule_id: string;
  scheduled_at: string;
  ends_at: string;
  status: SessionStatus;
  created_at: string;
}

export interface Registrant {
  id: string;
  webinar_id: string;
  session_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  reminder_sent_24h: boolean;
  reminder_sent_1h: boolean;
  watch_token: string;
  registered_at: string;
  created_at: string;
}

// ============================================================
// Request body types (validated with Zod in routes)
// ============================================================

export interface CreateWebinarBody {
  title: string;
  description?: string;
  video_url: string;
  host_name: string;
  host_email: string;
  host_bio?: string;
  cover_image_url?: string;
}

export interface UpdateWebinarBody {
  title?: string;
  description?: string;
  video_url?: string;
  host_name?: string;
  host_email?: string;
  host_bio?: string;
  cover_image_url?: string;
  status?: WebinarStatus;
}

export interface CreateScheduleBody {
  timezone: string;
  start_datetime: string;          // ISO 8601
  duration_minutes?: number;
  recurrence_type: RecurrenceType;
  recurrence_days?: Weekday[];     // Required when recurrence_type === 'weekly'
  recurrence_end_date?: string;    // YYYY-MM-DD
}

export interface UpdateScheduleBody {
  timezone?: string;
  start_datetime?: string;
  duration_minutes?: number;
  recurrence_type?: RecurrenceType;
  recurrence_days?: Weekday[];
  recurrence_end_date?: string | null;
  is_active?: boolean;
}

export interface RegisterBody {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  session_id: string;
}
