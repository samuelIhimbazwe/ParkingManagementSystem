import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(email, password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const d = err.response?.data
      setError(d?.error || d?.errors?.join?.(' ') || 'Invalid login attempt.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex justify-center py-12">
      <div className="w-full max-w-md rounded-3xl border border-blue-100 bg-white/95 p-8 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70 dark:shadow-2xl">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-blue-950 dark:text-white">Welcome back</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Sign in to open your role-based dashboard.</p>
        </div>

        {error ? (
          <div className="mb-6 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-center text-sm text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-400">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/20"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-400">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-cyan-500 dark:focus:ring-cyan-500/20"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-blue-800 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:brightness-110 disabled:opacity-50 dark:from-cyan-600 dark:to-blue-600 dark:shadow-blue-500/20"
          >
            {loading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
          New here?{' '}
          <Link to="/register" className="font-medium text-blue-700 hover:text-blue-900 dark:text-cyan-400 dark:hover:text-cyan-300">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}
