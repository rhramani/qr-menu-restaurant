'use client'

import { useEffect, useRef, useState } from 'react'
import Header from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase/client'
import type { RestaurantTable, QRCode } from '@/types'
import { Plus, QrCode, Download, Trash2, Users } from 'lucide-react'
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
          <Button icon={<Plus size={16} />} onClick={() => setShowModal(true)}>
            Add Table
          </Button>
        }
      />

      <main className="flex-1 p-7 animate-fade-in">
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 bg-surface-800 rounded-xl animate-pulse border border-slate-800" />
            ))}
          </div>
        ) : tables.length === 0 ? (
          <div className="py-20 text-center">
            <QrCode size={40} className="text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 font-medium mb-1">No tables yet</p>
            <p className="text-slate-600 text-sm mb-5">Add tables and QR codes will be auto-generated</p>
            <Button onClick={() => setShowModal(true)} icon={<Plus size={16} />}>Add First Table</Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {tables.map(table => (
              <div
                key={table.id}
                className="bg-surface-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 transition-all duration-200 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-slate-100 text-lg">Table {table.table_number}</h3>
                    <div className="flex items-center gap-1.5 text-slate-500 text-xs mt-0.5">
                      <Users size={12} />
                      <span>{table.capacity} seats</span>
                      {table.floor && <><span>·</span><span>{table.floor}</span></>}
                    </div>
                  </div>
                  <Badge variant={table.is_active ? 'success' : 'default'}>
                    {table.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                {/* QR preview */}
                <div
                  className="bg-white rounded-xl p-3 flex items-center justify-center mb-4 cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setShowQRModal(table)}
                >
                  {table.qr_codes ? (
                    <QRCodeSVG
                      value={typeof window !== 'undefined' ? getQRUrl(table) : `table-${table.id}`}
                      size={96}
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
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-slate-400 hover:text-brand-400 bg-slate-800 hover:bg-brand-500/10 py-2 rounded-lg transition-all"
                  >
                    <QrCode size={13} /> View QR
                  </button>
                  <button
                    onClick={() => deleteTable(table.id)}
                    className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Table Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-surface-900 border border-slate-800 rounded-2xl p-7 w-full max-w-sm shadow-premium animate-slide-up">
            <h2 className="font-display text-xl font-semibold text-slate-100 mb-1.5">Add Table</h2>
            <p className="text-slate-500 text-sm mb-6">A QR code will be automatically generated</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Table Number *</label>
                <input className="input-base" placeholder="1, 2, A1, VIP..." value={tableForm.table_number} onChange={e => setTableForm(p => ({ ...p, table_number: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Capacity</label>
                  <input type="number" className="input-base" placeholder="4" value={tableForm.capacity} onChange={e => setTableForm(p => ({ ...p, capacity: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Floor/Section</label>
                  <input className="input-base" placeholder="Ground, 1st..." value={tableForm.floor} onChange={e => setTableForm(p => ({ ...p, floor: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-7">
              <Button variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1" loading={saving} onClick={addTable}>Add Table</Button>
            </div>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-surface-900 border border-slate-800 rounded-2xl p-7 w-full max-w-xs shadow-premium animate-slide-up text-center">
            <h2 className="font-display text-xl font-semibold text-slate-100 mb-1.5">
              Table {showQRModal.table_number}
            </h2>
            <p className="text-slate-500 text-sm mb-6">Scan to access the menu</p>

            <div className="bg-white rounded-2xl p-5 inline-block mx-auto mb-6">
              <QRCodeSVG
                id={`qr-${showQRModal.table_number}`}
                value={getQRUrl(showQRModal)}
                size={180}
                level="H"
                includeMargin={false}
              />
            </div>

            <p className="text-xs text-slate-600 mb-6 font-mono break-all px-2">{getQRUrl(showQRModal)}</p>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setShowQRModal(null)}>Close</Button>
              <Button className="flex-1" icon={<Download size={15} />} onClick={() => downloadQR(showQRModal.table_number)}>
                Download
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
