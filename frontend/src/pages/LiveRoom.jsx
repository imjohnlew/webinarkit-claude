import { useState, useEffect, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  MessageSquare, Users, Upload, Plus, Trash2, Save,
  ExternalLink, ChevronDown, AlertCircle, CheckCircle2,
  Inbox, Circle, Zap,
} from 'lucide-react'
import { clsx } from 'clsx'
import mock from '../api/mockStore'

const TABS = [
  { id: 'chat',      label: 'Replay Chat',    icon: MessageSquare },
  { id: 'attendees', label: 'Attendee Count',  icon: Users },
  { id: 'ctas',      label: 'Timed CTAs',      icon: Zap },
  { id: 'inbox',     label: 'Live Inbox',      icon: Inbox },
]

// ── Chat tab ──────────────────────────────────────────────────────────────────
function ChatTab({ webinar }) {
  const [messages, setMessages] = useState(() => mock.listChatMessages(webinar.id))
  const [parseError, setParseError] = useState('')
  const [saved, setSaved] = useState(false)

  function handleCsvUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setParseError('')
    const reader = new FileReader()
    reader.onload = (ev) => {
      const lines = ev.target.result.split('\n').map(l => l.trim()).filter(Boolean)
      const header = lines[0]?.toLowerCase()
      if (!header?.includes('time') || !header?.includes('name') || !header?.includes('message')) {
        setParseError('CSV must have columns: time_seconds, name, message')
        return
      }
      const rows = lines.slice(1).map((line, i) => {
        const parts = line.split(',')
        return {
          id: `csv-${Date.now()}-${i}`,
          webinar_id: webinar.id,
          time_seconds: parseInt(parts[0]) || 0,
          name: parts[1]?.trim() || 'Guest',
          message: parts.slice(2).join(',').trim(),
        }
      }).filter(r => r.message)
      setMessages(rows)
      setSaved(false)
    }
    reader.readAsText(file)
  }

  function handleEdit(id, field, val) {
    setMessages(msgs => msgs.map(m => m.id === id ? { ...m, [field]: field === 'time_seconds' ? parseInt(val) || 0 : val } : m))
    setSaved(false)
  }

  function handleDelete(id) {
    setMessages(msgs => msgs.filter(m => m.id !== id))
    setSaved(false)
  }

  function handleAddRow() {
    const last = messages[messages.length - 1]
    setMessages(msgs => [...msgs, {
      id: `new-${Date.now()}`,
      webinar_id: webinar.id,
      time_seconds: last ? last.time_seconds + 30 : 0,
      name: '',
      message: '',
    }])
    setSaved(false)
  }

  function handleSave() {
    mock.setChatMessages(webinar.id, messages)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-800">Replay Chat Messages</h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Messages appear in the watch room timed to video playback. CSV format: <code className="text-xs bg-slate-100 px-1 rounded">time_seconds,name,message</code>
          </p>
        </div>
        <Link
          to={`/watch/${webinar.id}`}
          target="_blank"
          className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium"
        >
          <ExternalLink className="w-3.5 h-3.5" /> Preview room
        </Link>
      </div>

      {messages.length === 0 && (
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-8 cursor-pointer hover:border-brand-400 hover:bg-brand-50/30 transition-all group">
          <Upload className="w-8 h-8 text-slate-300 group-hover:text-brand-400 mb-3 transition-colors" />
          <span className="text-sm font-medium text-slate-600 group-hover:text-brand-600">Upload chat CSV</span>
          <span className="text-xs text-slate-400 mt-1">Click or drag & drop a .csv file</span>
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleCsvUpload} />
        </label>
      )}

      {parseError && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" /> {parseError}
        </div>
      )}

      {messages.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium cursor-pointer">
              <Upload className="w-3.5 h-3.5" /> Re-upload CSV
              <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleCsvUpload} />
            </label>
            <span className="text-xs text-slate-400">{messages.length} messages</span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-2.5 font-medium text-slate-600 w-24">Time (s)</th>
                  <th className="text-left px-4 py-2.5 font-medium text-slate-600 w-36">Name</th>
                  <th className="text-left px-4 py-2.5 font-medium text-slate-600">Message</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {messages.map((m, i) => (
                  <tr key={m.id} className={clsx('border-b border-slate-100 last:border-0', i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50')}>
                    <td className="px-4 py-2">
                      <input type="number" value={m.time_seconds}
                        onChange={e => handleEdit(m.id, 'time_seconds', e.target.value)}
                        className="w-20 border border-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-400" />
                    </td>
                    <td className="px-4 py-2">
                      <input value={m.name} onChange={e => handleEdit(m.id, 'name', e.target.value)}
                        className="w-full border border-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-400" />
                    </td>
                    <td className="px-4 py-2">
                      <input value={m.message} onChange={e => handleEdit(m.id, 'message', e.target.value)}
                        className="w-full border border-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-400" />
                    </td>
                    <td className="px-3 py-2">
                      <button onClick={() => handleDelete(m.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <button onClick={handleAddRow}
              className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-800 border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-1.5 transition-all">
              <Plus className="w-3.5 h-3.5" /> Add row
            </button>
            <button onClick={handleSave}
              className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save changes</>}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ── Attendee Count tab ────────────────────────────────────────────────────────
function AttendeeTab({ webinar }) {
  const initial = mock.getAttendeeRange(webinar.id)
  const [minCount, setMinCount] = useState(initial.min_count)
  const [maxCount, setMaxCount] = useState(initial.max_count)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  function handleSave() {
    const min = parseInt(minCount) || 0
    const max = parseInt(maxCount) || 0
    if (min >= max) { setError('Max must be greater than min'); return }
    setError('')
    mock.setAttendeeRange(webinar.id, min, max)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const mid = Math.round((parseInt(minCount) + parseInt(maxCount)) / 2) || 0

  return (
    <div className="space-y-6 max-w-md">
      <div>
        <h3 className="font-semibold text-slate-800">Fake Attendee Count</h3>
        <p className="text-sm text-slate-500 mt-0.5">
          The watch room will display a random number within this range, fluctuating every few seconds.
        </p>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Min attendees</label>
            <input
              type="number" min="1" value={minCount}
              onChange={e => { setMinCount(e.target.value); setSaved(false) }}
              className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Max attendees</label>
            <input
              type="number" min="1" value={maxCount}
              onChange={e => { setMaxCount(e.target.value); setSaved(false) }}
              className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
        </div>

        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-4 py-3">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Users className="w-4 h-4 text-brand-500" />
            Typical display
          </div>
          <span className="text-lg font-bold text-slate-800">{mid.toLocaleString()}</span>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Link to={`/watch/${webinar.id}`} target="_blank"
          className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium">
          <ExternalLink className="w-3.5 h-3.5" /> Preview watch room
        </Link>
        <button onClick={handleSave}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save changes</>}
        </button>
      </div>
    </div>
  )
}

// ── Live Inbox tab ────────────────────────────────────────────────────────────
function InboxTab({ messages, onClear, onRead }) {
  const bottomRef = useRef(null)
  const prevLen   = useRef(messages.length)

  const webinars      = mock.listWebinars()
  const getWebinarName = (id) => webinars.find(w => w.id === id)?.name || id

  // Auto-scroll on new messages
  useEffect(() => {
    if (messages.length > prevLen.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    prevLen.current = messages.length
  }, [messages])

  // Mark all read as soon as this tab is visible
  useEffect(() => {
    onRead()
  }, [messages.length])   // re-fires whenever count changes

  const fmtTime = (iso) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  // Group messages so we can show webinar dividers when they change
  const grouped = messages.reduce((acc, msg, i) => {
    const prev = messages[i - 1]
    if (!prev || prev.webinar_id !== msg.webinar_id) {
      acc.push({ type: 'divider', label: getWebinarName(msg.webinar_id) })
    }
    acc.push({ type: 'msg', msg })
    return acc
  }, [])

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 280px)', minHeight: '400px' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h3 className="font-semibold text-slate-800">Live Inbox</h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Real attendee messages — private to admin only, never shown to other attendees.
          </p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-500 border border-slate-200 hover:border-red-200 rounded-lg px-3 py-1.5 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear all
          </button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 min-h-0 overflow-y-auto border border-slate-200 rounded-xl bg-slate-50/50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
              <Inbox className="w-7 h-7 text-slate-300" />
            </div>
            <div>
              <p className="font-medium text-slate-500 text-sm">No messages yet</p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                When attendees send a chat message in the watch room,<br />
                it will appear here privately — only you can see it.
              </p>
            </div>
            <Link
              to="/watch/webinar-1"
              target="_blank"
              className="flex items-center gap-1.5 text-xs text-brand-600 hover:underline mt-1"
            >
              <ExternalLink className="w-3 h-3" /> Open watch room to test
            </Link>
          </div>
        ) : (
          <div className="p-4 space-y-1.5">
            {grouped.map((item, i) =>
              item.type === 'divider' ? (
                <div key={`div-${i}`} className="flex items-center gap-2 py-2">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 shrink-0">
                    {item.label}
                  </span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>
              ) : (
                <div
                  key={item.msg.id}
                  className={clsx(
                    'flex items-start gap-3 p-3 rounded-xl border transition-all',
                    item.msg.read
                      ? 'bg-white border-slate-100'
                      : 'bg-blue-50 border-blue-100'
                  )}
                >
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                    {item.msg.sender.slice(0, 2).toUpperCase()}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[12px] font-semibold text-slate-700">
                        {item.msg.sender}
                      </span>
                      {!item.msg.read && (
                        <span className="text-[9px] font-bold uppercase tracking-wide text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full">
                          New
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 ml-auto shrink-0">
                        {fmtTime(item.msg.sent_at)}
                      </span>
                    </div>
                    <p className="text-[13px] text-slate-600 leading-snug break-words">
                      {item.msg.message}
                    </p>
                  </div>
                </div>
              )
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Live indicator */}
      <div className="flex items-center gap-2 mt-3 shrink-0">
        <Circle
          className="w-2 h-2 fill-green-400 text-green-400 shrink-0"
          style={{ animation: 'liveInboxPulse 2s ease-in-out infinite' }}
        />
        <span className="text-xs text-slate-400">Listening for new messages…</span>
        <style>{`
          @keyframes liveInboxPulse {
            0%, 100% { opacity: 1; }
            50%       { opacity: 0.2; }
          }
        `}</style>
      </div>
    </div>
  )
}

// ── Timed CTAs tab ────────────────────────────────────────────────────────────
function CTATab({ webinar }) {
  const [ctas, setCtas]     = useState(() => mock.listCTAs(webinar.id))
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm]     = useState({
    trigger_seconds: 60, title: '', description: '',
    button_text: 'Claim Now →', button_url: '', accent: '#0E72ED',
  })

  const fmtSecs = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  function handleAdd(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    const item = mock.createCTA(webinar.id, { ...form, trigger_seconds: parseInt(form.trigger_seconds) || 60 })
    setCtas(prev => [...prev, item].sort((a, b) => a.trigger_seconds - b.trigger_seconds))
    setForm({ trigger_seconds: 60, title: '', description: '', button_text: 'Claim Now →', button_url: '', accent: '#0E72ED' })
    setAddOpen(false)
  }

  function handleDelete(id) {
    mock.deleteCTA(id)
    setCtas(prev => prev.filter(c => c.id !== id))
  }

  const field = (label, children) => (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
  const inp = (props) => (
    <input {...props} className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
  )

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-800">Timed CTAs</h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Offer cards slide in for all attendees at a specific video timestamp.{' '}
            <Link to={`/watch/${webinar.id}`} target="_blank" className="text-brand-600 hover:underline">
              Preview room →
            </Link>
          </p>
        </div>
        <button
          onClick={() => setAddOpen(v => !v)}
          className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Add CTA
        </button>
      </div>

      {/* Add form */}
      {addOpen && (
        <form onSubmit={handleAdd} className="border border-brand-200 bg-brand-50/40 rounded-xl p-5 space-y-4">
          <h4 className="text-sm font-semibold text-slate-700">New Timed CTA</h4>
          <div className="grid grid-cols-2 gap-4">
            {field('Trigger (seconds)',
              inp({ type: 'number', min: 1, value: form.trigger_seconds,
                onChange: e => setForm(f => ({ ...f, trigger_seconds: e.target.value })) })
            )}
            {field('Accent colour',
              <input type="color" value={form.accent}
                onChange={e => setForm(f => ({ ...f, accent: e.target.value }))}
                className="w-full h-9 border border-slate-200 bg-white rounded-lg cursor-pointer" />
            )}
          </div>
          {field('Title',
            inp({ required: true, value: form.title, placeholder: '🔥 Special Offer — Ends Tonight',
              onChange: e => setForm(f => ({ ...f, title: e.target.value })) })
          )}
          {field('Description (optional)',
            inp({ value: form.description, placeholder: 'Join and start closing more deals in 30 days.',
              onChange: e => setForm(f => ({ ...f, description: e.target.value })) })
          )}
          <div className="grid grid-cols-2 gap-4">
            {field('Button text',
              inp({ required: true, value: form.button_text, placeholder: 'Claim Now →',
                onChange: e => setForm(f => ({ ...f, button_text: e.target.value })) })
            )}
            {field('Button URL',
              inp({ value: form.button_url, placeholder: 'https://…',
                onChange: e => setForm(f => ({ ...f, button_url: e.target.value })) })
            )}
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setAddOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit"
              className="px-4 py-2 text-sm text-white bg-brand-600 hover:bg-brand-700 font-medium rounded-lg transition-colors">
              Add CTA
            </button>
          </div>
        </form>
      )}

      {/* CTA list */}
      {ctas.length === 0 ? (
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center">
          <Zap className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-500">No CTAs yet</p>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Add a timed offer card that slides in for all attendees at a specific video timestamp.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {ctas.map(cta => (
            <div key={cta.id}
              className="flex items-center gap-4 border border-slate-200 bg-white rounded-xl p-4"
            >
              {/* Time badge */}
              <div className="shrink-0 px-2.5 py-1.5 rounded-lg text-white text-[11px] font-bold tabular-nums"
                style={{ background: cta.accent || '#0E72ED' }}>
                {fmtSecs(cta.trigger_seconds)}
              </div>
              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{cta.title}</p>
                {cta.description && (
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{cta.description}</p>
                )}
                <p className="text-xs font-medium mt-0.5 truncate" style={{ color: cta.accent || '#0E72ED' }}>
                  {cta.button_text}
                </p>
              </div>
              {/* Delete */}
              <button onClick={() => handleDelete(cta.id)}
                className="shrink-0 text-slate-300 hover:text-red-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function LiveRoom() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'chat'

  const allWebinars = mock.listWebinars()
  const [selectedWebinarId, setSelectedWebinarId] = useState(allWebinars[0]?.id || '')
  const webinar = allWebinars.find(w => w.id === selectedWebinarId) || allWebinars[0]

  // Inbox state — polled here so tab badge stays live
  const [inboxMessages, setInboxMessages] = useState(() => mock.listInboxMessages())
  const [inboxUnread,   setInboxUnread]   = useState(() => mock.getInboxUnreadCount())

  useEffect(() => {
    const id = setInterval(() => {
      setInboxMessages(mock.listInboxMessages())
      setInboxUnread(mock.getInboxUnreadCount())
    }, 1500)
    return () => clearInterval(id)
  }, [])

  function setTab(id) {
    setSearchParams({ tab: id }, { replace: true })
  }

  function handleInboxRead() {
    mock.markAllInboxRead()
    // Update local copies to mark read
    setInboxMessages(prev => prev.map(m => ({ ...m, read: true })))
    setInboxUnread(0)
  }

  function handleInboxClear() {
    mock.clearInboxMessages()
    setInboxMessages([])
    setInboxUnread(0)
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Live Room</h1>
        <p className="text-slate-500 mt-1 text-sm">Configure the watch room experience per webinar.</p>
      </div>

      {/* Webinar selector — hidden on inbox tab (inbox shows all webinars) */}
      {activeTab !== 'inbox' && (
        <div className="mb-6 flex items-center gap-3">
          <label className="text-sm font-medium text-slate-600 shrink-0">Webinar:</label>
          <div className="relative">
            <select
              value={selectedWebinarId}
              onChange={e => setSelectedWebinarId(e.target.value)}
              className="appearance-none bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-400 shadow-sm"
            >
              {allWebinars.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          {webinar && (
            <Link to={`/watch/${webinar.id}`} target="_blank"
              className="flex items-center gap-1 text-xs text-brand-600 hover:underline">
              <ExternalLink className="w-3 h-3" /> Open watch room
            </Link>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-6">
        <div className="flex gap-1">
          {TABS.map(tab => {
            const Icon = tab.icon
            const isInbox = tab.id === 'inbox'
            return (
              <button
                key={tab.id}
                onClick={() => setTab(tab.id)}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px',
                  activeTab === tab.id
                    ? 'border-brand-500 text-brand-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {isInbox && inboxUnread > 0 && (
                  <span className="ml-0.5 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                    {inboxUnread}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab content */}
      {webinar && activeTab === 'chat'      && <ChatTab     key={webinar.id} webinar={webinar} />}
      {webinar && activeTab === 'attendees' && <AttendeeTab  key={webinar.id} webinar={webinar} />}
      {webinar && activeTab === 'ctas'      && <CTATab       key={webinar.id} webinar={webinar} />}
      {           activeTab === 'inbox'     && (
        <InboxTab
          messages={inboxMessages}
          onRead={handleInboxRead}
          onClear={handleInboxClear}
        />
      )}
    </div>
  )
}
