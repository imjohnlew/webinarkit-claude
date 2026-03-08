import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Video,
  Users,
  CalendarDays,
  TrendingUp,
  ArrowRight,
  Plus,
  Clock,
  BarChart3,
  Activity,
  Zap,
} from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'

// Mock data for dashboard
const MOCK_STATS = {
  totalWebinars: 8,
  totalRegistrations: 1842,
  upcomingSessions: 5,
  avgAttendanceRate: 67,
}

const MOCK_UPCOMING = [
  {
    id: 1,
    title: 'SaaS Growth Masterclass',
    seriesName: 'Growth Series',
    date: 'Today at 2:00 PM ET',
    registrations: 142,
    status: 'active',
  },
  {
    id: 2,
    title: 'Product Demo: Enterprise',
    seriesName: 'Product Demos',
    date: 'Tomorrow at 11:00 AM ET',
    registrations: 89,
    status: 'active',
  },
  {
    id: 3,
    title: 'Onboarding Webinar Week 3',
    seriesName: 'Customer Onboarding',
    date: 'Thu, Mar 12 at 3:00 PM ET',
    registrations: 54,
    status: 'active',
  },
  {
    id: 4,
    title: 'How to Scale Your Agency',
    seriesName: 'Agency Growth',
    date: 'Fri, Mar 13 at 1:00 PM ET',
    registrations: 211,
    status: 'active',
  },
  {
    id: 5,
    title: 'Q1 Partner Update',
    seriesName: 'Partner Series',
    date: 'Mon, Mar 16 at 4:00 PM ET',
    registrations: 37,
    status: 'draft',
  },
]

const MOCK_RECENT_ACTIVITY = [
  { id: 1, action: 'New registration', detail: 'john@acme.com joined SaaS Growth Masterclass', time: '2 min ago', type: 'register' },
  { id: 2, action: 'Webinar completed', detail: 'Cold Email Secrets — 94 attendees', time: '1 hour ago', type: 'complete' },
  { id: 3, action: 'New registration', detail: 'sarah@techco.io joined Product Demo: Enterprise', time: '3 hours ago', type: 'register' },
  { id: 4, action: 'Schedule added', detail: 'Agency Growth series — Tuesday 10 AM ET', time: '5 hours ago', type: 'schedule' },
  { id: 5, action: 'Webinar created', detail: 'Q1 Partner Update created in Partner Series', time: 'Yesterday', type: 'create' },
]

function StatCard({ icon: Icon, label, value, delta, color }) {
  return (
    <Card className="flex items-start gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-slate-900 mt-0.5">{value}</p>
        {delta && (
          <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {delta}
          </p>
        )}
      </div>
    </Card>
  )
}

function ActivityDot({ type }) {
  const colors = {
    register: 'bg-emerald-500',
    complete: 'bg-blue-500',
    schedule: 'bg-purple-500',
    create: 'bg-amber-500',
  }
  return (
    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${colors[type] || 'bg-slate-400'}`} />
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('auth_user') || '{"name":"User"}')
  const firstName = user.name?.split(' ')[0] || 'there'

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {greeting}, {firstName}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Here's what's happening with your webinars today.
          </p>
        </div>
        <Button
          icon={Plus}
          onClick={() => navigate('/webinars/new')}
          size="md"
        >
          New Webinar
        </Button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Video}
          label="Total Webinars"
          value={MOCK_STATS.totalWebinars}
          delta="+2 this month"
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          icon={Users}
          label="Total Registrations"
          value={MOCK_STATS.totalRegistrations.toLocaleString()}
          delta="+18% from last month"
          color="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          icon={CalendarDays}
          label="Upcoming Sessions"
          value={MOCK_STATS.upcomingSessions}
          color="bg-purple-50 text-purple-600"
        />
        <StatCard
          icon={BarChart3}
          label="Avg Attendance Rate"
          value={`${MOCK_STATS.avgAttendanceRate}%`}
          delta="+3% from last month"
          color="bg-amber-50 text-amber-600"
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming sessions */}
        <div className="lg:col-span-2">
          <Card padding={false}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Upcoming Sessions</h2>
                <p className="text-xs text-slate-500 mt-0.5">Next 5 scheduled webinars</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                iconRight={ArrowRight}
                onClick={() => navigate('/webinars')}
              >
                View all
              </Button>
            </div>

            <div className="divide-y divide-slate-100">
              {MOCK_UPCOMING.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors group"
                >
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-brand-50 transition-colors">
                    <Video className="w-4 h-4 text-slate-500 group-hover:text-brand-600 transition-colors" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{session.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <p className="text-xs text-slate-500 truncate">{session.date}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-semibold text-slate-900">{session.registrations}</p>
                      <p className="text-xs text-slate-400">registrants</p>
                    </div>
                    <Badge variant={session.status === 'active' ? 'active' : 'draft'} dot>
                      {session.status === 'active' ? 'Active' : 'Draft'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Quick actions */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-slate-900">Quick Actions</h2>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Create New Webinar', icon: Plus, action: () => navigate('/webinars/new'), primary: true },
                { label: 'View All Webinars', icon: Video, action: () => navigate('/webinars') },
                { label: 'View Analytics', icon: BarChart3, action: () => navigate('/analytics') },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-colors ${
                    item.primary
                      ? 'bg-brand-600 text-white hover:bg-brand-700'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </button>
              ))}
            </div>
          </Card>

          {/* Recent activity */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-900">Recent Activity</h2>
            </div>
            <div className="space-y-3">
              {MOCK_RECENT_ACTIVITY.map((item) => (
                <div key={item.id} className="flex items-start gap-2.5">
                  <ActivityDot type={item.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700">{item.action}</p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{item.detail}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
