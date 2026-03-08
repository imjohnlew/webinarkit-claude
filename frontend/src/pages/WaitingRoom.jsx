import { useState, useEffect } from 'react'
import { Shield, Users, Clock, Zap } from 'lucide-react'

// ── Helpers ───────────────────────────────────────────────────────────────────
function getTimeLeft(startsAt) {
  const diff = Math.max(0, new Date(startsAt) - Date.now())
  const totalSecs = Math.floor(diff / 1000)
  const d = Math.floor(totalSecs / 86400)
  const h = Math.floor((totalSecs % 86400) / 3600)
  const m = Math.floor((totalSecs % 3600) / 60)
  const s = totalSecs % 60
  return { days: d, hours: h, minutes: m, seconds: s, total: diff }
}

function pad(n) { return String(n).padStart(2, '0') }

// ── Countdown digit block ─────────────────────────────────────────────────────
function Digit({ value, label }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="w-20 h-20 flex items-center justify-center rounded-2xl text-white text-4xl font-bold tabular-nums"
        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
      >
        {pad(value)}
      </div>
      <span className="text-[11px] text-white/40 uppercase tracking-widest font-medium">{label}</span>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
// Props:
//   webinar     — webinar object
//   startsAt    — ISO string of scheduled start
//   participants — fake attendee count
//   onLive      — called when countdown reaches 0 (or dev forces it)
//   devMode     — boolean, shows the dev toggle
export default function WaitingRoom({ webinar, startsAt, participants, onLive, devMode }) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(startsAt))
  const [forcedLive, setForcedLive] = useState(false)

  useEffect(() => {
    const id = setInterval(() => {
      const left = getTimeLeft(startsAt)
      setTimeLeft(left)
      if (left.total <= 0) {
        clearInterval(id)
        onLive?.()
      }
    }, 1000)
    return () => clearInterval(id)
  }, [startsAt])

  const fmtDate = (iso) =>
    new Date(iso).toLocaleDateString([], {
      weekday: 'long', month: 'long', day: 'numeric',
    })

  const fmtStartTime = (iso) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const showDays = timeLeft.days > 0

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ background: '#111318', fontFamily: '"Lato", system-ui, sans-serif' }}
    >
      {/* Top bar — matches WatchRoom header */}
      <div
        className="shrink-0 flex items-center justify-between px-5"
        style={{ background: '#1A1D24', borderBottom: '1px solid rgba(255,255,255,0.08)', height: '52px' }}
      >
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#0E72ED] shrink-0" />
          <span className="text-white/80 text-[13px] font-semibold truncate max-w-xs">
            {webinar?.name || 'Webinar'}
          </span>
        </div>
        <div
          className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded"
          style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}
        >
          <Clock className="w-3 h-3" /> WAITING
        </div>
        <div className="flex items-center gap-2 text-white/30 text-[12px]">
          <Users className="w-3.5 h-3.5" />
          {participants} waiting
        </div>
      </div>

      {/* Body — centered content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">

        {/* Host avatar / logo placeholder */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black text-white mb-6 shrink-0"
          style={{
            background: 'linear-gradient(135deg, #0E72ED 0%, #6C3DE8 100%)',
            boxShadow: '0 0 0 4px rgba(14,114,237,0.18)',
          }}
        >
          JY
        </div>

        {/* Webinar title */}
        <h1 className="text-white text-2xl font-bold text-center max-w-lg leading-snug mb-1">
          {webinar?.name || 'Webinar'}
        </h1>
        <p className="text-white/40 text-sm mb-1">Hosted by <span className="text-white/60 font-medium">Jackson Yew</span></p>

        {/* Scheduled time label */}
        {startsAt && (
          <p className="text-[#0E72ED] text-sm font-medium mb-8">
            {fmtDate(startsAt)} at {fmtStartTime(startsAt)}
          </p>
        )}

        {/* "Starts in" label */}
        <p className="text-white/35 text-xs uppercase tracking-[0.2em] font-semibold mb-4">
          Webinar starts in
        </p>

        {/* Countdown */}
        <div className="flex items-start gap-3 mb-10">
          {showDays && <Digit value={timeLeft.days}    label="Days" />}
          {showDays && <Separator />}
          <Digit value={timeLeft.hours}   label="Hours" />
          <Separator />
          <Digit value={timeLeft.minutes} label="Min" />
          <Separator />
          <Digit value={timeLeft.seconds} label="Sec" />
        </div>

        {/* Tagline */}
        <p className="text-white/30 text-sm text-center max-w-sm leading-relaxed">
          Please wait — this session will begin automatically at the scheduled time.
          You're all set!
        </p>

        {/* Attendee pulse strip */}
        <div
          className="mt-8 flex items-center gap-2.5 px-4 py-2.5 rounded-full"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex -space-x-1.5">
            {['#0E72ED', '#7B2D8B', '#1F7A4D', '#C85A00', '#C41230'].map((c, i) => (
              <div
                key={i}
                className="w-6 h-6 rounded-full border-2 flex items-center justify-center"
                style={{ background: c, borderColor: '#111318' }}
              />
            ))}
          </div>
          <span className="text-white/50 text-xs">
            <span className="text-white/70 font-semibold">{participants}</span> people are already waiting
          </span>
        </div>
      </div>

      {/* DEV ONLY — force-start toggle */}
      {devMode && (
        <div
          className="shrink-0 flex items-center justify-center gap-3 py-3 px-5"
          style={{ background: '#1A1D24', borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <span className="text-[10px] text-white/20 uppercase tracking-widest font-bold">Dev Mode</span>
          <button
            onClick={onLive}
            className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}
          >
            <Zap className="w-3.5 h-3.5" />
            Force Start → Go Live
          </button>
        </div>
      )}
    </div>
  )
}

function Separator() {
  return (
    <div className="flex flex-col items-center justify-center h-20 gap-2">
      <div className="w-1.5 h-1.5 rounded-full bg-white/25" />
      <div className="w-1.5 h-1.5 rounded-full bg-white/25" />
    </div>
  )
}
