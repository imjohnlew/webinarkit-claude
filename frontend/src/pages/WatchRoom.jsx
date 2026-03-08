import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import WaitingRoom from './WaitingRoom'
import {
  MicOff, VideoOff, Users, MessageSquare, HelpCircle,
  Hand, Smile, MoreHorizontal, PhoneOff, Play, Pause,
  Volume2, VolumeX, Maximize, Shield, Circle,
  ChevronDown, Send, X,
} from 'lucide-react'
import { clsx } from 'clsx'
import mock from '../api/mockStore'

// ── Helpers ───────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  '#0E72ED', '#7B2D8B', '#1F7A4D', '#C85A00', '#C41230',
  '#1D6FA4', '#6A3FB5', '#1B8A74', '#B86800', '#A01020',
]

function getAvatarColor(name) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

// ── Participant count ─────────────────────────────────────────────────────────
function useParticipantCount(webinarId) {
  const range = mock.getAttendeeRange(webinarId)
  const rand = (r) => Math.floor(r.min_count + Math.random() * (r.max_count - r.min_count))
  const [count, setCount] = useState(() => rand(range))
  useEffect(() => {
    const id = setInterval(() => {
      const r = mock.getAttendeeRange(webinarId)
      setCount(rand(r))
    }, 2800 + Math.random() * 1800)
    return () => clearInterval(id)
  }, [webinarId])
  return count
}

// ── Toolbar button (light Zoom theme) ─────────────────────────────────────────
function ToolBtn({ icon: Icon, label, onClick, active, danger, disabled, badge }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={clsx(
        'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-150 min-w-[60px] relative',
        danger    ? 'text-[#E5191F] hover:bg-red-50'
        : active  ? 'text-[#0E72ED] bg-[#EBF5FF]'
        : disabled ? 'text-[#BBBBBB] cursor-not-allowed'
        : 'text-[#333333] hover:bg-[#F0F0F0]',
      )}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <span className="text-[11px] font-medium leading-none whitespace-nowrap">{label}</span>
      {badge != null && (
        <span
          className="absolute top-1 right-2 min-w-[16px] h-4 px-1 text-[9px] font-bold rounded-full flex items-center justify-center"
          style={{ background: '#0E72ED', color: '#fff' }}
        >
          {badge}
        </span>
      )}
    </button>
  )
}

// ── Chat message (light theme) ────────────────────────────────────────────────
function ChatMsg({ msg, isNew, isYou, isHost }) {
  const avatarColor = isHost ? '#0E72ED' : isYou ? '#0E72ED' : getAvatarColor(msg.name)
  return (
    <div className={clsx(
      'px-4 py-2.5 transition-colors',
      isHost  ? 'bg-[#EBF5FF] hover:bg-[#dbeeff]' : 'hover:bg-[#F7F7F7]',
      isNew   && 'animate-fade-slide-up'
    )}>
      <div className="flex items-start gap-2.5">
        <div
          className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-white text-[9px] font-black"
          style={{ background: avatarColor }}
        >
          {initials(isHost ? 'JY' : isYou ? 'You' : msg.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className={clsx('text-[12px] font-semibold', isHost ? 'text-[#0E72ED]' : 'text-[#333]')}>
              {isHost ? msg.name : isYou ? 'You' : msg.name}
            </span>
            {isHost
              ? <span className="text-[9px] font-bold text-[#0E72ED] bg-[#CCE4FF] px-1.5 py-0.5 rounded-full uppercase tracking-wide leading-none">Host</span>
              : <span className="text-[11px] text-[#999]">to Everyone</span>
            }
          </div>
          <p className="text-[13px] text-[#555] leading-snug break-words">{msg.message}</p>
        </div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function WatchRoom() {
  const { webinarId } = useParams()
  const videoRef       = useRef(null)
  const chatBottom     = useRef(null)
  const userMsgIdsRef  = useRef([])   // tracks inbox IDs of messages this attendee sent

  // ── IMPORTANT: ALL hooks must be declared before any conditional return ────
  // forceLive toggles the waiting room gate (dev-only bypass)
  const [forceLive, setForceLive] = useState(false)

  const webinar      = mock.getWebinar(webinarId)
  const allMessages  = mock.listChatMessages(webinarId)
  const participants = useParticipantCount(webinarId)

  const [currentTime, setCurrentTime] = useState(0)
  const [playing,     setPlaying]     = useState(false)
  const [muted,       setMuted]       = useState(false)
  const [volume,      setVolume]      = useState(1)
  const [visibleMsgs, setVisibleMsgs] = useState([])
  const [newMsgIds,   setNewMsgIds]   = useState(new Set())
  const [userMsg,     setUserMsg]     = useState('')
  const [userMsgs,    setUserMsgs]    = useState([])
  const [chatOpen,    setChatOpen]    = useState(false)
  const [elapsedStr,  setElapsedStr]  = useState('00:00:00')
  const [reactions,     setReactions]     = useState([])
  const [adminReplies,  setAdminReplies]  = useState([])
  const elapsedSecs = useRef(0)

  // Session elapsed timer
  useEffect(() => {
    const id = setInterval(() => {
      elapsedSecs.current += 1
      const s = elapsedSecs.current
      const h = Math.floor(s / 3600)
      const m = Math.floor((s % 3600) / 60)
      const sec = s % 60
      setElapsedStr(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
      )
    }, 1000)
    return () => clearInterval(id)
  }, [])

  // Replay chat timing
  useEffect(() => {
    const due = allMessages.filter(m => m.time_seconds <= currentTime)
    if (due.length > visibleMsgs.length) {
      const newOnes = due.slice(visibleMsgs.length)
      setNewMsgIds(new Set(newOnes.map(m => m.id)))
      setVisibleMsgs(due)
      setTimeout(() => setNewMsgIds(new Set()), 600)
    }
  }, [currentTime, allMessages])

  // Auto-scroll chat
  useEffect(() => {
    chatBottom.current?.scrollIntoView({ behavior: 'smooth' })
  }, [visibleMsgs, userMsgs, adminReplies])

  // Poll for admin replies to messages this attendee sent
  useEffect(() => {
    const id = setInterval(() => {
      if (userMsgIdsRef.current.length) {
        setAdminReplies(mock.listAdminRepliesForMessages(userMsgIdsRef.current))
      }
    }, 2000)
    return () => clearInterval(id)
  }, [webinarId])

  // ── Waiting room gate (computed after all hooks) ───────────────────────────
  // In prod: purely time-based. In dev: Force Start button overrides.
  const sessionInfo = mock.getNextSessionFromNow(webinarId)
  const needsWait   = sessionInfo && !sessionInfo.is_live && !forceLive && !webinar?.instant_watch_enabled
  const devMode     = import.meta.env.DEV

  // Conditional return is safe here — all hooks are already declared above.
  if (needsWait) {
    return (
      <WaitingRoom
        webinar={webinar}
        startsAt={sessionInfo.starts_at}
        participants={participants}
        onLive={() => setForceLive(true)}
        devMode={devMode}
      />
    )
  }
  // ──────────────────────────────────────────────────────────────────────────

  const togglePlay = () => {
    const v = videoRef.current
    if (!v) return
    v.paused ? v.play() : v.pause()
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
    const el = document.querySelector('.wk-zoom-wrap')
    if (!document.fullscreenElement) el?.requestFullscreen()
    else document.exitFullscreen()
  }

  const sendMsg = (e) => {
    e.preventDefault()
    if (!userMsg.trim()) return
    const msg = userMsg.trim()
    // Save to admin-only inbox — NOT visible to other attendees
    const stored = mock.pushInboxMessage(webinarId, 'Attendee', msg)
    // Track the inbox ID so we can poll for admin replies
    userMsgIdsRef.current = [...userMsgIdsRef.current, stored.id]
    // Show privately to sender only, tagged with inboxId for reply correlation
    setUserMsgs(prev => [...prev, { id: `u-${Date.now()}`, name: 'You', message: msg, isYou: true, inboxId: stored.id }])
    setUserMsg('')
  }

  const sendReaction = (emoji) => {
    const id = Date.now()
    setReactions(r => [...r, { id, emoji, x: 20 + Math.random() * 60 }])
    setTimeout(() => setReactions(r => r.filter(x => x.id !== id)), 3000)
  }

  const videoSrc = webinar?.video_url ||
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
  const allChats    = [...visibleMsgs, ...userMsgs]
  const unreadCount = chatOpen ? 0 : visibleMsgs.length

  return (
    <div
      className="wk-zoom-wrap h-screen flex flex-col overflow-hidden"
      style={{ background: '#F7F8FA', fontFamily: '"Lato", system-ui, -apple-system, sans-serif' }}
    >

      {/* ── TOP BAR ─────────────────────────────────────────────────────────── */}
      <div
        className="shrink-0 flex items-center justify-between px-5 z-20"
        style={{ background: '#FFFFFF', borderBottom: '1px solid #E0E0E0', height: '52px' }}
      >
        {/* Left: security + title */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Shield className="w-4 h-4 text-[#0E72ED] shrink-0" />
          <span className="text-[#1A1A1A] text-[13px] font-semibold truncate max-w-xs">
            {webinar?.name || 'Webinar'}
          </span>
        </div>

        {/* Center: LIVE badge + elapsed */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div
            className="flex items-center gap-1.5 text-white text-[11px] font-bold px-2.5 py-1 rounded"
            style={{ background: '#E5191F' }}
          >
            <Circle
              className="w-1.5 h-1.5 fill-white text-white"
              style={{ animation: 'pulse 1.5s ease-in-out infinite' }}
            />
            LIVE
          </div>
          <span className="text-[12px] text-[#666] tabular-nums font-medium">{elapsedStr}</span>
        </div>

        {/* Right: volume + fullscreen */}
        <div className="flex items-center gap-2.5 flex-1 justify-end">
          <button
            onClick={toggleMute}
            className="text-[#555] hover:text-[#333] transition-colors"
          >
            {muted || volume === 0
              ? <VolumeX className="w-4 h-4" />
              : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range" min="0" max="1" step="0.05"
            value={muted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-20 h-1 cursor-pointer accent-[#0e72ed]"
          />
          <button
            onClick={toggleFullscreen}
            className="text-[#555] hover:text-[#333] transition-colors"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── BODY ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 bg-black">

        {/* ── VIDEO AREA ──────────────────────────────────────────────────── */}
        <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
          <video
            ref={videoRef}
            src={videoSrc}
            className="w-full h-full object-contain"
            onTimeUpdate={e => setCurrentTime(e.target.currentTime)}
            onLoadedMetadata={() => {}}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onDoubleClick={toggleFullscreen}
            playsInline
          />

          {/* Paused overlay */}
          {!playing && (
            <button
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center group"
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center transition-all group-hover:scale-110 active:scale-95"
                style={{
                  background: 'rgba(0,0,0,0.55)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.18)',
                }}
              >
                <Play className="w-7 h-7 text-white ml-1" />
              </div>
            </button>
          )}

          {/* Presenter name card — Zoom style bottom-left */}
          <div className="absolute bottom-4 left-4 pointer-events-none">
            <div
              className="px-3 py-1.5 rounded"
              style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)' }}
            >
              <span className="text-white text-[12px] font-medium">Jackson Yew (Host)</span>
            </div>
          </div>

          {/* Floating reactions */}
          {reactions.map(r => (
            <div
              key={r.id}
              className="absolute bottom-16 text-3xl pointer-events-none"
              style={{ left: `${r.x}%`, animation: 'floatUp 3s ease-out forwards' }}
            >
              {r.emoji}
            </div>
          ))}
        </div>

        {/* ── CHAT PANEL ──────────────────────────────────────────────────── */}
        {chatOpen && (
          <div
            className="w-[320px] shrink-0 flex flex-col"
            style={{ background: '#FFFFFF', borderLeft: '1px solid #E0E0E0' }}
          >
            {/* Header */}
            <div
              className="shrink-0 flex items-center justify-between px-4"
              style={{ height: '52px', borderBottom: '1px solid #E8E8E8' }}
            >
              <span className="text-[14px] font-semibold text-[#1A1A1A]">In-meeting Chat</span>
              <button
                onClick={() => setChatOpen(false)}
                className="text-[#999] hover:text-[#555] transition-colors p-1 rounded hover:bg-[#F0F0F0]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto py-2">
              {allChats.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-2 pb-8">
                  <MessageSquare className="w-8 h-8 text-[#CCCCCC]" />
                  <p className="text-[#AAAAAA] text-[12px] text-center px-6 leading-relaxed">
                    Chat messages will appear as the webinar plays
                  </p>
                </div>
              )}
              {visibleMsgs.map(msg => (
                <ChatMsg key={msg.id} msg={msg} isNew={newMsgIds.has(msg.id)} />
              ))}
              {userMsgs.map(msg => (
                <div key={msg.id}>
                  <ChatMsg msg={msg} isYou />
                  {/* Show host replies to this specific message */}
                  {adminReplies
                    .filter(r => r.inbox_message_id === msg.inboxId)
                    .map(r => (
                      <ChatMsg
                        key={r.id}
                        msg={{ name: 'Jackson Yew (Host)', message: r.attendee_name ? `@${r.attendee_name} ${r.message}` : r.message }}
                        isHost
                      />
                    ))
                  }
                </div>
              ))}
              <div ref={chatBottom} />
            </div>

            {/* Input area */}
            <div
              className="shrink-0 p-3 space-y-2"
              style={{ borderTop: '1px solid #E8E8E8' }}
            >
              <div className="flex items-center gap-1.5 text-[12px] text-[#999]">
                <span>To:</span>
                <button className="flex items-center gap-1 text-[#555] hover:text-[#333] font-semibold transition-colors">
                  Everyone <ChevronDown className="w-3 h-3" />
                </button>
              </div>
              <form onSubmit={sendMsg} className="flex items-center gap-2">
                <input
                  type="text"
                  value={userMsg}
                  onChange={e => setUserMsg(e.target.value)}
                  placeholder="Send a message to everyone"
                  maxLength={200}
                  className="flex-1 text-[13px] text-[#333] placeholder-[#AAAAAA] focus:outline-none bg-transparent"
                  style={{ borderBottom: '1px solid #D0D0D0', paddingBottom: '4px' }}
                />
                <button
                  type="submit"
                  disabled={!userMsg.trim()}
                  className="text-[#0E72ED] disabled:text-[#CCCCCC] transition-colors hover:text-[#1a8aff]"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* ── BOTTOM TOOLBAR ──────────────────────────────────────────────────── */}
      <div
        className="shrink-0 flex items-center justify-between px-4 z-20"
        style={{ background: '#FFFFFF', borderTop: '1px solid #E0E0E0', height: '68px' }}
      >
        {/* Left: mute + video (disabled for attendees) */}
        <div className="flex items-center gap-0.5">
          <ToolBtn icon={MicOff}   label="Mute"       disabled />
          <ToolBtn icon={VideoOff} label="Stop Video" disabled />
        </div>

        {/* Center: main controls */}
        <div className="flex items-center gap-0.5">
          <ToolBtn
            icon={Users}
            label={`${participants}`}
            onClick={() => {}}
          />
          <ToolBtn
            icon={MessageSquare}
            label="Chat"
            active={chatOpen}
            badge={!chatOpen && unreadCount > 0 ? unreadCount : null}
            onClick={() => setChatOpen(v => !v)}
          />
          <ToolBtn icon={HelpCircle}     label="Q&A"        onClick={() => setChatOpen(true)} />
          <ToolBtn icon={Hand}           label="Raise Hand"  onClick={() => {}} />
          <div className="relative group">
            <ToolBtn icon={Smile} label="Reactions" />
            {/* Emoji picker on hover */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex gap-1 bg-white rounded-xl px-3 py-2 shadow-xl border border-[#E0E0E0] z-50">
              {['👍', '🎉', '❤️', '😂', '😮', '👏'].map(e => (
                <button
                  key={e}
                  onClick={() => sendReaction(e)}
                  className="text-xl hover:scale-125 transition-transform"
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <ToolBtn icon={MoreHorizontal} label="More" />
        </div>

        {/* Right: play/pause + leave */}
        <div className="flex items-center gap-1">
          <button
            onClick={togglePlay}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-[#333] hover:bg-[#F0F0F0] transition-all min-w-[60px]"
          >
            {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            <span className="text-[11px] font-medium">{playing ? 'Pause' : 'Resume'}</span>
          </button>
          <button
            className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-white font-medium transition-all hover:opacity-90 active:scale-95"
            style={{ background: '#E5191F', minWidth: '64px' }}
          >
            <PhoneOff className="w-5 h-5" />
            <span className="text-[11px] font-medium">Leave</span>
          </button>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes floatUp {
          0%   { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-120px) scale(0.6); opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}
