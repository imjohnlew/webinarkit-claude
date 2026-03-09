import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Inbox, Circle, Trash2, Send, Shield, ChevronDown, ExternalLink, X } from 'lucide-react'
import { clsx } from 'clsx'
import mock from '../api/mockStore'
import { sendAdminReply } from '../lib/watchChannel'

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

// ── Reply thread inside a message card ────────────────────────────────────────
function MessageCard({ msg, replies, draft, onDraftChange, onSend, webinarName }) {
  const hasReplies = replies.length > 0

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Attendee message */}
      <div className="px-4 pt-3.5 pb-3">
        <div className="flex items-start gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
            style={{ background: '#334155' }}
          >
            {initials(msg.sender)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[12px] font-semibold text-slate-700">{msg.sender}</span>
              {!msg.read && (
                <span className="text-[9px] font-bold uppercase tracking-wide text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full leading-none">
                  New
                </span>
              )}
              <span className="text-[11px] text-slate-400 ml-auto shrink-0">{fmtTime(msg.sent_at)}</span>
            </div>
            <p className="text-[13px] text-slate-700 leading-snug break-words">{msg.message}</p>
          </div>
        </div>
      </div>

      {/* Existing replies */}
      {hasReplies && (
        <div className="border-t border-slate-100 px-4 py-3 space-y-2.5" style={{ background: 'rgba(14,114,237,0.04)' }}>
          {replies.map(reply => (
            <div key={reply.id} className="flex items-start gap-2.5">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                style={{ background: '#0E72ED' }}
              >
                JY
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-semibold text-[#0E72ED]">You (Host)</span>
                  <span className="text-[10px] text-slate-400 ml-auto shrink-0">{fmtTime(reply.sent_at)}</span>
                </div>
                <p className="text-[12px] text-slate-600 leading-snug break-words">{reply.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply input */}
      <form
        onSubmit={onSend}
        className="flex items-center gap-2 px-4 py-2.5 border-t border-slate-100"
        style={{ background: hasReplies ? 'rgba(14,114,237,0.02)' : 'transparent' }}
      >
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[8px] font-bold shrink-0"
          style={{ background: '#0E72ED' }}
        >
          JY
        </div>
        <input
          type="text"
          value={draft}
          onChange={e => onDraftChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && onSend(e)}
          placeholder={hasReplies ? 'Send another reply…' : 'Reply to attendee…'}
          className="flex-1 text-[13px] text-slate-700 placeholder-slate-300 focus:outline-none bg-transparent"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all disabled:opacity-25 disabled:cursor-not-allowed active:scale-95"
          style={{ background: '#0E72ED', color: 'white' }}
        >
          <Send className="w-3 h-3" /> Reply
        </button>
      </form>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function AdminInbox() {
  const allWebinars     = mock.listWebinars()
  const [filterWebinarId, setFilterWebinarId] = useState('all')
  const [messages,  setMessages]  = useState(() => mock.listInboxMessages())
  const [replies,   setReplies]   = useState(() => mock.listAdminReplies())
  const [drafts,    setDrafts]    = useState({})   // { [inboxMessageId]: string }
  const bottomRef  = useRef(null)
  const prevLenRef = useRef(messages.length)

  // ── Poll every 1.5 s for new messages + replies ──────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      setMessages(mock.listInboxMessages())
      setReplies(mock.listAdminReplies())
    }, 1500)
    return () => clearInterval(id)
  }, [])

  // ── Auto-scroll + mark read on new messages ──────────────────────────────────
  useEffect(() => {
    if (messages.length > prevLenRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    prevLenRef.current = messages.length
    mock.markAllInboxRead()
  }, [messages.length])

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const getWebinarName = (id) => allWebinars.find(w => w.id === id)?.name || id

  const filteredMsgs = filterWebinarId === 'all'
    ? messages
    : messages.filter(m => m.webinar_id === filterWebinarId)

  const getRepliesFor = (msgId) => replies.filter(r => r.inbox_message_id === msgId)

  function handleDraftChange(msgId, val) {
    setDrafts(d => ({ ...d, [msgId]: val }))
  }

  function handleSendReply(e, msgId, webinarId, senderName) {
    e.preventDefault()
    const text = (drafts[msgId] || '').trim()
    if (!text) return
    // Store reply in mockStore (source of truth for polling fallback)
    const reply = mock.pushAdminReply(msgId, webinarId, text, senderName)
    // Also broadcast via Supabase Realtime so attendees receive it instantly
    // (no-op when Supabase is not configured — attendee sees it on next poll)
    sendAdminReply(webinarId, reply)
    setDrafts(d => ({ ...d, [msgId]: '' }))
    setReplies(mock.listAdminReplies())
  }

  function handleClear() {
    mock.clearInboxMessages()
    setMessages([])
  }

  const unread = messages.filter(m => !m.read).length

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{ height: 'calc(100vh - 64px)', background: '#F3F4F6', fontFamily: '"Lato", system-ui, sans-serif' }}
    >
      {/* ── HEADER ────────────────────────────────────────────────────────────── */}
      <div
        className="shrink-0 flex items-center gap-3 px-5"
        style={{ background: '#1A1D24', borderBottom: '1px solid rgba(255,255,255,0.08)', height: '52px' }}
      >
        {/* Brand + live indicator */}
        <Shield className="w-4 h-4 text-[#0E72ED] shrink-0" />
        <span className="text-white/80 text-[13px] font-semibold">Live Admin Inbox</span>
        <div className="flex items-center gap-1.5 ml-0.5">
          <Circle
            className="w-2 h-2 fill-green-400 text-green-400"
            style={{ animation: 'pulse 2s ease-in-out infinite' }}
          />
          <span className="text-[10px] text-green-400/70 font-medium">LIVE</span>
        </div>

        {unread > 0 && (
          <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none min-w-[18px] text-center">
            {unread}
          </span>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Webinar filter */}
        <div className="relative">
          <select
            value={filterWebinarId}
            onChange={e => setFilterWebinarId(e.target.value)}
            className="appearance-none text-[12px] font-medium pl-3 pr-7 py-1.5 rounded-lg focus:outline-none cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <option value="all" style={{ background: '#1A1D24' }}>All webinars</option>
            {allWebinars.map(w => (
              <option key={w.id} value={w.id} style={{ background: '#1A1D24' }}>{w.name}</option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-white/40" />
        </div>

        {/* Clear button */}
        {messages.length > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
            style={{ background: 'rgba(229,25,31,0.15)', color: '#f87171', border: '1px solid rgba(229,25,31,0.25)' }}
          >
            <Trash2 className="w-3 h-3" /> Clear all
          </button>
        )}
      </div>

      {/* ── BODY ──────────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {filteredMsgs.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center -mt-10 pb-16">
            <div className="w-16 h-16 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
              <Inbox className="w-8 h-8 text-slate-300" />
            </div>
            <div>
              <p className="font-semibold text-slate-600 text-[15px]">No messages yet</p>
              <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                When attendees send messages in the watch room,<br />
                they'll appear here for you to reply to in real-time.
              </p>
            </div>
            <a
              href="/watch/webinar-1"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[12px] text-[#0E72ED] hover:underline mt-1 font-medium"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Open watch room to test
            </a>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-3 pb-4">
            {/* Webinar dividers + message cards */}
            {filteredMsgs.reduce((acc, msg, i) => {
              const prev = filteredMsgs[i - 1]
              const showDivider = !prev || prev.webinar_id !== msg.webinar_id
              if (showDivider) {
                acc.push(
                  <div key={`div-${msg.webinar_id}-${i}`} className="flex items-center gap-2 py-1">
                    <div className="h-px flex-1 bg-slate-300/60" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 shrink-0">
                      {getWebinarName(msg.webinar_id)}
                    </span>
                    <div className="h-px flex-1 bg-slate-300/60" />
                  </div>
                )
              }
              acc.push(
                <MessageCard
                  key={msg.id}
                  msg={msg}
                  replies={getRepliesFor(msg.id)}
                  draft={drafts[msg.id] || ''}
                  onDraftChange={val => handleDraftChange(msg.id, val)}
                  onSend={e => handleSendReply(e, msg.id, msg.webinar_id, msg.sender)}
                  webinarName={getWebinarName(msg.webinar_id)}
                />
              )
              return acc
            }, [])}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ── FOOTER ────────────────────────────────────────────────────────────── */}
      <div
        className="shrink-0 flex items-center gap-2 px-5 py-2"
        style={{ background: '#1A1D24', borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <Circle
          className="w-2 h-2 fill-green-400 text-green-400 shrink-0"
          style={{ animation: 'pulse 2s ease-in-out infinite' }}
        />
        <span className="text-[11px] text-white/30">Listening for new messages…</span>
        <span className="ml-auto text-[11px] text-white/20">
          {messages.length} message{messages.length !== 1 ? 's' : ''}
        </span>
        <style>{`
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.2; } }
        `}</style>
      </div>
    </div>
  )
}
