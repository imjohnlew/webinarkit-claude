import { useState, useEffect } from 'react'
import { NavLink, useNavigate, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  Video,
  BarChart3,
  Settings,
  ChevronRight,
  LogOut,
  Radio,
  Menu,
  X,
  Bell,
  HelpCircle,
  Zap,
  MessageSquare,
  Users,
  Inbox,
  Monitor,
  Clock,
} from 'lucide-react'
import { clsx } from 'clsx'
import mock from '../api/mockStore'

const navItems = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    to: '/',
    end: true,
  },
  {
    label: 'Webinars',
    icon: Video,
    to: '/webinars',
  },
  {
    label: 'Analytics',
    icon: BarChart3,
    to: '/analytics',
  },
]

function NavItem({ item, collapsed, badge }) {
  const Icon = item.icon

  // External / new-tab link (e.g. Admin Inbox standalone page)
  if (item.target) {
    return (
      <a
        href={item.to}
        target={item.target}
        rel="noopener noreferrer"
        className={clsx(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
          'text-slate-400 hover:bg-white/6 hover:text-slate-200',
          collapsed && 'justify-center'
        )}
      >
        <Icon className="w-5 h-5 shrink-0" />
        {!collapsed && <span className="flex-1">{item.label}</span>}
        {!collapsed && badge != null && badge > 0 && (
          <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none min-w-[18px] text-center">
            {badge}
          </span>
        )}
      </a>
    )
  }

  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
          isActive
            ? 'bg-white/10 text-white'
            : 'text-slate-400 hover:bg-white/6 hover:text-slate-200',
          collapsed && 'justify-center'
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={clsx('w-5 h-5 shrink-0', isActive && 'text-white')} />
          {!collapsed && <span className="flex-1">{item.label}</span>}
          {/* Unread badge */}
          {!collapsed && badge != null && badge > 0 && (
            <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none min-w-[18px] text-center">
              {badge}
            </span>
          )}
          {/* Active dot — only when no badge */}
          {!collapsed && isActive && (badge == null || badge === 0) && (
            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400" />
          )}
        </>
      )}
    </NavLink>
  )
}

export function Layout() {
  const [collapsed,    setCollapsed]    = useState(false)
  const [mobileOpen,   setMobileOpen]   = useState(false)
  const [inboxUnread,  setInboxUnread]  = useState(() => mock.getInboxUnreadCount())
  const navigate = useNavigate()

  // Poll for new inbox messages every 2s to drive sidebar badge
  useEffect(() => {
    const id = setInterval(() => setInboxUnread(mock.getInboxUnreadCount()), 2000)
    return () => clearInterval(id)
  }, [])

  const user = JSON.parse(localStorage.getItem('auth_user') || '{"name":"User","email":"user@example.com"}')

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    navigate('/login')
  }

  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-slate-900 transition-all duration-300',
          'border-r border-white/6',
          collapsed ? 'w-[72px]' : 'w-64',
          'lg:relative lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo area */}
        <div className={clsx(
          'flex items-center h-16 px-4 border-b border-white/8 shrink-0',
          collapsed ? 'justify-center' : 'gap-3'
        )}>
          <div className="flex items-center justify-center w-8 h-8 bg-brand-600 rounded-lg shrink-0">
            <Radio className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <span className="text-white font-bold text-base tracking-tight">WebinarKit</span>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="p-1 text-slate-500 hover:text-slate-300 rounded transition-colors"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
            </button>
          )}
          {collapsed && (
            <button
              onClick={() => setCollapsed(false)}
              className="absolute -right-3 top-5 w-6 h-6 bg-slate-800 border border-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto sidebar-scroll px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavItem key={item.to} item={item} collapsed={collapsed} />
          ))}

          {/* Live Room section */}
          {!collapsed && (
            <div className="pt-4 mt-4 border-t border-white/8">
              <p className="px-3 text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                Rooms
              </p>
              <NavItem item={{ label: 'Live Room',      icon: Radio,    to: '/live-room' }}                                  collapsed={collapsed} />
              <NavItem item={{ label: 'Admin Inbox',    icon: Inbox,    to: '/admin-inbox' }}                                collapsed={collapsed} badge={inboxUnread} />
              <NavItem item={{ label: 'Attendee Room',  icon: Monitor,  to: '/watch/webinar-2', target: '_blank' }}          collapsed={collapsed} />
              <NavItem item={{ label: 'Waiting Room',   icon: Clock,    to: '/watch/webinar-1', target: '_blank' }}          collapsed={collapsed} />
            </div>
          )}
          {collapsed && (
            <>
              <NavItem item={{ label: 'Live Room',      icon: Radio,    to: '/live-room' }}                                  collapsed={collapsed} />
              <NavItem item={{ label: 'Admin Inbox',    icon: Inbox,    to: '/admin-inbox' }}                                collapsed={collapsed} badge={inboxUnread} />
              <NavItem item={{ label: 'Attendee Room',  icon: Monitor,  to: '/watch/webinar-2', target: '_blank' }}          collapsed={collapsed} />
              <NavItem item={{ label: 'Waiting Room',   icon: Clock,    to: '/watch/webinar-1', target: '_blank' }}          collapsed={collapsed} />
            </>
          )}

          {!collapsed && (
            <div className="pt-4 mt-4 border-t border-white/8">
              <p className="px-3 text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                Quick Links
              </p>
              <a
                href="#"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-white/6 hover:text-slate-300 transition-all duration-150"
              >
                <Zap className="w-5 h-5 shrink-0" />
                <span>Integrations</span>
              </a>
              <a
                href="#"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-white/6 hover:text-slate-300 transition-all duration-150"
              >
                <HelpCircle className="w-5 h-5 shrink-0" />
                <span>Help & Support</span>
              </a>
            </div>
          )}
        </nav>

        {/* User section */}
        <div className={clsx(
          'shrink-0 border-t border-white/8 p-3',
          collapsed ? 'flex flex-col items-center gap-2' : ''
        )}>
          {collapsed ? (
            <button
              onClick={handleLogout}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-white/6 hover:text-slate-300 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/6 transition-colors">
              <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{user.name || 'User'}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-white/8 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center gap-4 px-6 shrink-0 z-30">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex-1 min-w-0" />

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full" />
            </button>
            <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
