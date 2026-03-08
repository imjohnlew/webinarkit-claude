/**
 * Reminder Sender Job
 * Runs every 15 minutes. Finds registrants due for 24h or 1h reminders
 * and sends them emails. Marks reminders as sent to prevent duplicates.
 */
import { supabase } from '../config/supabase';
import { registrantService } from '../services/registrantService';
import { emailService } from '../services/emailService';
import type { Webinar, WebinarSession } from '../types';

async function getWebinarAndSession(
  webinarId: string,
  sessionId: string,
): Promise<{ webinar: Webinar; session: WebinarSession } | null> {
  const [{ data: webinar }, { data: session }] = await Promise.all([
    supabase.from('webinars').select('*').eq('id', webinarId).single(),
    supabase.from('webinar_sessions').select('*').eq('id', sessionId).single(),
  ]);
  if (!webinar || !session) return null;
  return { webinar: webinar as Webinar, session: session as WebinarSession };
}

export async function runReminderJob(): Promise<void> {
  console.log('[ReminderJob] Running at', new Date().toISOString());

  // --- 24h reminders ---
  try {
    const due24h = await registrantService.getDueFor24hReminder();
    console.log(`[ReminderJob] Found ${due24h.length} registrants due for 24h reminder`);

    for (const registrant of due24h) {
      const ctx = await getWebinarAndSession(registrant.webinar_id, registrant.session_id);
      if (!ctx) continue;

      try {
        await emailService.sendReminder(registrant, ctx.webinar, ctx.session, '24h');
        await registrantService.markReminderSent(registrant.id, '24h');
        console.log(`[ReminderJob] 24h reminder sent to ${registrant.email}`);
      } catch (err) {
        console.error(`[ReminderJob] Failed to send 24h reminder to ${registrant.email}:`, err);
      }
    }
  } catch (err) {
    console.error('[ReminderJob] Error in 24h reminder batch:', err);
  }

  // --- 1h reminders ---
  try {
    const due1h = await registrantService.getDueFor1hReminder();
    console.log(`[ReminderJob] Found ${due1h.length} registrants due for 1h reminder`);

    for (const registrant of due1h) {
      const ctx = await getWebinarAndSession(registrant.webinar_id, registrant.session_id);
      if (!ctx) continue;

      try {
        await emailService.sendReminder(registrant, ctx.webinar, ctx.session, '1h');
        await registrantService.markReminderSent(registrant.id, '1h');
        console.log(`[ReminderJob] 1h reminder sent to ${registrant.email}`);
      } catch (err) {
        console.error(`[ReminderJob] Failed to send 1h reminder to ${registrant.email}:`, err);
      }
    }
  } catch (err) {
    console.error('[ReminderJob] Error in 1h reminder batch:', err);
  }
}
