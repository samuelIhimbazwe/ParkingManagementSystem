import { useEffect, useState } from 'react'
import api from '../../../api'
import { dataTableShell, tableBodyRow, tableHeadRow } from '../../../lib/dataDisplayThemes'

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/api/admin/Users')
      setUsers(data || [])
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load users.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const toggleUser = async (id, active) => {
    try {
      await api.post(`/api/admin/Users/${id}/active`, { active })
      await load()
    } catch (err) {
      setError(err.response?.data?.error || 'Update failed.')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-blue-950 dark:text-white">Users</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">View accounts and activate or deactivate access.</p>
      </div>
      {error ? (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      ) : null}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent dark:border-cyan-500" />
        </div>
      ) : (
        <div className={dataTableShell('violet')}>
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className={tableHeadRow('violet')}>
                <th className="p-3">Email</th>
                <th className="p-3">Roles</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const lockedOut = u.lockoutEnd && new Date(u.lockoutEnd) > new Date()
                return (
                  <tr key={u.id} className={tableBodyRow('violet')}>
                    <td className="p-3 text-slate-900 dark:text-white">{u.email}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">{(u.roles || []).join(', ')}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">{lockedOut ? 'Locked' : 'Active'}</td>
                    <td className="p-3 text-right">
                      {lockedOut ? (
                        <button
                          type="button"
                          onClick={() => void toggleUser(u.id, true)}
                          className="text-xs text-emerald-400 hover:underline"
                        >
                          Activate
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void toggleUser(u.id, false)}
                          className="text-xs text-amber-400 hover:underline"
                        >
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {users.length === 0 ? <p className="p-6 text-center text-slate-500">No users.</p> : null}
        </div>
      )}
    </div>
  )
}
