'use client'

import { useEffect, useState } from 'react'
import { UserPlus, RefreshCw, ShieldCheck, User, Phone, Mail } from 'lucide-react'

type StaffProfile = {
  id: string
  full_name: string
  email: string
  phone: string
  role: 'admin' | 'staff'
  is_active: boolean
  created_at: string
}

export default function TeamPage() {
  const [profiles, setProfiles] = useState<StaffProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<'staff' | 'admin'>('staff')

  async function loadTeam() {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/team')

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load team.')
      }

      setProfiles(data.profiles ?? [])
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load team.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTeam()
  }, [])

  async function handleAddStaff(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    setSubmitting(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          role,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to invite staff member.')
      }

      setMessage('Invitation sent successfully.')

      setFullName('')
      setEmail('')
      setPhone('')
      setRole('staff')
      setShowAddForm(false)

      await loadTeam()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to invite staff member.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="page-container">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-stone-900">
            Team
          </h1>

          <p className="text-sm text-stone-500 mt-1">
            Manage Tentwood Trips staff accounts.
          </p>
        </div>

        <button
          onClick={() => {
            setShowAddForm((current) => !current)
            setError('')
            setMessage('')
          }}
          className="inline-flex items-center gap-1 bg-stone-900 text-white px-4 py-2.5 rounded-lg text-center font-medium hover:bg-stone-800 transition-colors"
        >
          <UserPlus size={20} />
          Add Staff
        </button>
      </div>

      {/* Messages */}
      {message && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Add Staff */}
      {showAddForm && (
        <div className="bg-white border border-stone-200 rounded-xl p-5 mb-6">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-stone-900">
              Add Staff Member
            </h2>

            <p className="text-sm text-stone-500 mt-1">
              An invitation will be sent to the email address.
            </p>
          </div>

          <form
            onSubmit={handleAddStaff}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                Full name
              </label>

              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Staff member name"
                className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="staff@example.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                Phone
              </label>

              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="+91 XXXXX XXXXX"
                className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                Role
              </label>

              <select
                value={role}
                onChange={(e) =>
                  setRole(e.target.value as 'staff' | 'admin')
                }
                className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
              >
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="md:col-span-2 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2.5 rounded-lg border border-stone-300 text-sm font-medium text-stone-700 hover:bg-stone-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2.5 rounded-lg bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Sending invitation...' : 'Send Invitation'}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* Team list */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">

        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-stone-900">
              Team Members
            </h2>

            <p className="text-xs text-stone-500 mt-0.5">
              {profiles.length} member{profiles.length === 1 ? '' : 's'}
            </p>
          </div>

          <button
            onClick={loadTeam}
            disabled={loading}
            className="p-2 rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-900 disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw
              size={16}
              className={loading ? 'animate-spin' : ''}
            />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-stone-500">
            Loading team...
          </div>
        ) : profiles.length === 0 ? (
          <div className="p-8 text-center">
            <User size={28} className="mx-auto text-stone-300 mb-2" />

            <p className="text-sm font-medium text-stone-700">
              No team members found.
            </p>

            <p className="text-xs text-stone-400 mt-1">
              Add your first staff member above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">
                    Name
                  </th>

                  <th className="text-left px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">
                    Email
                  </th>

                  <th className="text-left px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">
                    Phone
                  </th>

                  <th className="text-left px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">
                    Role
                  </th>

                  <th className="text-left px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-stone-100">
                {profiles.map((profile) => (
                  <tr key={profile.id} className="hover:bg-stone-50">

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center">
                          <User size={16} className="text-stone-500" />
                        </div>

                        <div>
                          <p className="text-sm font-medium text-stone-900">
                            {profile.full_name || 'Unnamed'}
                          </p>

                          <p className="text-xs text-stone-400">
                            {new Date(profile.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-sm text-stone-600">
                        <Mail size={14} className="text-stone-400" />
                        {profile.email || '—'}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-sm text-stone-600">
                        <Phone size={14} className="text-stone-400" />
                        {profile.phone || '—'}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      {profile.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-medium">
                          <ShieldCheck size={13} />
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 text-xs font-medium">
                          <User size={13} />
                          Staff
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      {profile.is_active ? (
                        <span className="inline-flex px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-xs font-medium">
                          Inactive
                        </span>
                      )}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </main>
  )
}