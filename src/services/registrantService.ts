import { supabase } from '../config/supabase';
import type { Registrant, RegisterBody } from '../types';

export const registrantService = {
  async register(body: RegisterBody): Promise<Registrant> {
    // Verify session exists and is upcoming
    const { data: session, error: sessionError } = await supabase
      .from('webinar_sessions')
      .select('id, webinar_id, status, scheduled_at')
      .eq('id', body.session_id)
      .single();

    if (sessionError || !session) throw new Error('Session not found');
    if (session.status !== 'upcoming') throw new Error('This session is no longer available for registration');

    // Check for duplicate registration
    const { data: existing } = await supabase
      .from('registrants')
      .select('id')
      .eq('session_id', body.session_id)
      .eq('email', body.email.toLowerCase())
      .single();

    if (existing) throw new Error('This email is already registered for this session');

    const { data, error } = await supabase
      .from('registrants')
      .insert({
        webinar_id: session.webinar_id,
        session_id: body.session_id,
        first_name: body.first_name.trim(),
        last_name: body.last_name.trim(),
        email: body.email.toLowerCase().trim(),
        phone: body.phone ?? null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Registrant;
  },

  async listForWebinar(webinarId: string): Promise<Registrant[]> {
    const { data, error } = await supabase
      .from('registrants')
      .select('*')
      .eq('webinar_id', webinarId)
      .order('registered_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data as Registrant[];
  },

  async listForSession(sessionId: string): Promise<Registrant[]> {
    const { data, error } = await supabase
      .from('registrants')
      .select('*')
      .eq('session_id', sessionId)
      .order('registered_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data as Registrant[];
  },

  async getByWatchToken(token: string): Promise<Registrant | null> {
    const { data, error } = await supabase
      .from('registrants')
      .select('*')
      .eq('watch_token', token)
      .single();
    if (error && error.code === 'PGRST116') return null;
    if (error) throw new Error(error.message);
    return data as Registrant;
  },

  // Find registrants due for 24h or 1h reminders
  async getDueFor24hReminder(): Promise<Registrant[]> {
    const now = new Date();
    const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000); // 23h from now
    const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);   // 25h from now

    const { data, error } = await supabase
      .from('registrants')
      .select('*, webinar_sessions!inner(scheduled_at, status)')
      .eq('reminder_sent_24h', false)
      .eq('webinar_sessions.status', 'upcoming')
      .gte('webinar_sessions.scheduled_at', windowStart.toISOString())
      .lte('webinar_sessions.scheduled_at', windowEnd.toISOString());

    if (error) throw new Error(error.message);
    return (data ?? []) as Registrant[];
  },

  async getDueFor1hReminder(): Promise<Registrant[]> {
    const now = new Date();
    const windowStart = new Date(now.getTime() + 50 * 60 * 1000);  // 50m from now
    const windowEnd = new Date(now.getTime() + 70 * 60 * 1000);    // 70m from now

    const { data, error } = await supabase
      .from('registrants')
      .select('*, webinar_sessions!inner(scheduled_at, status)')
      .eq('reminder_sent_1h', false)
      .eq('webinar_sessions.status', 'upcoming')
      .gte('webinar_sessions.scheduled_at', windowStart.toISOString())
      .lte('webinar_sessions.scheduled_at', windowEnd.toISOString());

    if (error) throw new Error(error.message);
    return (data ?? []) as Registrant[];
  },

  async markReminderSent(id: string, type: '24h' | '1h'): Promise<void> {
    const field = type === '24h' ? 'reminder_sent_24h' : 'reminder_sent_1h';
    const { error } = await supabase
      .from('registrants')
      .update({ [field]: true })
      .eq('id', id);
    if (error) throw new Error(error.message);
  },
};
