import { addDays, addMinutes, isAfter, isBefore, parseISO, startOfDay, getDay } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { supabase } from '../config/supabase';
import type {
  WebinarSchedule,
  WebinarSession,
  CreateScheduleBody,
  UpdateScheduleBody,
  Weekday,
} from '../types';

export const scheduleService = {
  // ----------------------------------------------------------------
  // CRUD
  // ----------------------------------------------------------------

  async listForWebinar(webinarId: string): Promise<WebinarSchedule[]> {
    const { data, error } = await supabase
      .from('webinar_schedules')
      .select('*')
      .eq('webinar_id', webinarId)
      .order('start_datetime', { ascending: true });
    if (error) throw new Error(error.message);
    return data as WebinarSchedule[];
  },

  async getById(id: string): Promise<WebinarSchedule | null> {
    const { data, error } = await supabase
      .from('webinar_schedules')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code === 'PGRST116') return null;
    if (error) throw new Error(error.message);
    return data as WebinarSchedule;
  },

  async create(webinarId: string, body: CreateScheduleBody): Promise<WebinarSchedule> {
    if (body.recurrence_type === 'weekly' && (!body.recurrence_days || body.recurrence_days.length === 0)) {
      throw new Error('recurrence_days is required for weekly schedules');
    }

    const { data, error } = await supabase
      .from('webinar_schedules')
      .insert({
        webinar_id: webinarId,
        timezone: body.timezone,
        start_datetime: body.start_datetime,
        duration_minutes: body.duration_minutes ?? 60,
        recurrence_type: body.recurrence_type,
        recurrence_days: body.recurrence_days ?? null,
        recurrence_end_date: body.recurrence_end_date ?? null,
        is_active: true,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as WebinarSchedule;
  },

  async update(id: string, body: UpdateScheduleBody): Promise<WebinarSchedule | null> {
    const { data, error } = await supabase
      .from('webinar_schedules')
      .update(body)
      .eq('id', id)
      .select()
      .single();
    if (error && error.code === 'PGRST116') return null;
    if (error) throw new Error(error.message);
    return data as WebinarSchedule;
  },

  async delete(id: string): Promise<boolean> {
    const { error, count } = await supabase
      .from('webinar_schedules')
      .delete({ count: 'exact' })
      .eq('id', id);
    if (error) throw new Error(error.message);
    return (count ?? 0) > 0;
  },

  // ----------------------------------------------------------------
  // SESSION GENERATION
  // Expands a schedule into concrete WebinarSession rows.
  // For 'once': generates exactly 1 session at start_datetime.
  // For 'weekly': generates sessions day-by-day up to `horizon` days
  //               into the future from now, respecting recurrence_days
  //               and recurrence_end_date.
  // ----------------------------------------------------------------

  async generateSessions(scheduleId: string, horizonDays = 90): Promise<WebinarSession[]> {
    const schedule = await this.getById(scheduleId);
    if (!schedule) throw new Error('Schedule not found');
    if (!schedule.is_active) throw new Error('Schedule is not active');

    const sessions = this.computeOccurrences(schedule, horizonDays);

    if (sessions.length === 0) return [];

    // Upsert — skip duplicates (unique constraint on schedule_id + scheduled_at)
    const { data, error } = await supabase
      .from('webinar_sessions')
      .upsert(sessions, { onConflict: 'schedule_id,scheduled_at', ignoreDuplicates: true })
      .select();
    if (error) throw new Error(error.message);
    return (data ?? []) as WebinarSession[];
  },

  // Returns upcoming sessions for a webinar (status = 'upcoming')
  async listUpcomingSessions(webinarId: string): Promise<WebinarSession[]> {
    const { data, error } = await supabase
      .from('webinar_sessions')
      .select('*')
      .eq('webinar_id', webinarId)
      .eq('status', 'upcoming')
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true });
    if (error) throw new Error(error.message);
    return data as WebinarSession[];
  },

  // Returns the next upcoming session for a webinar
  async nextSession(webinarId: string): Promise<WebinarSession | null> {
    const { data, error } = await supabase
      .from('webinar_sessions')
      .select('*')
      .eq('webinar_id', webinarId)
      .eq('status', 'upcoming')
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(1)
      .single();
    if (error && error.code === 'PGRST116') return null;
    if (error) throw new Error(error.message);
    return data as WebinarSession;
  },

  // ----------------------------------------------------------------
  // INTERNAL: compute occurrence timestamps from a schedule
  // ----------------------------------------------------------------

  computeOccurrences(
    schedule: WebinarSchedule,
    horizonDays: number,
  ): Array<{
    webinar_id: string;
    schedule_id: string;
    scheduled_at: string;
    ends_at: string;
    status: string;
  }> {
    const tz = schedule.timezone;
    const durationMs = schedule.duration_minutes * 60 * 1000;
    const now = new Date();
    const horizon = addDays(now, horizonDays);

    const result: Array<{
      webinar_id: string;
      schedule_id: string;
      scheduled_at: string;
      ends_at: string;
      status: string;
    }> = [];

    if (schedule.recurrence_type === 'once') {
      const occurrence = parseISO(schedule.start_datetime);
      // Only include if it's in the future
      if (isAfter(occurrence, now)) {
        result.push(this.makeSessionRow(schedule, occurrence, durationMs));
      }
      return result;
    }

    // Weekly recurrence
    const recurrenceDays: Weekday[] = schedule.recurrence_days ?? [];
    if (recurrenceDays.length === 0) return result;

    // Use the time-of-day from start_datetime, expressed in the schedule's timezone
    const startInTz = toZonedTime(parseISO(schedule.start_datetime), tz);
    const timeHours = startInTz.getHours();
    const timeMinutes = startInTz.getMinutes();
    const timeSeconds = startInTz.getSeconds();

    // Determine search window: from max(now, schedule.start_datetime) to min(horizon, end_date)
    const searchFrom = isBefore(parseISO(schedule.start_datetime), now)
      ? now
      : parseISO(schedule.start_datetime);

    const endBound: Date = (() => {
      if (!schedule.recurrence_end_date) return horizon;
      const endDate = parseISO(schedule.recurrence_end_date);
      return isBefore(endDate, horizon) ? endDate : horizon;
    })();

    // Walk day-by-day from searchFrom to endBound
    let cursor = startOfDay(searchFrom);
    while (isBefore(cursor, endBound)) {
      const weekday = getDay(cursor) as Weekday; // 0=Sun...6=Sat

      if (recurrenceDays.includes(weekday)) {
        // Build occurrence at the correct local time in the schedule's timezone
        const localOccurrence = new Date(cursor);
        localOccurrence.setHours(timeHours, timeMinutes, timeSeconds, 0);

        // Convert the local time back to UTC
        const utcOccurrence = fromZonedTime(localOccurrence, tz);

        if (isAfter(utcOccurrence, now) && isBefore(utcOccurrence, endBound)) {
          result.push(this.makeSessionRow(schedule, utcOccurrence, durationMs));
        }
      }

      cursor = addDays(cursor, 1);
    }

    return result;
  },

  makeSessionRow(
    schedule: WebinarSchedule,
    scheduledAt: Date,
    durationMs: number,
  ) {
    return {
      webinar_id: schedule.webinar_id,
      schedule_id: schedule.id,
      scheduled_at: scheduledAt.toISOString(),
      ends_at: addMinutes(scheduledAt, schedule.duration_minutes).toISOString(),
      status: 'upcoming',
    };
  },
};
