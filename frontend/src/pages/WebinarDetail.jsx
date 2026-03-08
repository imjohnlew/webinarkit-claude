import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Calendar, Users, Bell, Settings, Plus, Trash2,
  Clock, Copy, ExternalLink, Save, MessageSquare,
  ChevronDown, ChevronUp, AlertCircle, CheckCircle2, Upload, Play,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { clsx } from 'clsx'
import { webinarsApi } from '../api/webinars'
import { schedulesApi } from '../api/schedules'
import { notificationsApi } from '../api/notifications'
import mock from '../api/mockStore'
import { ScheduleModal } from '../components/ScheduleModal'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Toggle } from '../components/ui/Toggle'
import { Badge } from '../components/ui/Badge'
import { Modal, ModalBody, ModalFooter } from '../components/ui/Modal'

// ── Tab IDs ───────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'details',       label: 'Details',       icon: Settings },
  { id: 'schedule',      label: 'Schedule',      icon: Calendar },
  { id: 'chat',          label: 'Replay Chat',   icon: MessageSquare },
  { id: 'registrations', label: 'Registrations', icon: Users },
  { id: 'notifications', label: 'Notifications', icon: Bell },
]

// ── Notification types grouped ────────────────────────────────────────────────
const NOTIF_GROUPS = [
  {
    label: 'Pre-webinar',
    types: ['confirmation', '2day_reminder', '1day_reminder', '3hour_reminder', '30min_reminder'],
    labels: {
      confirmation:    'Confirmation email',
      '2day_reminder': '2-day reminder',
      '1day_reminder': '1-day reminder',
      '3hour_reminder':'3-hour reminder',
      '30min_reminder':'30-min reminder',
    },
  },
  {
    label: 'Attendance',
    types: ['attended', 'did_not_attend'],
    labels: { attended: 'Attended', did_not_attend: 'Did not attend' },
  },
  {
    label: 'Watch progress',
    types: ['watched_25', 'watched_50', 'watched_75', 'watched_100'],
    labels: { watched_25: 'Watched 25%', watched_50: 'Watched 50%', watched_75: 'Watched 75%', watched_100: 'Watched 100%' },
  },
  {
    label: 'Offer',
    types: ['clicked_offer', 'did_not_click_offer'],
    labels: { clicked_offer: 'Clicked offer', did_not_click_offer: 'Did not click offer' },
  },
  {
    label: 'Follow-up',
    types: ['right_after', '1day_after', '2days_after', '3days_after'],
    labels: { right_after: 'Right after', '1day_after': '1 day after', '2days_after': '2 days after', '3days_after': '3 days after' },
  },
  {
    label: 'Replay',
    types: ['viewed_replay', 'did_not_view_replay', 'clicked_replay_button', 'did_not_click_replay_button'],
    labels: {
      viewed_replay: 'Viewed replay',
      did_not_view_replay: 'Did not view replay',
      clicked_replay_button: 'Clicked replay button',
      did_not_click_replay_button: 'Did not click replay button',
    },
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
function scheduleLabel(s) {
  if (!s) return ''
  const t = `${s.time} ${s.period}`
  if (s.type === 'Every') return `Every ${s.day === 'Day' ? 'day' : s.day} at ${t} (${s.timezone})`
  return `On ${s.day} at ${t} (${s.timezone})`
}

// Map frontend modal format → backend API format
function toApiSchedule(modal) {
  return {
    type:     modal.type === 'ongoing' ? 'Every' : 'On',
    day:      modal.type === 'ongoing'
                ? (modal.day === 'Every day' ? 'Day' : modal.day)
                : modal.specificDate,
    time:     modal.time,
    period:   modal.ampm,
    timezone: modal.timezone,
  }
}

// ── Details Tab ───────────────────────────────────────────────────────────────
function DetailsTab({ webinar }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    name:                webinar.name || '',
    duration_minutes:    webinar.duration_minutes || 60,
    video_url:           webinar.video_url || '',
    registration_page_url: webinar.registration_page_url || '',
    thank_you_page_url:  webinar.thank_you_page_url || '',
    replay_enabled:      webinar.replay_enabled ?? true,
  })
  const [saved, setSaved] = useState(false)

  const update = useMutation({
    mutationFn: (body) => webinarsApi.update(webinar.id, body),
    onSuccess: () => {
      qc.invalidateQueries(['webinar', webinar.id])
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    update.mutate(form)
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-5">
      <Input
        label="Webinar name"
        value={form.name}
        onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
        required
      />
      <Input
        label="Duration (minutes)"
        type="number"
        min={1}
        value={form.duration_minutes}
        onChange={(e) => setForm(f => ({ ...f, duration_minutes: parseInt(e.target.value) }))}
      />
      <Input
        label="Video URL"
        type="url"
        placeholder="https://..."
        value={form.video_url}
        onChange={(e) => setForm(f => ({ ...f, video_url: e.target.value }))}
      />
      <Input
        label="Registration page URL override"
        type="url"
        placeholder="Leave blank to use default"
        value={form.registration_page_url}
        onChange={(e) => setForm(f => ({ ...f, registration_page_url: e.target.value }))}
      />
      <Input
        label="Thank-you page URL"
        type="url"
        placeholder="https://..."
        value={form.thank_you_page_url}
        onChange={(e) => setForm(f => ({ ...f, thank_you_page_url: e.target.value }))}
      />
      <div className="flex items-center justify-between py-3 px-4 border border-slate-200 rounded-lg">
        <div>
          <p className="text-sm font-medium text-slate-800">Enable replay</p>
          <p className="text-xs text-slate-500 mt-0.5">Allow registrants to watch a replay after the session</p>
        </div>
        <Toggle
          checked={form.replay_enabled}
          onChange={(v) => setForm(f => ({ ...f, replay_enabled: v }))}
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" variant="primary" disabled={update.isLoading}>
          <Save className="w-4 h-4 mr-1.5" />
          {update.isLoading ? 'Saving…' : 'Save changes'}
        </Button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-emerald-600">
            <CheckCircle2 className="w-4 h-4" /> Saved
          </span>
        )}
      </div>
    </form>
  )
}

// ── Schedule Tab ──────────────────────────────────────────────────────────────
function ScheduleTab({ webinar }) {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [jitMinutes, setJitMinutes] = useState(webinar.just_in_time_minutes || 15)
  const [jitSaved, setJitSaved] = useState(false)

  const { data: schedules = [] } = useQuery(
    ['schedules', webinar.id],
    () => schedulesApi.getByWebinar(webinar.id),
  )

  const { data: blockouts = [] } = useQuery(
    ['blockouts', webinar.id],
    () => schedulesApi.getBlockouts(webinar.id),
  )

  const { data: upcoming = [] } = useQuery(
    ['upcoming', webinar.id],
    () => webinarsApi.getUpcoming(webinar.id, 5),
    { refetchOnWindowFocus: false },
  )

  const addSchedule = useMutation({
    mutationFn: (body) => schedulesApi.create(webinar.id, body),
    onSuccess: () => {
      qc.invalidateQueries(['schedules', webinar.id])
      qc.invalidateQueries(['upcoming', webinar.id])
    },
  })

  const delSchedule = useMutation({
    mutationFn: (id) => schedulesApi.delete(webinar.id, id),
    onSuccess: () => {
      qc.invalidateQueries(['schedules', webinar.id])
      qc.invalidateQueries(['upcoming', webinar.id])
    },
  })

  const addBlockout = useMutation({
    mutationFn: (date) => schedulesApi.addBlockout(webinar.id, date),
    onSuccess: () => qc.invalidateQueries(['blockouts', webinar.id]),
  })

  const delBlockout = useMutation({
    mutationFn: (id) => schedulesApi.deleteBlockout(webinar.id, id),
    onSuccess: () => qc.invalidateQueries(['blockouts', webinar.id]),
  })

  const toggleInstant = useMutation({
    mutationFn: (enabled) => schedulesApi.setInstantWatch(webinar.id, enabled),
    onSuccess: () => qc.invalidateQueries(['webinar', webinar.id]),
  })

  const toggleJit = useMutation({
    mutationFn: ({ enabled, minutes }) => schedulesApi.setJustInTime(webinar.id, enabled, minutes),
    onSuccess: () => {
      qc.invalidateQueries(['webinar', webinar.id])
      setJitSaved(true)
      setTimeout(() => setJitSaved(false), 2000)
    },
  })

  const handleAddSchedule = (modalData) => {
    addSchedule.mutate(toApiSchedule(modalData))
  }

  return (
    <div className="space-y-8 max-w-2xl">

      {/* Schedule rules */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-800">Schedule rules</h3>
          <Button variant="secondary" size="sm" onClick={() => setShowModal(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Add schedule
          </Button>
        </div>
        <div className="space-y-2">
          {schedules.length === 0 && (
            <p className="text-sm text-slate-400 py-4 text-center border border-dashed border-slate-200 rounded-lg">
              No schedule rules yet — add one above.
            </p>
          )}
          {schedules.map((s) => (
            <div key={s.id} className="flex items-center justify-between px-4 py-3 border border-slate-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-sm text-slate-700">{scheduleLabel(s)}</span>
              </div>
              <button
                onClick={() => delSchedule.mutate(s.id)}
                className="text-slate-400 hover:text-red-500 transition-colors p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Upcoming sessions preview */}
      {upcoming.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Next upcoming sessions</h3>
          <div className="space-y-1.5">
            {upcoming.map((s, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 rounded-lg">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-sm text-slate-700">
                  {format(parseISO(s.starts_at), "EEE, MMM d yyyy 'at' h:mm a")}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Blockout dates */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Blockout dates</h3>
            <p className="text-xs text-slate-500 mt-0.5">Sessions won't run on these dates</p>
          </div>
          <input
            type="date"
            min={new Date().toISOString().split('T')[0]}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
            onChange={(e) => {
              if (e.target.value) {
                addBlockout.mutate(e.target.value)
                e.target.value = ''
              }
            }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {blockouts.length === 0 && (
            <p className="text-sm text-slate-400">No blockout dates.</p>
          )}
          {blockouts.map((b) => (
            <span key={b.id} className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 text-xs font-medium rounded-full border border-red-200">
              {format(parseISO(b.date), 'MMM d, yyyy')}
              <button onClick={() => delBlockout.mutate(b.id)} className="hover:text-red-900">
                ×
              </button>
            </span>
          ))}
        </div>
      </section>

      {/* Instant watch */}
      <section className="border border-slate-200 rounded-xl p-4 space-y-1">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800">Instant watch</p>
            <p className="text-xs text-slate-500 mt-0.5">Registrants can watch immediately after registering</p>
          </div>
          <Toggle
            checked={webinar.instant_watch_enabled ?? false}
            onChange={(v) => toggleInstant.mutate(v)}
          />
        </div>
      </section>

      {/* Just-in-time */}
      <section className="border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800">Just-in-time sessions</p>
            <p className="text-xs text-slate-500 mt-0.5">Session starts N minutes after registration</p>
          </div>
          <Toggle
            checked={webinar.just_in_time_enabled ?? false}
            onChange={(v) => toggleJit.mutate({ enabled: v, minutes: jitMinutes })}
          />
        </div>
        {webinar.just_in_time_enabled && (
          <div className="flex items-center gap-3 pt-1">
            <Input
              label="Minutes after registration"
              type="number"
              min={1}
              value={jitMinutes}
              onChange={(e) => setJitMinutes(parseInt(e.target.value))}
              className="max-w-[180px]"
            />
            <Button
              variant="secondary"
              size="sm"
              className="mt-5"
              onClick={() => toggleJit.mutate({ enabled: true, minutes: jitMinutes })}
            >
              {jitSaved ? '✓ Saved' : 'Save'}
            </Button>
          </div>
        )}
      </section>

      <ScheduleModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleAddSchedule}
      />
    </div>
  )
}

// ── Registrations Tab ─────────────────────────────────────────────────────────
function RegistrationsTab({ webinar }) {
  const regLink = `${window.location.origin}/r/${webinar.id}`
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(regLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="max-w-xl space-y-6">
      <section className="card p-5 space-y-3">
        <h3 className="text-sm font-semibold text-slate-800">Registration link</h3>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={regLink}
            className="flex-1 text-sm px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-600 focus:outline-none"
          />
          <Button variant="secondary" size="sm" onClick={copy}>
            <Copy className="w-3.5 h-3.5 mr-1" />
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          <a href={regLink} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary" size="sm">
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </a>
        </div>
      </section>

      <section className="card p-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-1">Registrant data</h3>
        <p className="text-sm text-slate-500">
          View full registration analytics on the{' '}
          <Link to={`/analytics/${webinar.id}`} className="text-brand-600 hover:underline">
            Analytics page
          </Link>
          .
        </p>
      </section>
    </div>
  )
}

// ── Notifications Tab ─────────────────────────────────────────────────────────
function NotificationEditor({ webinarId, notif, label }) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [subject, setSubject] = useState(notif.subject || '')
  const [bodyHtml, setBodyHtml] = useState(notif.body_html || '')
  const [saved, setSaved] = useState(false)

  const upsert = useMutation({
    mutationFn: (body) => notificationsApi.upsert(webinarId, notif.notification_type, body),
    onSuccess: () => {
      qc.invalidateQueries(['notifications', webinarId])
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  const toggle = useMutation({
    mutationFn: (enabled) => notificationsApi.upsert(webinarId, notif.notification_type, {
      enabled, subject: notif.subject, body_html: notif.body_html,
    }),
    onSuccess: () => qc.invalidateQueries(['notifications', webinarId]),
  })

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Toggle
            checked={notif.enabled ?? false}
            onChange={(v) => toggle.mutate(v)}
          />
          <span className="text-sm font-medium text-slate-700">{label}</span>
          {notif.enabled && notif.subject && (
            <span className="text-xs text-slate-400 truncate max-w-[200px]">{notif.subject}</span>
          )}
        </div>
        <button
          onClick={() => setOpen(o => !o)}
          className="text-slate-400 hover:text-slate-600 p-1"
        >
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-100 px-4 py-4 space-y-3 bg-slate-50">
          <Input
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject line"
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Body HTML</label>
            <textarea
              value={bodyHtml}
              onChange={(e) => setBodyHtml(e.target.value)}
              rows={6}
              placeholder="<p>Hi {{first_name}},</p>..."
              className="block w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono resize-y bg-white"
            />
            <p className="text-xs text-slate-400 mt-1.5">
              Variables: {'{{first_name}}'}, {'{{webinar_name}}'}, {'{{join_url}}'}, {'{{session_time}}'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="sm"
              onClick={() => upsert.mutate({ enabled: notif.enabled ?? false, subject, body_html: bodyHtml })}
              disabled={upsert.isLoading}
            >
              <Save className="w-3.5 h-3.5 mr-1" />
              {upsert.isLoading ? 'Saving…' : 'Save email'}
            </Button>
            {saved && <span className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Saved</span>}
          </div>
        </div>
      )}
    </div>
  )
}

function NotificationsTab({ webinar }) {
  const { data: notifications = [] } = useQuery(
    ['notifications', webinar.id],
    () => notificationsApi.getAll(webinar.id),
  )

  const byType = Object.fromEntries(notifications.map(n => [n.notification_type, n]))

  return (
    <div className="max-w-2xl space-y-8">
      {NOTIF_GROUPS.map((group) => (
        <section key={group.label}>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{group.label}</h3>
          <div className="space-y-2">
            {group.types.map((type) => {
              const notif = byType[type] ?? {
                notification_type: type, enabled: false, subject: null, body_html: null,
              }
              return (
                <NotificationEditor
                  key={type}
                  webinarId={webinar.id}
                  notif={notif}
                  label={group.labels[type]}
                />
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}

// ── Chat Tab ──────────────────────────────────────────────────────────────────
function ChatTab({ webinar }) {
  const qc = useQueryClient()
  const [messages, setMessages] = useState(() => mock.listChatMessages(webinar.id))
  const [parseError, setParseError] = useState('')
  const [saved, setSaved] = useState(false)

  const handleCsvUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setParseError('')
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const lines = ev.target.result.split('\n').filter(l => l.trim())
        const header = lines[0].toLowerCase()
        if (!header.includes('time') || !header.includes('name') || !header.includes('message')) {
          setParseError('CSV must have columns: time_seconds, name, message')
          return
        }
        const parsed = lines.slice(1).map((line, i) => {
          const cols = line.split(',')
          return {
            id: `csv-${i}`,
            webinar_id: webinar.id,
            time_seconds: parseInt(cols[0]) || 0,
            name: (cols[1] || '').trim(),
            message: cols.slice(2).join(',').trim(),
          }
        }).filter(m => m.name && m.message)
        setMessages(parsed)
      } catch {
        setParseError('Could not parse CSV. Check the format.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleSave = () => {
    mock.setChatMessages(webinar.id, messages)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleDelete = (id) => setMessages(msgs => msgs.filter(m => m.id !== id))

  const handleAddRow = () => {
    setMessages(msgs => [...msgs, {
      id: `manual-${Date.now()}`,
      webinar_id: webinar.id,
      time_seconds: 0,
      name: '',
      message: '',
    }])
  }

  const handleEdit = (id, field, value) => {
    setMessages(msgs => msgs.map(m => m.id === id ? { ...m, [field]: field === 'time_seconds' ? parseInt(value) || 0 : value } : m))
  }

  const fmtTime = (s) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${String(sec).padStart(2, '0')}`
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Replay chat messages</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            These messages appear in the chat panel as the video plays. Upload a CSV or add rows manually.
          </p>
        </div>
        <a
          href={`/watch/${webinar.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 px-3 py-1.5 border border-brand-200 rounded-lg hover:bg-brand-50 transition-colors"
        >
          <Play className="w-3.5 h-3.5" /> Preview watch room
        </a>
      </div>

      {/* CSV upload */}
      <div className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center hover:border-brand-300 transition-colors">
        <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
        <p className="text-sm font-medium text-slate-700 mb-1">Upload CSV file</p>
        <p className="text-xs text-slate-400 mb-3">Format: <code className="bg-slate-100 px-1 rounded">time_seconds,name,message</code></p>
        <label className="cursor-pointer">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            <Upload className="w-3.5 h-3.5" /> Choose CSV
          </span>
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleCsvUpload} />
        </label>
        {parseError && <p className="text-xs text-red-500 mt-2">{parseError}</p>}
      </div>

      {/* Message table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[80px_140px_1fr_36px] text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50 px-4 py-2.5 border-b border-slate-200">
          <span>Time</span><span>Name</span><span>Message</span><span />
        </div>
        <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
          {messages.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-6">No chat messages yet.</p>
          )}
          {messages.map(m => (
            <div key={m.id} className="grid grid-cols-[80px_140px_1fr_36px] items-center px-4 py-2 gap-2">
              <input
                type="number"
                min="0"
                value={m.time_seconds}
                onChange={e => handleEdit(m.id, 'time_seconds', e.target.value)}
                className="text-xs border border-slate-200 rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-brand-400"
                placeholder="0"
              />
              <input
                value={m.name}
                onChange={e => handleEdit(m.id, 'name', e.target.value)}
                className="text-xs border border-slate-200 rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-brand-400"
                placeholder="Name"
              />
              <input
                value={m.message}
                onChange={e => handleEdit(m.id, 'message', e.target.value)}
                className="text-xs border border-slate-200 rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-brand-400"
                placeholder="Message text"
              />
              <button onClick={() => handleDelete(m.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50">
          <button onClick={handleAddRow} className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Add row
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="primary" size="sm" onClick={handleSave}>
          <Save className="w-3.5 h-3.5 mr-1" /> Save chat
        </Button>
        {saved && <span className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Saved</span>}
        <span className="text-xs text-slate-400">{messages.length} message{messages.length !== 1 ? 's' : ''}</span>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function WebinarDetail() {
  const { webinarId } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('details')

  const { data: webinar, isLoading, isError } = useQuery(
    ['webinar', webinarId],
    () => webinarsApi.getById(webinarId),
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (isError || !webinar) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-slate-600">Webinar not found</p>
        <Button variant="secondary" onClick={() => navigate('/webinars')}>Go back</Button>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/webinars')}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to webinars
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{webinar.name}</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {webinar.duration_minutes} min · {webinar.replay_enabled ? 'Replay enabled' : 'No replay'}
            </p>
          </div>
          <Badge variant={webinar.is_active ? 'success' : 'default'}>
            {webinar.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-6">
        <nav className="flex gap-1" aria-label="Tabs">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                activeTab === id
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300',
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'details'       && <DetailsTab webinar={webinar} />}
      {activeTab === 'schedule'      && <ScheduleTab webinar={webinar} />}
      {activeTab === 'chat'          && <ChatTab webinar={webinar} />}
      {activeTab === 'registrations' && <RegistrationsTab webinar={webinar} />}
      {activeTab === 'notifications' && <NotificationsTab webinar={webinar} />}
    </div>
  )
}
