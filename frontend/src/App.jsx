import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import WebinarsList from './pages/WebinarsList'
import WebinarDetail from './pages/WebinarDetail'
import Analytics from './pages/Analytics'
import LiveRoom from './pages/LiveRoom'
import WatchRoom from './pages/WatchRoom'
import AdminInbox from './pages/AdminInbox'

function RequireAuth({ children }) {
  const token = localStorage.getItem('auth_token')
  if (!token) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="webinars" element={<WebinarsList />} />
        <Route path="webinars/:webinarId" element={<WebinarDetail />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="analytics/:webinarId" element={<Analytics />} />
        <Route path="live-room" element={<LiveRoom />} />
      </Route>
      {/* Public watch room — no auth required */}
      <Route path="/watch/:webinarId" element={<WatchRoom />} />
      {/* Admin inbox — standalone full-page, auth required */}
      <Route path="/admin-inbox" element={<RequireAuth><AdminInbox /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
