'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import type { Restaurant } from '@/types'
import { Save } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const supabase = createClient()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [form, setForm] = useState({ name: '', description: '', address: '', city: '', phone: '', email: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('restaurant_id').eq('id', user.id).single()
      if (!profile?.restaurant_id) return
      const { data: rest } = await supabase.from('restaurants').select('*').eq('id', profile.restaurant_id).single()
      if (rest) {
        setRestaurant(rest)
        setForm({
          name: rest.name,
          description: rest.description ?? '',
          address: rest.address ?? '',
          city: rest.city ?? '',
          phone: rest.phone ?? '',
          email: rest.email ?? '',
        })
      }
    }
    load()
  }, [])

  async function save() {
    if (!restaurant) return
    setSaving(true)
    const { error } = await supabase.from('restaurants').update({
      name: form.name,
      description: form.description || null,
      address: form.address || null,
      city: form.city || null,
      phone: form.phone || null,
      email: form.email || null,
    }).eq('id', restaurant.id)

    if (error) toast.error(error.message)
    else toast.success('Settings saved')
    setSaving(false)
  }

  const field = (label: string, key: keyof typeof form, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
      <input
        type={type}
        className="input-base"
        placeholder={placeholder}
        value={form[key]}
        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
      />
    </div>
  )

  return (
    <>
      <Header title="Settings" subtitle="Manage your restaurant profile" />
      <main className="flex-1 p-7 max-w-2xl animate-fade-in">
        <div className="bg-surface-900 border border-slate-800 rounded-xl p-7 space-y-5">
          <h2 className="font-semibold text-slate-100 text-lg border-b border-slate-800 pb-4 mb-2">Restaurant Profile</h2>
          {field('Restaurant Name', 'name', 'text', 'The Grand Kitchen')}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
            <textarea className="input-base resize-none h-24" placeholder="A brief description..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {field('City', 'city', 'text', 'Mumbai')}
            {field('Phone', 'phone', 'tel', '+91 98765 43210')}
          </div>
          {field('Contact Email', 'email', 'email', 'contact@restaurant.com')}
          {field('Address', 'address', 'text', '123 Main Street, ...')}

          <div className="pt-2">
            <Button icon={<Save size={16} />} loading={saving} onClick={save}>Save Changes</Button>
          </div>
        </div>
      </main>
    </>
  )
}
