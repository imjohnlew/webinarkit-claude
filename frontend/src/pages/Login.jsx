import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, Radio, ArrowRight } from 'lucide-react'
import { Button } from '../components/ui/Button'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Stub: simulate login — in prod this would call POST /api/auth/login
      await new Promise((r) => setTimeout(r, 800))

      if (!form.email || !form.password) {
        setError('Please enter your email and password.')
        setLoading(false)
        return
      }

      // Store fake JWT and user info
      const fakeToken = btoa(JSON.stringify({ sub: 1, email: form.email, iat: Date.now() }))
      const userName = form.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

      localStorage.setItem('auth_token', fakeToken)
      localStorage.setItem('auth_user', JSON.stringify({ name: userName, email: form.email }))

      navigate('/')
    } catch (err) {
      setError('Invalid email or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 bg-slate-900 flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/4 -right-1/4 w-[600px] h-[600px] bg-brand-600/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
        </div>

        <div className="relative z-10 max-w-md text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-12">
            <div className="w-12 h-12 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-600/30">
              <Radio className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-2xl font-bold tracking-tight">WebinarKit</span>
          </div>

          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Run webinars that
            <span className="block text-brand-400">actually convert</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Automated webinar funnels, real-time engagement, and deep analytics — all in one platform.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-12">
            {[
              { value: '50K+', label: 'Webinars hosted' },
              { value: '2.4M', label: 'Attendees served' },
              { value: '96%', label: 'Satisfaction rate' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <Radio className="w-4 h-4 text-white" />
            </div>
            <span className="text-slate-900 text-lg font-bold">WebinarKit</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
            <p className="text-slate-500 mt-1.5 text-sm">Sign in to your account to continue</p>
          </div>

          {/* Demo hint */}
          <div className="mb-6 p-3.5 bg-brand-50 border border-brand-100 rounded-xl">
            <p className="text-xs text-brand-700">
              <span className="font-semibold">Demo mode:</span> Enter any email and password to sign in.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="block w-full pl-10 pr-4 py-2.5 text-sm text-slate-900 bg-white border border-slate-200 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <a href="#" className="text-xs text-brand-600 hover:text-brand-700 font-medium">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="block w-full pl-10 pr-10 py-2.5 text-sm text-slate-900 bg-white border border-slate-200 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full"
              iconRight={!loading ? ArrowRight : undefined}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <a href="#" className="text-brand-600 hover:text-brand-700 font-medium">
              Start free trial
            </a>
          </p>

          {/* Divider */}
          <div className="relative mt-8 mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs text-slate-400 bg-white px-3">
              Or continue with
            </div>
          </div>

          {/* Social logins */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: 'Google', icon: 'G' },
              { name: 'Microsoft', icon: 'M' },
            ].map((provider) => (
              <button
                key={provider.name}
                type="button"
                className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors"
              >
                <span className="w-4 h-4 flex items-center justify-center text-xs font-bold text-slate-500">
                  {provider.icon}
                </span>
                {provider.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
