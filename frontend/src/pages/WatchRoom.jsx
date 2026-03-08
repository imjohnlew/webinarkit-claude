import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { Radio, Users, Send, X, Volume2, VolumeX, Maximize, Play, Pause } from 'lucide-react'
import { clsx } from 'clsx'
import mock from '../api/mockStore'

// Sample colours for chat avatars
const AVATAR_COLORS = [
  'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-pink-500',   'bg-cyan-500', 'bg-orange-500',  'bg-teal-500',
]

function getColor(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function fmtTime(s) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60)
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  return `${m}:${String(sec).padStart(2,'0')}`
}

// ── Fake live participant count (fluctuates slightly) ─────────────────────────
function useParticipantCount(base = 142) {
  const [count, setCount] = useState(base)
  useEffect(() => {
    const id = setInterval(() => {
      setCount(c => c + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 3))
    }, 4000)
    return () => clearInterval(id)
  }, [])
  return Math.max(base - 10, count)
}

// ── Chat message component ─────────────────────────────────────────────────────
function ChatMsg({ msg, isNew }) {
  return (
    <div className={clsx(
      'flex gap-2.5 px-4 py-2 transition-all duration-300',
      isNew && 'animate-slide-up'
    )}>
      <div className={clsx(
        'w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5',
        getColor(msg.name)
      )}>
        {initials(msg.name)}
      </div>
      <div className="min-w-0">
        <span className="text-xs font-semibold text-slate-300">{msg.name} </span>
        <span className="text-xs text-slate-400">{msg.message}</span>
      </div>
    </div>
  )
}

// ── Main WatchRoom ─────────────────────────────────────────────────────────────
export default function WatchRoom() {
  const { webinarId } = useParams()
  const videoRef = useRef(null)
  const chatBottomRef = useRef(null)

  const webinar = mock.getWebinar(webinarId)
  const allMessages = mock.listChatMessages(webinarId)
  const participants = useParticipantCount(webinar ? 120 + Math.floor(Math.random() * 80) : 142)

  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [showControls, setShowControls] = useState(true)
  const [visibleMsgs, setVisibleMsgs] = useState([])
  const [newMsgIds, setNewMsgIds] = useState(new Set())
  const [userMsg, setUserMsg] = useState('')
  const [userMsgs, setUserMsgs] = useState([])
  const [ctaVisible, setCtaVisible] = useState(false)
  const controlsTimer = useRef(null)

  // Show replay chat messages as time progresses
  useEffect(() => {
    const due = allMessages.filter(m => m.time_seconds <= currentTime)
    if (due.length > visibleMsgs.length) {
      const newOnes = due.slice(visibleMsgs.length)
      const ids = new Set(newOnes.map(m => m.id))
      setNewMsgIds(ids)
      setVisibleMsgs(due)
      setTimeout(() => setNewMsgIds(new Set()), 800)
    }
  }, [currentTime, allMessages])

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [visibleMsgs, userMsgs])

  // Show CTA button after 70% watch time
  useEffect(() => {
    if (duration > 0 && currentTime / duration >= 0.7) setCtaVisible(true)
  }, [currentTime, duration])

  // Hide controls after inactivity
  const resetControlsTimer = useCallback(() => {
    setShowControls(true)
    clearTimeout(controlsTimer.current)
    controlsTimer.current = setTimeout(() => { if (playing) setShowControls(false) }, 3000)
  }, [playing])

  const togglePlay = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) { v.play(); setPlaying(true) } else { v.pause(); setPlaying(false) }
  }

  const handleSeek = (e) => {
    const v = videoRef.current
    if (!v || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    v.currentTime = pct * duration
  }

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value)
    setVolume(val)
    if (videoRef.current) videoRef.current.volume = val
    setMuted(val === 0)
  }

  const toggleMute = () => {
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    setMuted(v.muted)
  }

  const toggleFullscreen = () => {
    const el = document.querySelector('.wk-player-wrap')
    if (!document.fullscreenElement) el?.requestFullscreen()
    else document.exitFullscreen()
  }

  const sendUserMsg = (e) => {
    e.preventDefault()
    if (!userMsg.trim()) return
    setUserMsgs(msgs => [...msgs, {
      id: `u-${Date.now()}`, name: 'You', message: userMsg.trim(), isYou: true,
    }])
    setUserMsg('')
  }

  // Use a royalty-free sample video if no video_url set
  const videoSrc = webinar?.video_url || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="h-screen bg-[#0f1117] flex flex-col overflow-hidden">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-5 h-12 bg-[#0f1117] border-b border-white/8 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
            <Radio className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-white font-semibold text-sm truncate max-w-[300px]">
            {webinar?.name || 'Webinar'}
          </span>
          <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-bold rounded-full border border-red-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            LIVE
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <Users className="w-3.5 h-3.5" />
            <span className="font-medium text-white">{participants.toLocaleString()}</span>
            <span className="hidden sm:inline">watching</span>
          </div>
        </div>
      </div>

      {/* ── Body: video + chat ── */}
      <div className="flex flex-1 min-h-0">

        {/* ── Video panel ── */}
        <div
          className="flex-1 flex flex-col relative wk-player-wrap bg-black"
          onMouseMove={resetControlsTimer}
          onMouseLeave={() => playing && setShowControls(false)}
        >
          <video
            ref={videoRef}
            src={videoSrc}
            className="flex-1 w-full object-contain"
            onTimeUpdate={e => setCurrentTime(e.target.currentTime)}
            onLoadedMetadata={e => setDuration(e.target.duration)}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onClick={togglePlay}
            playsInline
          />

          {/* ── Controls overlay ── */}
          <div className={clsx(
            'absolute bottom-0 left-0 right-0 transition-opacity duration-300',
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}>
            {/* Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

            <div className="relative px-4 pb-4 pt-8 space-y-2">
              {/* Progress bar */}
              <div
                className="h-1.5 bg-white/20 rounded-full cursor-pointer group"
                onClick={handleSeek}
              >
                <div
                  className="h-full bg-brand-500 rounded-full relative"
                  style={{ width: `${pct}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity -mr-1.5" />
                </div>
              </div>

              {/* Buttons row */}
              <div className="flex items-center gap-3">
                <button onClick={togglePlay} className="text-white hover:text-brand-400 transition-colors">
                  {playing
                    ? <Pause className="w-5 h-5" />
                    : <Play className="w-5 h-5" />
                  }
                </button>

                {/* Volume */}
                <div className="flex items-center gap-1.5">
                  <button onClick={toggleMute} className="text-white hover:text-brand-400 transition-colors">
                    {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input
                    type="range" min="0" max="1" step="0.05"
                    value={muted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-20 h-1 accent-brand-500 cursor-pointer"
                  />
                </div>

                <span className="text-white/70 text-xs ml-1 tabular-nums">
                  {fmtTime(currentTime)} / {fmtTime(duration)}
                </span>

                <div className="flex-1" />

                <button onClick={toggleFullscreen} className="text-white hover:text-brand-400 transition-colors">
                  <Maximize className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* ── CTA banner ── */}
          {ctaVisible && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 w-full max-w-md px-4">
              <div className="bg-brand-600 rounded-xl px-5 py-4 shadow-2xl shadow-brand-900/50 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm">🎯 Special offer — limited seats</p>
                  <p className="text-brand-200 text-xs mt-0.5 truncate">Join now and get instant access</p>
                </div>
                <button className="shrink-0 bg-white text-brand-700 text-sm font-bold px-4 py-2 rounded-lg hover:bg-brand-50 transition-colors">
                  Claim offer
                </button>
                <button onClick={() => setCtaVisible(false)} className="text-brand-300 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Play button overlay (when paused) ── */}
          {!playing && (
            <button
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
                <Play className="w-8 h-8 text-white ml-1" />
              </div>
            </button>
          )}
        </div>

        {/* ── Chat panel ── */}
        <div className="w-80 shrink-0 flex flex-col bg-[#16181f] border-l border-white/8">
          {/* Chat header */}
          <div className="px-4 py-3 border-b border-white/8 shrink-0">
            <p className="text-white text-sm font-semibold">Live Chat</p>
            <p className="text-slate-500 text-xs mt-0.5">{visibleMsgs.length + userMsgs.length} messages</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto py-2 space-y-0.5 scrollbar-thin">
            {visibleMsgs.length === 0 && userMsgs.length === 0 && (
              <p className="text-slate-600 text-xs text-center py-8 px-4">
                Chat messages will appear here as the video plays...
              </p>
            )}
            {visibleMsgs.map(msg => (
              <ChatMsg key={msg.id} msg={msg} isNew={newMsgIds.has(msg.id)} />
            ))}
            {userMsgs.map(msg => (
              <div key={msg.id} className="flex gap-2.5 px-4 py-2">
                <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5">
                  YO
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-brand-400">You </span>
                  <span className="text-xs text-slate-400">{msg.message}</span>
                </div>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>

          {/* Chat input */}
          <form
            onSubmit={sendUserMsg}
            className="shrink-0 px-3 py-3 border-t border-white/8"
          >
            <div className="flex items-center gap-2 bg-white/6 rounded-xl px-3 py-2 focus-within:ring-1 focus-within:ring-brand-500/50">
              <input
                type="text"
                value={userMsg}
                onChange={e => setUserMsg(e.target.value)}
                placeholder="Send a message…"
                maxLength={200}
                className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-600 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!userMsg.trim()}
                className="text-slate-500 hover:text-brand-400 disabled:opacity-30 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-700 mt-1.5 px-1">
              💡 Chat is for demo — messages are pre-configured
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
