import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Users, Eye, MousePointerClick, Percent, AlertCircle } from 'lucide-react'
import { webinarsApi } from '../api/webinars'
import { Button } from '../components/ui/Button'

function StatCard({ label, value, icon: Icon, sub, color = 'brand' }) {
  const colorMap = {
    brand:   'bg-blue-50 text-blue-600',
    green:   'bg-emerald-50 text-emerald-600',
    amber:   'bg-amber-50 text-amber-600',
    purple:  'bg-purple-50 text-purple-600',
  }
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={`p-2.5 rounded-xl ${colorMap[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value ?? '—'}</p>
        <p className="text-sm font-medium text-slate-700 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function pct(num, denom) {
  if (!denom) return '—'
  return `${Math.round((num / denom) * 100)}%`
}

export default function Analytics() {
  const { webinarId } = useParams()
  const navigate = useNavigate()

  const { data: webinar } = useQuery(
    ['webinar', webinarId],
    () => webinarsApi.getById(webinarId),
    { enabled: !!webinarId },
  )

  const { data: stats, isLoading, isError } = useQuery(
    ['analytics', webinarId],
    () => webinarsApi.getAnalytics(webinarId),
    { enabled: !!webinarId },
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (isError || !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-slate-600">Could not load analytics</p>
        <Button variant="secondary" onClick={() => navigate(-1)}>Go back</Button>
      </div>
    )
  }

  const attendRate = pct(stats.attended, stats.total_registrations)
  const clickRate  = pct(stats.clicked_offer, stats.attended)
  const replayRate = pct(stats.viewed_replay, stats.total_registrations)

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-xl font-bold text-slate-900">
          Analytics{webinar ? ` — ${webinar.name}` : ''}
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">All-time registration &amp; engagement stats</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total registrations"
          value={stats.total_registrations}
          icon={Users}
          color="brand"
        />
        <StatCard
          label="Attended"
          value={stats.attended}
          icon={Eye}
          sub={`${attendRate} attendance rate`}
          color="green"
        />
        <StatCard
          label="Clicked offer"
          value={stats.clicked_offer}
          icon={MousePointerClick}
          sub={`${clickRate} of attendees`}
          color="amber"
        />
        <StatCard
          label="Viewed replay"
          value={stats.viewed_replay}
          icon={Percent}
          sub={`${replayRate} of registrants`}
          color="purple"
        />
      </div>

      {/* Watch progress breakdown */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-slate-800 mb-4">Watch progress breakdown</h2>
        <div className="space-y-3">
          {[
            { label: 'Watched 25%+', value: stats.watched_25 },
            { label: 'Watched 50%+', value: stats.watched_50 },
            { label: 'Watched 75%+', value: stats.watched_75 },
            { label: 'Watched 100%',  value: stats.watched_100 },
          ].map(({ label, value }) => {
            const pctNum = stats.total_registrations ? Math.round(((value || 0) / stats.total_registrations) * 100) : 0
            return (
              <div key={label}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-600">{label}</span>
                  <span className="font-medium text-slate-800">{value ?? 0} <span className="text-slate-400 font-normal">({pctNum}%)</span></span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-full transition-all duration-500"
                    style={{ width: `${pctNum}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
