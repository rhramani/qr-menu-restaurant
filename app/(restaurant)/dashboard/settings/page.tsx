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
      <main className="flex-1 p-4 lg:p-7 max-w-3xl animate-fade-in overflow-x-hidden">
        <div className="bg-surface-900 border border-slate-800 rounded-2xl p-5 lg:p-8 space-y-6 shadow-xl shadow-black/20">
          <div className="border-b border-slate-800 pb-5 mb-2">
            <h2 className="font-display text-xl font-bold text-slate-100">Restaurant Profile</h2>
            <p className="text-slate-500 text-xs mt-1">This information will be displayed on your digital menu.</p>
          </div>
          
          <div className="space-y-5">
            {field('Restaurant Name', 'name', 'text', 'e.g. The Grand Kitchen')}
            
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Description</label>
              <textarea className="input-base text-sm resize-none h-28" placeholder="Tell your customers about your restaurant..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {field('City', 'city', 'text', 'e.g. Mumbai')}
              {field('Phone Number', 'phone', 'tel', '+91 98765 43210')}
            </div>

            {field('Public Contact Email', 'email', 'email', 'contact@restaurant.com')}
            {field('Full Address', 'address', 'text', 'e.g. 123 Main Street, Area, City')}

            <div className="pt-4">
              <Button icon={<Save size={16} />} loading={saving} onClick={save} className="w-full sm:w-auto px-10 py-3.5">
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
