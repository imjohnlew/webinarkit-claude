import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from './supabase'

// ── Module-level channel cache for one-shot broadcasting ─────────────────────
// AdminInbox uses this to broadcast admin replies without maintaining a full
// Presence subscription. Channels are created lazily and reused.
const _broadcastChannels = {}

async function _getOrCreateChannel(topic) {
  const existing = _broadcastChannels[topic]
  if (existing?.state === 'joined') return existing

  if (!supabase) return null

  return new Promise((resolve) => {
    const ch = supabase.channel(topic, {
      config: { broadcast: { ack: false } },
    })
    ch.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        _broadcastChannels[topic] = ch
        resolve(ch)
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        delete _broadcastChannels[topic]
        resolve(null)
      }
    })
  })
}

/**
 * sendAdminReply — broadcast an admin reply to all attendees of a webinar.
 *
 * Called by AdminInbox after storing the reply in mockStore.
 * Fire-and-forget — safe to not await.
 *
 * No-op when Supabase is not configured.
 */
export async function sendAdminReply(webinarId, payload) {
  if (!supabase) return
  try {
    const ch = await _getOrCreateChannel(`webinar:${webinarId}`)
    if (!ch) return
    await ch.send({ type: 'broadcast', event: 'admin_reply', payload })
  } catch (err) {
    // Non-fatal — WatchRoom falls back to polling when Supabase is absent
    console.warn('[watchChannel] sendAdminReply failed:', err)
  }
}

/**
 * useWatchChannel — Supabase Realtime Broadcast + Presence for watch room attendees.
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  Why Broadcast instead of Postgres Changes?                             │
 * │  • Postgres Changes fires a DB query per subscriber on every event      │
 * │  • With 2 000 attendees that's 2 000 simultaneous queries per message   │
 * │  • Broadcast bypasses the DB entirely — server fans-out a single event  │
 * │    to all subscribers over existing WebSocket connections                │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * Falls back gracefully (presenceCount = null, broadcastInboxMessage = no-op)
 * when VITE_SUPABASE_URL is not configured — existing mock polling continues.
 *
 * @param {string} webinarId
 * @param {object} opts
 *   presenceName  {string}    Display name tracked in Presence (attendee count)
 *   onAdminReply  {Function}  Called when admin broadcasts a reply
 */
export function useWatchChannel(webinarId, {
  presenceName = 'Attendee',
  onAdminReply  = null,
} = {}) {
  const [presenceCount, setPresenceCount] = useState(null)
  const channelRef      = useRef(null)
  const onAdminReplyRef = useRef(onAdminReply)

  // Keep callback ref fresh without triggering re-subscription
  useEffect(() => { onAdminReplyRef.current = onAdminReply }, [onAdminReply])

  useEffect(() => {
    if (!supabase || !webinarId) return

    const ch = supabase.channel(`webinar:${webinarId}`, {
      config: {
        broadcast: { self: false },      // don't echo our own broadcasts back
        presence:  { key: 'attendees' }, // all attendees share one Presence key
      },
    })

    // ── Presence → real attendee count ──────────────────────────────────────
    // Supabase aggregates all presenceState in-memory (no DB writes).
    // Each connected client appears as one entry.
    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState()
      let n = 0
      for (const k in state) n += state[k].length
      setPresenceCount(n)
    })

    // ── Broadcast: admin reply → attendee ───────────────────────────────────
    ch.on('broadcast', { event: 'admin_reply' }, ({ payload }) => {
      onAdminReplyRef.current?.(payload)
    })

    ch.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Track self in Presence so admin can see live attendee count
        await ch.track({ name: presenceName, joined_at: Date.now() })
      }
    })

    channelRef.current = ch

    return () => {
      supabase.removeChannel(ch)
      channelRef.current = null
    }
  }, [webinarId, presenceName]) // presenceName is stable (string literal from caller)

  // Broadcast this attendee's chat message to admin inbox channel
  // (admin receives via broadcast instead of DB polling)
  const broadcastInboxMessage = useCallback(async (payload) => {
    if (!channelRef.current) return
    try {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'inbox_message',
        payload,
      })
    } catch (err) {
      console.warn('[watchChannel] broadcastInboxMessage failed:', err)
    }
  }, [])

  return { presenceCount, broadcastInboxMessage }
}
