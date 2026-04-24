'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase/client'
import type { Restaurant } from '@/types'
import { Plus, Search, Building2, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react'
import { timeAgo } from '@/lib/utils'
import toast from 'react-hot-toast'
import { createRestaurantWithUser } from '@/app/actions/restaurants'

export default function RestaurantsPage() {
  const supabase = createClient()
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [newRestaurant, setNewRestaurant] = useState({ name: '', slug: '', city: '', email: '', res_pass: '' })
  const [creating, setCreating] = useState(false)

  async function fetchRestaurants() {
    const { data } = await supabase
      .from('restaurants')
      .select('*')
      .order('created_at', { ascending: false })
    setRestaurants(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchRestaurants() }, [])

  async function toggleStatus(restaurant: Restaurant) {
    const newStatus = restaurant.status === 'active' ? 'inactive' : 'active'
    const { error } = await supabase
      .from('restaurants')
      .update({ status: newStatus })
      .eq('id', restaurant.id)

    if (error) {
      toast.error('Failed to update status')
    } else {
      toast.success(`Restaurant ${newStatus === 'active' ? 'activated' : 'deactivated'}`)
      fetchRestaurants()
    }
  }

  async function createRestaurant() {
    if (!newRestaurant.name || !newRestaurant.slug || !newRestaurant.email || !newRestaurant.res_pass) {
      toast.error('Name, slug, email and password are required')
      return
    }
    setCreating(true)
    
    const result = await createRestaurantWithUser({
      name: newRestaurant.name,
      slug: newRestaurant.slug.toLowerCase().replace(/\s+/g, '-'),
      city: newRestaurant.city,
      email: newRestaurant.email,
      res_pass: newRestaurant.res_pass
    })

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Restaurant and Admin account created!')
      setShowModal(false)
      setNewRestaurant({ name: '', slug: '', city: '', email: '', res_pass: '' })
      fetchRestaurants()
    }
    setCreating(false)
  }

  const filtered = restaurants.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.city?.toLowerCase().includes(search.toLowerCase())
  )

  const statusVariant = (status: string) => {
    const m: Record<string, 'success' | 'warning' | 'default' | 'error'> = {
      active: 'success', trial: 'warning', inactive: 'default', suspended: 'error'
    }
    return m[status] ?? 'default'
  }

  return (
    <>
      <Header
        title="Restaurants"
        subtitle={`${restaurants.length} restaurant${restaurants.length !== 1 ? 's' : ''} on platform`}
        actions={
          <Button onClick={() => setShowModal(true)} icon={<Plus size={16} />}>
            Add Restaurant
          </Button>
        }
      />

      <main className="flex-1 p-7 animate-fade-in">
        {/* Search */}
        <div className="relative mb-5 max-w-sm">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search restaurants..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-base pl-9"
          />
        </div>

        {/* Table */}
        <div className="bg-surface-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left px-6 py-3.5 text-slate-500 font-medium text-xs uppercase tracking-wider">Restaurant</th>
                  <th className="text-left px-6 py-3.5 text-slate-500 font-medium text-xs uppercase tracking-wider">Slug</th>
                  <th className="text-left px-6 py-3.5 text-slate-500 font-medium text-xs uppercase tracking-wider">City</th>
                  <th className="text-left px-6 py-3.5 text-slate-500 font-medium text-xs uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3.5 text-slate-500 font-medium text-xs uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3.5 text-right text-slate-500 font-medium text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="px-6 py-4">
                        <div className="h-5 bg-slate-800 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-14 text-center text-slate-600">
                      {search ? 'No restaurants match your search.' : 'No restaurants yet. Add your first one.'}
                    </td>
                  </tr>
                ) : filtered.map(r => (
                  <tr key={r.id} className="table-row-hover">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                          <Building2 size={15} className="text-brand-400" />
                        </div>
                        <div>
                          <p className="text-slate-100 font-medium leading-tight">{r.name}</p>
                          <p className="text-slate-600 text-xs">{r.email ?? '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-slate-400 bg-slate-800 px-2 py-0.5 rounded text-xs">{r.slug}</code>
                    </td>
                    <td className="px-6 py-4 text-slate-400">{r.city ?? '—'}</td>
                    <td className="px-6 py-4">
                      <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{timeAgo(r.created_at)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggleStatus(r)}
                          className="text-slate-500 hover:text-brand-400 transition-colors"
                          title={r.status === 'active' ? 'Deactivate' : 'Activate'}
                        >
                          {r.status === 'active' ? <ToggleRight size={20} className="text-green-400" /> : <ToggleLeft size={20} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-surface-900 border border-slate-800 rounded-2xl p-7 w-full max-w-md shadow-premium animate-slide-up">
            <h2 className="font-display text-xl font-semibold text-slate-100 mb-1.5">Add Restaurant</h2>
            <p className="text-slate-500 text-sm mb-6">Create a new restaurant on the platform</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Restaurant Name *</label>
                <input
                  className="input-base"
                  placeholder="The Grand Kitchen"
                  value={newRestaurant.name}
                  onChange={e => {
                    const name = e.target.value
                    setNewRestaurant(prev => ({
                      ...prev,
                      name,
                      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                    }))
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Slug *</label>
                <input
                  className="input-base"
                  placeholder="the-grand-kitchen"
                  value={newRestaurant.slug}
                  onChange={e => setNewRestaurant(prev => ({ ...prev, slug: e.target.value }))}
                />
                <p className="text-xs text-slate-600 mt-1">Menu URL: /menu/{newRestaurant.slug || 'your-slug'}/...</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">City</label>
                  <input className="input-base" placeholder="Mumbai" value={newRestaurant.city} onChange={e => setNewRestaurant(prev => ({ ...prev, city: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Email *</label>
                  <input className="input-base" placeholder="owner@..." type="email" value={newRestaurant.email} onChange={e => setNewRestaurant(prev => ({ ...prev, email: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Admin Password *</label>
                <input
                  className="input-base"
                  type="password"
                  placeholder="••••••••"
                  value={newRestaurant.res_pass}
                  onChange={e => setNewRestaurant(prev => ({ ...prev, res_pass: e.target.value }))}
                />
                <p className="text-xs text-slate-600 mt-1">This will be used by the restaurant admin to login.</p>
              </div>
            </div>

            <div className="flex gap-3 mt-7">
              <Button variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1" loading={creating} onClick={createRestaurant}>Create Restaurant</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
