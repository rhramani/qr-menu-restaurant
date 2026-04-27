'use client'

import { useEffect, useRef, useState } from 'react'
import Header from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase/client'
import type { RestaurantTable, QRCode } from '@/types'
import { Plus, QrCode, Download, Trash2, Users, X } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import toast from 'react-hot-toast'

interface TableWithQR extends RestaurantTable {
  qr_codes: QRCode | null
}

export default function TablesPage() {
  const supabase = createClient()
  const [tables, setTables] = useState<TableWithQR[]>([])
  const [loading, setLoading] = useState(true)
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [restaurantSlug, setRestaurantSlug] = useState<string>('')
  const [showModal, setShowModal] = useState(false)
  const [showQRModal, setShowQRModal] = useState<TableWithQR | null>(null)
  const [tableForm, setTableForm] = useState({ table_number: '', capacity: '4', floor: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from('profiles').select('restaurant_id').eq('id', user.id).single()
      if (!profile?.restaurant_id) return
      setRestaurantId(profile.restaurant_id)

      const { data: restaurant } = await supabase
        .from('restaurants').select('slug').eq('id', profile.restaurant_id).single()
      setRestaurantSlug(restaurant?.slug ?? '')

      await fetchTables(profile.restaurant_id)
    }
    init()
  }, [])

  async function fetchTables(rid: string) {
    const { data } = await supabase
      .from('restaurant_tables')
      .select('*, qr_codes(*)')
      .eq('restaurant_id', rid)
      .order('table_number')
    setTables((data ?? []) as TableWithQR[])
    setLoading(false)
  }

  async function addTable() {
    if (!restaurantId || !tableForm.table_number) {
      toast.error('Table number is required')
      return
    }
    setSaving(true)
    const { data: table, error } = await supabase
      .from('restaurant_tables')
      .insert({
        restaurant_id: restaurantId,
        table_number: tableForm.table_number,
        capacity: parseInt(tableForm.capacity) || 4,
        floor: tableForm.floor || null,
      })
      .select()
      .single()

    if (error) {
      toast.error(error.message)
    } else if (table) {
      // Auto-generate QR code
      await supabase.from('qr_codes').insert({
        restaurant_id: restaurantId,
        table_id: table.id,
      })
      toast.success(`Table ${tableForm.table_number} added with QR code`)
      setShowModal(false)
      setTableForm({ table_number: '', capacity: '4', floor: '' })
      fetchTables(restaurantId)
    }
    setSaving(false)
  }

  async function deleteTable(tableId: string) {
    if (!confirm('Delete this table and its QR code?')) return
    const { error } = await supabase.from('restaurant_tables').delete().eq('id', tableId)
    if (error) toast.error(error.message)
    else { toast.success('Table deleted'); restaurantId && fetchTables(restaurantId) }
  }

  function getQRUrl(table: TableWithQR) {
    if (!table.qr_codes) return ''
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin
    return `${baseUrl}/menu/${restaurantSlug}/${table.id}`
  }

  function downloadQR(tableNumber: string) {
    const svg = document.getElementById(`qr-${tableNumber}`)
    if (!svg) return
    const svgData = new XMLSerializer().serializeToString(svg)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `qr-table-${tableNumber}.svg`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('QR code downloaded')
  }

  return (
    <>
      <Header
        title="Tables & QR Codes"
        subtitle={`${tables.length} tables configured`}
        actions={
          <Button icon={<Plus size={16} />} onClick={() => setShowModal(true)} size="sm">
            <span className="hidden sm:inline">Add Table</span>
            <span className="sm:hidden text-xs">Add</span>
          </Button>
        }
      />

      <main className="flex-1 p-4 lg:p-7 animate-fade-in overflow-x-hidden">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 bg-surface-800/50 rounded-xl animate-pulse border border-slate-800/50" />
            ))}
          </div>
        ) : tables.length === 0 ? (
          <div className="py-24 text-center">
            <QrCode size={40} className="text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 font-medium mb-1">No tables yet</p>
            <p className="text-slate-600 text-sm mb-6">Add tables and QR codes will be auto-generated</p>
            <Button onClick={() => setShowModal(true)} icon={<Plus size={16} />}>Create First Table</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {tables.map(table => (
              <div
                key={table.id}
                className="bg-surface-900 border border-slate-800 hover:border-brand-500/30 rounded-xl p-5 transition-all duration-300 group shadow-lg shadow-black/20"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-100 text-lg group-hover:text-brand-400 transition-colors truncate">Table {table.table_number}</h3>
                    <div className="flex items-center gap-1.5 text-slate-500 text-xs mt-1 font-medium">
                      <Users size={12} className="text-slate-600" />
                      <span>{table.capacity} seats</span>
                      {table.floor && <><span>·</span><span className="truncate">{table.floor}</span></>}
                    </div>
                  </div>
                  <Badge variant={table.is_active ? 'success' : 'default'}>
                    {table.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                {/* QR preview */}
                <div
                  className="bg-white rounded-xl p-4 flex items-center justify-center mb-5 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm"
                  onClick={() => setShowQRModal(table)}
                >
                  {table.qr_codes ? (
                    <QRCodeSVG
                      value={typeof window !== 'undefined' ? getQRUrl(table) : `table-${table.id}`}
                      size={120}
                      level="H"
                      includeMargin={false}
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gray-100 rounded flex items-center justify-center">
                      <QrCode size={24} className="text-gray-400" />
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowQRModal(table)}
                    className="flex-1 flex items-center justify-center gap-2 text-xs font-bold text-slate-400 hover:text-brand-400 bg-slate-800/80 hover:bg-brand-500/10 py-3 rounded-lg transition-all border border-transparent hover:border-brand-500/20"
                  >
                    <QrCode size={14} /> Full View
                  </button>
                  <button
                    onClick={() => deleteTable(table.id)}
                    className="w-11 h-11 flex items-center justify-center text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all border border-transparent hover:border-red-500/20"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Table Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4 py-6">
          <div className="bg-surface-900 border border-slate-800 rounded-2xl p-6 lg:p-8 w-full max-w-sm shadow-2xl animate-scale-up">
            <h2 className="font-display text-xl font-bold text-slate-100 mb-2">New Restaurant Table</h2>
            <p className="text-slate-500 text-sm mb-8 font-medium">A unique QR code will be created for this table.</p>
            
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Table Number/Name *</label>
                <input className="input-base text-sm" placeholder="e.g. 1, 2, A1, VIP-1" value={tableForm.table_number} onChange={e => setTableForm(p => ({ ...p, table_number: e.target.value }))} autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Capacity</label>
                  <input type="number" className="input-base text-sm" placeholder="4" value={tableForm.capacity} onChange={e => setTableForm(p => ({ ...p, capacity: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Floor/Section</label>
                  <input className="input-base text-sm" placeholder="e.g. Ground" value={tableForm.floor} onChange={e => setTableForm(p => ({ ...p, floor: e.target.value }))} />
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-10">
              <Button variant="secondary" className="flex-1 font-bold" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1 font-bold" loading={saving} onClick={addTable}>Create</Button>
            </div>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4 py-6">
          <div className="bg-surface-900 border border-slate-800 rounded-2xl p-6 lg:p-8 w-full max-w-xs shadow-2xl animate-scale-up text-center">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-bold text-slate-100">
                Table {showQRModal.table_number}
              </h2>
              <button onClick={() => setShowQRModal(null)} className="text-slate-500 hover:text-slate-200">
                <X size={20} />
              </button>
            </div>
            
            <p className="text-slate-500 text-sm mb-8 font-medium">Scan this code to see the digital menu.</p>

            <div className="bg-white rounded-2xl p-6 inline-block mx-auto mb-8 shadow-inner shadow-black/5">
              <QRCodeSVG
                id={`qr-${showQRModal.table_number}`}
                value={getQRUrl(showQRModal)}
                size={200}
                level="H"
                includeMargin={false}
              />
            </div>

            <p className="text-[10px] text-slate-600 mb-8 font-mono break-all px-4 py-2 bg-black/20 rounded-lg border border-slate-800/50">{getQRUrl(showQRModal)}</p>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1 font-bold" onClick={() => setShowQRModal(null)}>Back</Button>
              <Button className="flex-1 font-bold" icon={<Download size={15} />} onClick={() => downloadQR(showQRModal.table_number)}>
                SVG
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
