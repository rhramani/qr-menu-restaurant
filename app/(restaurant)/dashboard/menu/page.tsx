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
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={() => setShowCatModal(true)} className="whitespace-nowrap">
              <span className="hidden sm:inline">Category</span>
            </Button>
            <Button size="sm" icon={<Plus size={14} />} onClick={openAddItem} className="whitespace-nowrap">
              <span className="hidden sm:inline">Add Item</span>
              <span className="sm:hidden text-xs">Add</span>
            </Button>
          </div>
        }
      />

      <main className="flex-1 p-4 lg:p-7 animate-fade-in overflow-x-hidden">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-surface-950 border border-slate-800 rounded-lg w-fit mb-6">
          {(['items', 'categories'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 text-xs lg:text-sm font-medium rounded-md transition-all capitalize ${
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
            <div className="relative max-w-sm mb-6">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input className="input-base pl-10 pr-10" placeholder="Search menu items..." value={search} onChange={e => setSearch(e.target.value)} />
              {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"><X size={14} /></button>}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-surface-900 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left px-6 py-4 text-slate-500 font-medium text-xs uppercase tracking-wider">Item</th>
                    <th className="text-left px-6 py-4 text-slate-500 font-medium text-xs uppercase tracking-wider">Category</th>
                    <th className="text-left px-6 py-4 text-slate-500 font-medium text-xs uppercase tracking-wider">Price</th>
                    <th className="text-left px-6 py-4 text-slate-500 font-medium text-xs uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-right text-slate-500 font-medium text-xs uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}><td colSpan={5} className="px-6 py-5"><div className="h-5 bg-slate-800/50 rounded animate-pulse" /></td></tr>
                    ))
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center">
                        <div className="text-slate-700">
                          <p className="font-medium text-slate-500 text-base">No menu items yet</p>
                          <p className="text-sm mt-1">Add your first item to get started</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredItems.map(item => (
                    <tr key={item.id} className="table-row-hover">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {item.is_vegetarian && <Leaf size={14} className="text-green-400 flex-shrink-0" />}
                          <div className="min-w-0">
                            <p className="text-slate-100 font-medium truncate">{item.name}</p>
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
                          <button onClick={() => openEditItem(item)} className="p-2 text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 rounded-lg transition-colors">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => deleteItem(item.id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-28 bg-surface-900 border border-slate-800 rounded-xl animate-pulse" />
                ))
              ) : filteredItems.length === 0 ? (
                <div className="py-20 text-center bg-surface-900 border border-slate-800 rounded-xl">
                  <p className="text-slate-500 font-medium">No items found</p>
                </div>
              ) : filteredItems.map(item => (
                <div key={item.id} className="bg-surface-900 border border-slate-800 rounded-xl p-4 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-2.5">
                      {item.is_vegetarian && <Leaf size={14} className="text-green-400 mt-0.5 flex-shrink-0" />}
                      <div>
                        <h4 className="text-slate-100 font-medium leading-tight">{item.name}</h4>
                        <p className="text-slate-500 text-[10px] mt-1">{getCategoryName(item.category_id)}</p>
                      </div>
                    </div>
                    <span className="text-slate-100 font-bold font-mono text-sm">{formatCurrency(item.price)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between pt-1">
                    <Badge variant={item.is_available ? 'success' : 'default'}>
                      {item.is_available ? 'Available' : 'Unavailable'}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEditItem(item)} className="w-9 h-9 flex items-center justify-center text-slate-400 bg-slate-800 rounded-lg">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => deleteItem(item.id)} className="w-9 h-9 flex items-center justify-center text-red-400 bg-red-400/10 rounded-lg">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'categories' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(cat => (
              <div key={cat.id} className="bg-surface-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 transition-colors group">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-slate-100 group-hover:text-brand-400 transition-colors">{cat.name}</h3>
                  <Badge variant={cat.is_active ? 'success' : 'default'}>{cat.is_active ? 'Active' : 'Hidden'}</Badge>
                </div>
                <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-semibold text-slate-600">
                  <span>{items.filter(i => i.category_id === cat.id).length} items</span>
                  <button className="text-slate-700 hover:text-slate-400 transition-colors">Edit →</button>
                </div>
              </div>
            ))}
            {categories.length === 0 && (
              <div className="col-span-full py-20 text-center text-slate-600 bg-surface-950/30 border border-dashed border-slate-800 rounded-2xl">
                No categories yet. Add one to organize your menu.
              </div>
            )}
          </div>
        )}
      </main>

      {/* Add/Edit Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4 py-6 overflow-y-auto">
          <div className="bg-surface-900 border border-slate-800 rounded-2xl p-6 lg:p-8 w-full max-w-md shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-display text-xl font-bold text-slate-100">{editItem ? 'Edit Menu Item' : 'New Menu Item'}</h2>
              <button onClick={() => setShowItemModal(false)} className="text-slate-500 hover:text-slate-200">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Item Name *</label>
                <input className="input-base text-sm" placeholder="e.g. Classic Margherita Pizza" value={itemForm.name} onChange={e => setItemForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Description</label>
                <textarea className="input-base text-sm resize-none h-24" placeholder="Fresh basil, mozzarella, and tomatoes..." value={itemForm.description} onChange={e => setItemForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Price (₹) *</label>
                  <input type="number" className="input-base text-sm font-mono" placeholder="299" value={itemForm.price} onChange={e => setItemForm(p => ({ ...p, price: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Category</label>
                  <select className="input-base text-sm" value={itemForm.category_id} onChange={e => setItemForm(p => ({ ...p, category_id: e.target.value }))}>
                    <option value="">Uncategorized</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-3 pt-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${itemForm.is_vegetarian ? 'bg-green-500/20 border-green-500' : 'border-slate-700 group-hover:border-slate-500'}`}>
                    {itemForm.is_vegetarian && <div className="w-2 h-2 rounded-full bg-green-500" />}
                  </div>
                  <input type="checkbox" className="hidden" checked={itemForm.is_vegetarian} onChange={e => setItemForm(p => ({ ...p, is_vegetarian: e.target.checked }))} />
                  <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">Vegetarian</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${itemForm.is_available ? 'bg-brand-500/20 border-brand-500' : 'border-slate-700 group-hover:border-slate-500'}`}>
                    {itemForm.is_available && <div className="w-2 h-2 rounded-full bg-brand-500" />}
                  </div>
                  <input type="checkbox" className="hidden" checked={itemForm.is_available} onChange={e => setItemForm(p => ({ ...p, is_available: e.target.checked }))} />
                  <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">Available for Order</span>
                </label>
              </div>
            </div>
            
            <div className="flex gap-3 mt-10">
              <Button variant="secondary" className="flex-1" onClick={() => setShowItemModal(false)}>Discard</Button>
              <Button className="flex-1" loading={saving} onClick={saveItem}>{editItem ? 'Save Changes' : 'Create Item'}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4">
          <div className="bg-surface-900 border border-slate-800 rounded-2xl p-6 lg:p-8 w-full max-w-sm shadow-2xl animate-scale-up">
            <h2 className="font-display text-xl font-bold text-slate-100 mb-6">New Category</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Category Name</label>
                <input className="input-base text-sm" placeholder="e.g. Desserts, Starters..." value={catName} onChange={e => setCatName(e.target.value)} autoFocus />
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setShowCatModal(false)}>Cancel</Button>
                <Button className="flex-1" loading={saving} onClick={saveCategory}>Create</Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  )
}
