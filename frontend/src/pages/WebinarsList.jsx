import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Plus, ChevronDown, ChevronRight, Pencil, Copy, Trash2,
  Link2, BarChart3, Video, FolderOpen, Search, MoreHorizontal,
} from 'lucide-react'
import { seriesApi } from '../api/series'
import { webinarsApi } from '../api/webinars'
import { clsx } from 'clsx'

// ── Modals ────────────────────────────────────────────────────────────────────

function CreateSeriesModal({ onClose, onCreate }) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      await onCreate(name.trim())
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-slide-up">
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">New webinar series</h2>
          <p className="text-sm text-slate-500 mt-0.5">A series groups related webinars together</p>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Series name</label>
            <input
              autoFocus
              className="input-base"
              placeholder="e.g. AI Business Masterclass"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={!name.trim() || loading} className="btn-primary">
              {loading ? 'Creating…' : 'Create series'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CreateWebinarModal({ seriesId, onClose, onCreate }) {
  const [name, setName] = useState('')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      await onCreate({ series_id: seriesId, name: name.trim(), title: title.trim() || name.trim() })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-slide-up">
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Add webinar to series</h2>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Internal name</label>
            <input
              autoFocus
              className="input-base"
              placeholder="e.g. Day 1 – Replay 8pm"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Display title (public)</label>
            <input
              className="input-base"
              placeholder="Same as name if empty"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={!name.trim() || loading} className="btn-primary">
              {loading ? 'Creating…' : 'Add webinar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Webinar row ───────────────────────────────────────────────────────────────

function WebinarRow({ webinar, onDelete }) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const scheduleLabel = (() => {
    const s = webinar.webinar_schedules?.[0]
    if (!s) return webinar.instant_watch_enabled ? 'Instant watch' : 'No schedule'
    if (s.type === 'Every') return `Every ${s.day === 'Day' ? 'day' : s.day} ${s.time} ${s.period}`
    return `On ${s.day}`
  })()

  return (
    <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors">
      <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
        <Video className="w-4 h-4 text-brand-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate">{webinar.name}</p>
        <p className="text-xs text-slate-500 mt-0.5">{scheduleLabel}</p>
      </div>
      <div className="flex items-center gap-1.5">
        <span className={clsx(
          'text-xs font-medium px-2 py-0.5 rounded-full',
          webinar.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
        )}>
          {webinar.instant_watch_enabled ? 'AUTOMATED' : 'SCHEDULED'} · {(webinar.status || 'active').toUpperCase()}
        </span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => navigate(`/webinars/${webinar.id}`)}
          className="btn-ghost text-xs px-2.5 py-1.5"
        >
          Edit
        </button>
        <div className="relative">
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="btn-ghost p-1.5"
            onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-100 z-20 py-1">
              <button
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                onClick={() => { navigate(`/webinars/${webinar.id}`); setMenuOpen(false) }}
              >
                <Pencil className="w-3.5 h-3.5 inline mr-2 text-slate-400" />
                Edit webinar
              </button>
              <button
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/register/${webinar.id}`); setMenuOpen(false) }}
              >
                <Link2 className="w-3.5 h-3.5 inline mr-2 text-slate-400" />
                Copy reg link
              </button>
              <button
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                onClick={() => { navigate(`/analytics?webinar=${webinar.id}`); setMenuOpen(false) }}
              >
                <BarChart3 className="w-3.5 h-3.5 inline mr-2 text-slate-400" />
                View analytics
              </button>
              <div className="my-1 border-t border-slate-100" />
              <button
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                onClick={() => { onDelete(webinar.id); setMenuOpen(false) }}
              >
                <Trash2 className="w-3.5 h-3.5 inline mr-2" />
                Delete webinar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Series card ───────────────────────────────────────────────────────────────

function SeriesCard({ series, onDeleteWebinar, onAddWebinar }) {
  const [expanded, setExpanded] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const qc = useQueryClient()

  const deleteSeries = useMutation({
    mutationFn: () => seriesApi.delete(series.id),
    onSuccess: () => qc.invalidateQueries(['series']),
  })

  const cloneSeries = useMutation({
    mutationFn: () => seriesApi.clone(series.id),
    onSuccess: () => qc.invalidateQueries(['series']),
  })

  return (
    <div className="card overflow-hidden">
      {/* Series header */}
      <div className="flex items-center gap-3 px-5 py-4">
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex items-center gap-3 flex-1 min-w-0 text-left"
        >
          {expanded
            ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          }
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{series.name}</p>
            <p className="text-xs text-slate-500 mt-0.5">{series.webinars?.length ?? 0} webinar(s)</p>
          </div>
        </button>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-brand-50 text-brand-700">SERIES</span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">ACTIVE</span>
          {/* Series menu */}
          <div className="relative">
            <button
              className="btn-ghost p-1.5"
              onClick={() => setMenuOpen(v => !v)}
              onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-100 z-20 py-1">
                <button
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  onClick={() => { onAddWebinar(series.id); setMenuOpen(false) }}
                >
                  <Plus className="w-3.5 h-3.5 inline mr-2 text-slate-400" />
                  Add webinar
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  onClick={() => { cloneSeries.mutate(); setMenuOpen(false) }}
                >
                  <Copy className="w-3.5 h-3.5 inline mr-2 text-slate-400" />
                  Clone series
                </button>
                <div className="my-1 border-t border-slate-100" />
                <button
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  onClick={() => { deleteSeries.mutate(); setMenuOpen(false) }}
                >
                  <Trash2 className="w-3.5 h-3.5 inline mr-2" />
                  Delete series
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Webinars list */}
      {expanded && (
        <div className="border-t border-slate-100">
          {(series.webinars ?? []).map(w => (
            <WebinarRow
              key={w.id}
              webinar={w}
              onDelete={onDeleteWebinar}
            />
          ))}
          {(series.webinars ?? []).length === 0 && (
            <div className="px-5 py-6 text-center text-sm text-slate-400">
              No webinars yet.{' '}
              <button className="text-brand-600 hover:underline" onClick={() => onAddWebinar(series.id)}>
                Add one
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function WebinarsList() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showCreateSeries, setShowCreateSeries] = useState(false)
  const [addWebinarTo, setAddWebinarTo] = useState(null) // seriesId

  const { data: series = [], isLoading } = useQuery({
    queryKey: ['series'],
    queryFn: seriesApi.getAll,
  })

  const createSeries = useMutation({
    mutationFn: (name) => seriesApi.create({ name }),
    onSuccess: () => qc.invalidateQueries(['series']),
  })

  const createWebinar = useMutation({
    mutationFn: (body) => webinarsApi.create(body),
    onSuccess: () => qc.invalidateQueries(['series']),
  })

  const deleteWebinar = useMutation({
    mutationFn: (id) => webinarsApi.delete(id),
    onSuccess: () => qc.invalidateQueries(['series']),
  })

  const filtered = series.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.webinars?.some(w => w.name.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Webinars</h1>
          <p className="text-sm text-slate-500 mt-0.5">{series.length} series · {series.reduce((n, s) => n + (s.webinars?.length ?? 0), 0)} webinars</p>
        </div>
        <button onClick={() => setShowCreateSeries(true)} className="btn-primary">
          <Plus className="w-4 h-4" />
          New webinar
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          className="input-base pl-9"
          placeholder="Search series or webinars…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-1/3 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-1/5" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center mb-4">
            <FolderOpen className="w-6 h-6 text-brand-500" />
          </div>
          <p className="text-slate-600 font-medium">No webinars yet</p>
          <p className="text-slate-400 text-sm mt-1 mb-5">Create your first webinar series to get started</p>
          <button onClick={() => setShowCreateSeries(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            Create webinar series
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(s => (
            <SeriesCard
              key={s.id}
              series={s}
              onDeleteWebinar={id => deleteWebinar.mutate(id)}
              onAddWebinar={seriesId => setAddWebinarTo(seriesId)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreateSeries && (
        <CreateSeriesModal
          onClose={() => setShowCreateSeries(false)}
          onCreate={name => createSeries.mutateAsync(name)}
        />
      )}
      {addWebinarTo && (
        <CreateWebinarModal
          seriesId={addWebinarTo}
          onClose={() => setAddWebinarTo(null)}
          onCreate={body => createWebinar.mutateAsync(body)}
        />
      )}
    </div>
  )
}
