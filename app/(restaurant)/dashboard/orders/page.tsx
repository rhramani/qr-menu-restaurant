'use client'

import { useEffect, useState, useCallback } from 'react'
import Header from '@/components/layout/Header'
import { OrderStatusBadge } from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase/client'
import type { Order, OrderStatus } from '@/types'
import { ORDER_STATUS_CONFIG } from '@/types'
import { formatCurrency, timeAgo } from '@/lib/utils'
import { ChevronRight, ShoppingBag, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

type OrderWithTable = Order & { restaurant_tables: { table_number: string } | null }
type ExpandedOrder = OrderWithTable & { order_items: { id: string; name: string; quantity: number; price: number; subtotal: number; special_instructions: string | null }[] }

const STATUS_FILTERS: { label: string; value: OrderStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Preparing', value: 'preparing' },
  { label: 'Ready', value: 'ready' },
  { label: 'Served', value: 'served' },
]

export default function OrdersPage() {
  const supabase = createClient()
  const [orders, setOrders] = useState<OrderWithTable[]>([])
  const [loading, setLoading] = useState(true)
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [expanded, setExpanded] = useState<ExpandedOrder | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchOrders = useCallback(async (rid: string) => {
    const query = supabase
      .from('orders')
      .select('*, restaurant_tables(table_number)')
      .eq('restaurant_id', rid)
      .order('created_at', { ascending: false })
      .limit(50)

    if (statusFilter !== 'all') {
      query.eq('status', statusFilter)
    }

    const { data } = await query
    setOrders((data ?? []) as OrderWithTable[])
    setLoading(false)
  }, [statusFilter])

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('restaurant_id').eq('id', user.id).single()
      if (!profile?.restaurant_id) return
      setRestaurantId(profile.restaurant_id)
    }
    init()
  }, [])

  useEffect(() => {
    if (!restaurantId) return
    fetchOrders(restaurantId)

    // Realtime subscription
    const channel = supabase
      .channel(`orders-${restaurantId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `restaurant_id=eq.${restaurantId}`,
      }, () => {
        fetchOrders(restaurantId)
        toast('New order received!', { icon: '🔔' })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [restaurantId, statusFilter, fetchOrders])

  async function expandOrder(order: OrderWithTable) {
    const { data } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', order.id)
    setExpanded({ ...order, order_items: data ?? [] })
  }

  async function advanceStatus(orderId: string, currentStatus: OrderStatus) {
    const config = ORDER_STATUS_CONFIG[currentStatus]
    if (!config.next) return

    setUpdatingId(orderId)
    const { error } = await supabase
      .from('orders')
      .update({ status: config.next })
      .eq('id', orderId)

    if (error) toast.error('Failed to update status')
    else {
      toast.success(`Order marked as ${ORDER_STATUS_CONFIG[config.next].label}`)
      if (expanded?.id === orderId) {
        setExpanded(prev => prev ? { ...prev, status: config.next! } : null)
      }
      restaurantId && fetchOrders(restaurantId)
    }
    setUpdatingId(null)
  }

  const filteredOrders = orders

  return (
    <>
      <Header
        title="Live Orders"
        subtitle="Real-time order management"
        actions={
          <button
            onClick={() => restaurantId && fetchOrders(restaurantId)}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        }
      />

      <main className="flex-1 flex min-h-0 animate-fade-in">
        {/* Orders list */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Status filters */}
          <div className="flex gap-1.5 px-7 pt-5 pb-4 overflow-x-auto">
            {STATUS_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  statusFilter === f.value
                    ? 'bg-brand-500 text-slate-900'
                    : 'bg-surface-800 text-slate-500 hover:text-slate-300 border border-slate-700'
                }`}
              >
                {f.label}
                {f.value === 'pending' && orders.filter(o => o.status === 'pending').length > 0 && (
                  <span className="ml-1.5 bg-slate-900 text-brand-400 text-xs px-1.5 py-0.5 rounded-full">
                    {orders.filter(o => o.status === 'pending').length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-7 pb-7 space-y-2">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-20 bg-surface-800 rounded-xl animate-pulse" />
              ))
            ) : filteredOrders.length === 0 ? (
              <div className="py-16 text-center">
                <ShoppingBag size={32} className="text-slate-700 mx-auto mb-3" />
                <p className="text-slate-600 font-medium">No orders {statusFilter !== 'all' ? `with status "${statusFilter}"` : 'yet'}</p>
              </div>
            ) : filteredOrders.map(order => {
              const config = ORDER_STATUS_CONFIG[order.status]
              const table = order.restaurant_tables
              const isActive = expanded?.id === order.id

              return (
                <div
                  key={order.id}
                  onClick={() => expandOrder(order)}
                  className={`bg-surface-900 border rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                    isActive ? 'border-brand-500/40 shadow-glow-amber' : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Status dot */}
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      order.status === 'pending' ? 'bg-amber-400 status-pulse-amber' :
                      order.status === 'preparing' ? 'bg-blue-400' :
                      order.status === 'ready' ? 'bg-green-400' :
                      'bg-slate-600'
                    }`} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <code className="text-brand-400 text-xs font-mono font-semibold">{order.order_number}</code>
                        <span className="text-slate-600 text-xs flex-shrink-0">{timeAgo(order.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-slate-300 text-sm font-medium">
                          {table ? `Table ${table.table_number}` : 'Table —'}
                        </span>
                        <span className="text-slate-700">·</span>
                        <span className="text-slate-500 text-sm">{order.customer_name ?? 'Guest'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-slate-100 font-semibold text-sm">{formatCurrency(order.total)}</span>
                      <OrderStatusBadge status={order.status} />
                      <ChevronRight size={15} className={`text-slate-600 transition-transform ${isActive ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Order detail panel */}
        {expanded && (
          <div className="w-80 border-l border-slate-800 bg-surface-900 flex flex-col overflow-y-auto animate-slide-up">
            <div className="p-5 border-b border-slate-800">
              <div className="flex items-start justify-between mb-1">
                <code className="text-brand-400 font-mono text-sm font-semibold">{expanded.order_number}</code>
                <OrderStatusBadge status={expanded.status} />
              </div>
              <p className="text-slate-400 text-sm">
                {expanded.restaurant_tables ? `Table ${expanded.restaurant_tables.table_number}` : '—'}
                {expanded.customer_name && ` · ${expanded.customer_name}`}
              </p>
              <p className="text-slate-600 text-xs mt-0.5">{timeAgo(expanded.created_at)}</p>
            </div>

            {/* Items */}
            <div className="flex-1 p-5 space-y-3">
              <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider">Items</h3>
              {expanded.order_items.map(item => (
                <div key={item.id} className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <span className="text-brand-400 font-mono text-sm w-5 flex-shrink-0">×{item.quantity}</span>
                    <div className="min-w-0">
                      <p className="text-slate-200 text-sm font-medium leading-tight">{item.name}</p>
                      {item.special_instructions && (
                        <p className="text-slate-600 text-xs mt-0.5 italic">{item.special_instructions}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-slate-300 text-sm font-mono flex-shrink-0">{formatCurrency(item.subtotal)}</span>
                </div>
              ))}

              {expanded.notes && (
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">Notes</p>
                  <p className="text-slate-400 text-sm italic">{expanded.notes}</p>
                </div>
              )}
            </div>

            {/* Total + actions */}
            <div className="p-5 border-t border-slate-800">
              <div className="flex justify-between items-center mb-4">
                <span className="text-slate-400 text-sm">Total</span>
                <span className="text-slate-100 font-display text-xl font-semibold">{formatCurrency(expanded.total)}</span>
              </div>

              {ORDER_STATUS_CONFIG[expanded.status].next && (
                <button
                  disabled={updatingId === expanded.id}
                  onClick={() => advanceStatus(expanded.id, expanded.status)}
                  className="w-full bg-brand-500 hover:bg-brand-400 disabled:opacity-60 text-slate-900 font-semibold py-2.5 rounded-xl text-sm transition-all"
                >
                  {updatingId === expanded.id ? 'Updating...' : (
                    `Mark as ${ORDER_STATUS_CONFIG[ORDER_STATUS_CONFIG[expanded.status].next!].label} →`
                  )}
                </button>
              )}

              {expanded.status === 'served' && (
                <div className="text-center py-2 text-green-400 text-sm font-medium">
                  ✓ Order completed
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  )
}
