'use client'

import { useEffect, useState } from 'react'
import { redirect } from 'next/navigation'
import Header from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase/client'
import type { Category, MenuItem } from '@/types'
import { Plus, Pencil, Trash2, Leaf, Search, X } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'

type Tab = 'items' | 'categories'

export default function MenuPage() {
  const supabase = createClient()
  const [tab, setTab] = useState<Tab>('items')
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showItemModal, setShowItemModal] = useState(false)
  const [showCatModal, setShowCatModal] = useState(false)
  const [editItem, setEditItem] = useState<MenuItem | null>(null)
  const [saving, setSaving] = useState(false)

  const [itemForm, setItemForm] = useState({
    name: '', description: '', price: '', category_id: '', is_vegetarian: false, is_available: true,
  })
  const [catName, setCatName] = useState('')

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('restaurant_id').eq('id', user.id).single()
      if (!profile?.restaurant_id) return
      setRestaurantId(profile.restaurant_id)
      await fetchData(profile.restaurant_id)
    }
    init()
  }, [])

  async function fetchData(rid: string) {
    const [{ data: cats }, { data: menuItems }] = await Promise.all([
      supabase.from('categories').select('*').eq('restaurant_id', rid).order('sort_order'),
      supabase.from('menu_items').select('*').eq('restaurant_id', rid).order('sort_order'),
    ])
    setCategories(cats ?? [])
    setItems(menuItems ?? [])
    setLoading(false)
  }

  function openAddItem() {
    setEditItem(null)
    setItemForm({ name: '', description: '', price: '', category_id: '', is_vegetarian: false, is_available: true })
    setShowItemModal(true)
  }

  function openEditItem(item: MenuItem) {
    setEditItem(item)
    setItemForm({
      name: item.name,
      description: item.description ?? '',
      price: item.price.toString(),
      category_id: item.category_id ?? '',
      is_vegetarian: item.is_vegetarian,
      is_available: item.is_available,
    })
    setShowItemModal(true)
  }

  async function saveItem() {
    if (!restaurantId || !itemForm.name || !itemForm.price) {
      toast.error('Name and price are required')
      return
    }
    setSaving(true)
    const payload = {
      restaurant_id: restaurantId,
      name: itemForm.name,
      description: itemForm.description || null,
      price: parseFloat(itemForm.price),
      category_id: itemForm.category_id || null,
      is_vegetarian: itemForm.is_vegetarian,
      is_available: itemForm.is_available,
    }
    const { error } = editItem
      ? await supabase.from('menu_items').update(payload).eq('id', editItem.id)
      : await supabase.from('menu_items').insert(payload)

    if (error) toast.error(error.message)
    else {
      toast.success(editItem ? 'Item updated' : 'Item added to menu')
      setShowItemModal(false)
      fetchData(restaurantId)
    }
    setSaving(false)
  }

  async function deleteItem(id: string) {
    if (!confirm('Delete this menu item?')) return
    const { error } = await supabase.from('menu_items').delete().eq('id', id)
    if (error) toast.error(error.message)
    else { toast.success('Item deleted'); restaurantId && fetchData(restaurantId) }
  }

  async function saveCategory() {
    if (!restaurantId || !catName) return
    setSaving(true)
    const { error } = await supabase.from('categories').insert({ restaurant_id: restaurantId, name: catName })
    if (error) toast.error(error.message)
    else { toast.success('Category created'); setShowCatModal(false); setCatName(''); fetchData(restaurantId) }
    setSaving(false)
  }

  const filteredItems = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))

  const getCategoryName = (catId: string | null) =>
    categories.find(c => c.id === catId)?.name ?? '—'

  return (
    <>
      <Header
        title="Menu"
        subtitle={`${items.length} items across ${categories.length} categories`}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={() => setShowCatModal(true)}>
              Category
            </Button>
            <Button size="sm" icon={<Plus size={14} />} onClick={openAddItem}>
              Add Item
            </Button>
          </div>
        }
      />

      <main className="flex-1 p-7 animate-fade-in">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-surface-950 border border-slate-800 rounded-lg w-fit mb-6">
          {(['items', 'categories'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all capitalize ${
                tab === t ? 'bg-surface-800 text-slate-100 shadow-sm' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'items' && (
          <>
            {/* Search */}
            <div className="relative max-w-sm mb-5">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input className="input-base pl-9 pr-8" placeholder="Search menu items..." value={search} onChange={e => setSearch(e.target.value)} />
              {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"><X size={14} /></button>}
            </div>

            <div className="bg-surface-900 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left px-6 py-3.5 text-slate-500 font-medium text-xs uppercase tracking-wider">Item</th>
                    <th className="text-left px-6 py-3.5 text-slate-500 font-medium text-xs uppercase tracking-wider">Category</th>
                    <th className="text-left px-6 py-3.5 text-slate-500 font-medium text-xs uppercase tracking-wider">Price</th>
                    <th className="text-left px-6 py-3.5 text-slate-500 font-medium text-xs uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3.5 text-right text-slate-500 font-medium text-xs uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}><td colSpan={5} className="px-6 py-4"><div className="h-5 bg-slate-800 rounded animate-pulse" /></td></tr>
                    ))
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-14 text-center">
                        <div className="text-slate-700">
                          <p className="font-medium text-slate-500">No menu items yet</p>
                          <p className="text-sm mt-1">Add your first item to get started</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredItems.map(item => (
                    <tr key={item.id} className="table-row-hover">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {item.is_vegetarian && <Leaf size={14} className="text-green-400 flex-shrink-0" />}
                          <div>
                            <p className="text-slate-100 font-medium">{item.name}</p>
                            {item.description && <p className="text-slate-600 text-xs mt-0.5 max-w-[240px] truncate">{item.description}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-400">{getCategoryName(item.category_id)}</td>
                      <td className="px-6 py-4 text-slate-100 font-medium font-mono">{formatCurrency(item.price)}</td>
                      <td className="px-6 py-4">
                        <Badge variant={item.is_available ? 'success' : 'default'}>
                          {item.is_available ? 'Available' : 'Unavailable'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => openEditItem(item)} className="p-1.5 text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 rounded-lg transition-colors">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => deleteItem(item.id)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === 'categories' && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(cat => (
              <div key={cat.id} className="bg-surface-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-slate-100">{cat.name}</h3>
                  <Badge variant={cat.is_active ? 'success' : 'default'}>{cat.is_active ? 'Active' : 'Hidden'}</Badge>
                </div>
                <p className="text-slate-500 text-sm">{items.filter(i => i.category_id === cat.id).length} items</p>
              </div>
            ))}
            {categories.length === 0 && (
              <div className="col-span-3 py-14 text-center text-slate-600">No categories yet. Add one to organize your menu.</div>
            )}
          </div>
        )}
      </main>

      {/* Add/Edit Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-surface-900 border border-slate-800 rounded-2xl p-7 w-full max-w-md shadow-premium animate-slide-up">
            <h2 className="font-display text-xl font-semibold text-slate-100 mb-6">{editItem ? 'Edit Item' : 'Add Menu Item'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Item Name *</label>
                <input className="input-base" placeholder="Paneer Tikka" value={itemForm.name} onChange={e => setItemForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
                <textarea className="input-base resize-none h-20" placeholder="Marinated cottage cheese..." value={itemForm.description} onChange={e => setItemForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Price (₹) *</label>
                  <input type="number" className="input-base" placeholder="299" value={itemForm.price} onChange={e => setItemForm(p => ({ ...p, price: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Category</label>
                  <select className="input-base" value={itemForm.category_id} onChange={e => setItemForm(p => ({ ...p, category_id: e.target.value }))}>
                    <option value="">Uncategorized</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-5">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded accent-brand-500" checked={itemForm.is_vegetarian} onChange={e => setItemForm(p => ({ ...p, is_vegetarian: e.target.checked }))} />
                  <span className="text-sm text-slate-400 flex items-center gap-1.5"><Leaf size={13} className="text-green-400" /> Vegetarian</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded accent-brand-500" checked={itemForm.is_available} onChange={e => setItemForm(p => ({ ...p, is_available: e.target.checked }))} />
                  <span className="text-sm text-slate-400">Available</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-7">
              <Button variant="secondary" className="flex-1" onClick={() => setShowItemModal(false)}>Cancel</Button>
              <Button className="flex-1" loading={saving} onClick={saveItem}>{editItem ? 'Save Changes' : 'Add Item'}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-surface-900 border border-slate-800 rounded-2xl p-7 w-full max-w-sm shadow-premium animate-slide-up">
            <h2 className="font-display text-xl font-semibold text-slate-100 mb-5">New Category</h2>
            <input className="input-base mb-5" placeholder="e.g. Starters, Mains, Desserts" value={catName} onChange={e => setCatName(e.target.value)} />
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setShowCatModal(false)}>Cancel</Button>
              <Button className="flex-1" loading={saving} onClick={saveCategory}>Create</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
