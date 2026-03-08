/**
 * Session Generator Job
 * Runs daily at midnight. For all active weekly schedules, generates
 * sessions for the next 90 days so there's always a rolling window
 * of upcoming sessions available for registration.
 */
import { supabase } from '../config/supabase';
import { scheduleService } from '../services/scheduleService';
import type { WebinarSchedule } from '../types';

export async function runSessionGeneratorJob(): Promise<void> {
  console.log('[SessionGeneratorJob] Running at', new Date().toISOString());

  // Fetch all active weekly schedules
  const { data: schedules, error } = await supabase
    .from('webinar_schedules')
    .select('*')
    .eq('is_active', true)
    .eq('recurrence_type', 'weekly');

  if (error) {
    console.error('[SessionGeneratorJob] Failed to fetch schedules:', error.message);
    return;
  }

  console.log(`[SessionGeneratorJob] Processing ${schedules?.length ?? 0} active weekly schedules`);

  for (const schedule of (schedules ?? []) as WebinarSchedule[]) {
    try {
      const sessions = await scheduleService.generateSessions(schedule.id, 90);
      console.log(
        `[SessionGeneratorJob] Schedule ${schedule.id}: generated/upserted ${sessions.length} sessions`,
      );
    } catch (err) {
      console.error(`[SessionGeneratorJob] Error for schedule ${schedule.id}:`, err);
    }
  }

  // Mark sessions that have passed as 'ended'
  const { error: updateError } = await supabase
    .from('webinar_sessions')
    .update({ status: 'ended' })
    .eq('status', 'upcoming')
    .lt('ends_at', new Date().toISOString());

  if (updateError) {
    console.error('[SessionGeneratorJob] Failed to mark ended sessions:', updateError.message);
  }
}
