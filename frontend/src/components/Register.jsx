import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { register } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await register({ email, password, fullName })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const d = err.response?.data
      if (Array.isArray(d?.errors)) setError(d.errors.join(' '))
      else setError(d?.error || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex justify-center py-12">
      <div className="w-full max-w-md rounded-3xl border border-blue-100 bg-white/95 p-8 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70 dark:shadow-2xl">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-blue-950 dark:text-white">Create your account</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">You&apos;ll be assigned the Driver role with booking access.</p>
        </div>

        {error ? (
          <div className="mb-6 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-center text-sm text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-400">Full name (optional)</label>
            <input
              type="text"
              value={fullName}
              required
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-emerald-500 dark:focus:ring-emerald-500/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-400">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-emerald-500 dark:focus:ring-emerald-500/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-400">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-emerald-500 dark:focus:ring-emerald-500/20"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">8+ chars with upper, lower, number, and symbol.</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-400">Confirm Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-emerald-500 dark:focus:ring-emerald-500/20"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">8+ chars with upper, lower, number, and symbol.</p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-green-600 to-green-800 py-3 text-md font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:brightness-110 disabled:opacity-50 dark:from-emerald-600 dark:to-teal-600 dark:shadow-emerald-500/20"
          >
            {loading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : 'Register'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-blue-700 hover:text-blue-900 dark:text-emerald-400 dark:hover:text-emerald-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
