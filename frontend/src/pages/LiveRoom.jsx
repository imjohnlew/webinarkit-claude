import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  MessageSquare, Users, Upload, Plus, Trash2, Save,
  ExternalLink, ChevronDown, AlertCircle, CheckCircle2,
} from 'lucide-react'
import { clsx } from 'clsx'
import mock from '../api/mockStore'

const TABS = [
  { id: 'chat',      label: 'Replay Chat',     icon: MessageSquare },
  { id: 'attendees', label: 'Attendee Count',   icon: Users },
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

        {/* Preview */}
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

// ── Main page ─────────────────────────────────────────────────────────────────
export default function LiveRoom() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'chat'

  const allWebinars = mock.listWebinars()
  const [selectedWebinarId, setSelectedWebinarId] = useState(allWebinars[0]?.id || '')
  const webinar = allWebinars.find(w => w.id === selectedWebinarId) || allWebinars[0]

  function setTab(id) {
    setSearchParams({ tab: id }, { replace: true })
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Live Room</h1>
        <p className="text-slate-500 mt-1 text-sm">Configure the watch room experience per webinar.</p>
      </div>

      {/* Webinar selector */}
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

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-6">
        <div className="flex gap-1">
          {TABS.map(tab => {
            const Icon = tab.icon
            return (
              <button key={tab.id} onClick={() => setTab(tab.id)}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px',
                  activeTab === tab.id
                    ? 'border-brand-500 text-brand-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                )}>
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {webinar && (
        <>
          {activeTab === 'chat'      && <ChatTab     key={webinar.id} webinar={webinar} />}
          {activeTab === 'attendees' && <AttendeeTab  key={webinar.id} webinar={webinar} />}
        </>
      )}
    </div>
  )
}
