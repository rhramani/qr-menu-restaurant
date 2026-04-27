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

      <main className="flex-1 flex flex-col lg:flex-row min-h-0 animate-fade-in overflow-hidden relative">
        {/* Orders list */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Status filters */}
          <div className="flex gap-1.5 px-4 lg:px-7 pt-5 pb-4 overflow-x-auto scrollbar-none">
            {STATUS_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-4 py-1.5 rounded-full text-xs lg:text-sm font-medium whitespace-nowrap transition-all ${
                  statusFilter === f.value
                    ? 'bg-brand-500 text-slate-900'
                    : 'bg-surface-800 text-slate-500 hover:text-slate-300 border border-slate-700'
                }`}
              >
                {f.label}
                {f.value === 'pending' && orders.filter(o => o.status === 'pending').length > 0 && (
                  <span className="ml-1.5 bg-slate-900 text-brand-400 text-[10px] px-1.5 py-0.5 rounded-full">
                    {orders.filter(o => o.status === 'pending').length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-4 lg:px-7 pb-7 space-y-2">
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
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      order.status === 'pending' ? 'bg-amber-400 status-pulse-amber' :
                      order.status === 'preparing' ? 'bg-blue-400' :
                      order.status === 'ready' ? 'bg-green-400' :
                      'bg-slate-600'
                    }`} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <code className="text-brand-400 text-[10px] font-mono font-semibold">{order.order_number}</code>
                        <span className="text-slate-600 text-[10px] flex-shrink-0">{timeAgo(order.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-slate-300 text-xs lg:text-sm font-medium">
                          {table ? `Table ${table.table_number}` : 'Table —'}
                        </span>
                        <span className="text-slate-700">·</span>
                        <span className="text-slate-500 text-xs lg:text-sm truncate">{order.customer_name ?? 'Guest'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
                      <span className="text-slate-100 font-semibold text-xs lg:text-sm">{formatCurrency(order.total)}</span>
                      <div className="hidden sm:block">
                        <OrderStatusBadge status={order.status} />
                      </div>
                      <ChevronRight size={14} className={`text-slate-600 transition-transform ${isActive ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Order detail panel */}
        {expanded && (
          <>
            {/* Mobile Backdrop */}
            <div className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setExpanded(null)} />
            
            <div className="fixed inset-y-0 right-0 z-50 w-[90%] sm:w-96 lg:w-80 lg:static bg-surface-900 border-l border-slate-800 flex flex-col shadow-2xl lg:shadow-none animate-slide-left lg:animate-none">
              <div className="p-5 border-b border-slate-800 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-slate-100 font-semibold">Order Details</h3>
                  <button onClick={() => setExpanded(null)} className="lg:hidden w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400">
                    <RefreshCw size={14} className="rotate-45" />
                  </button>
                </div>
                
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <code className="text-brand-400 font-mono text-xs font-semibold">{expanded.order_number}</code>
                    <p className="text-slate-400 text-xs mt-1">
                      {expanded.restaurant_tables ? `Table ${expanded.restaurant_tables.table_number}` : '—'}
                      {expanded.customer_name && ` · ${expanded.customer_name}`}
                    </p>
                  </div>
                  <OrderStatusBadge status={expanded.status} />
                </div>
                <p className="text-slate-600 text-[10px]">{timeAgo(expanded.created_at)}</p>
              </div>

              {/* Items */}
              <div className="flex-1 p-5 space-y-4 overflow-y-auto">
                <div>
                  <h3 className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mb-3">Order Items</h3>
                  <div className="space-y-3">
                    {expanded.order_items.map(item => (
                      <div key={item.id} className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2 min-w-0">
                          <span className="text-brand-400 font-mono text-xs w-5 flex-shrink-0 mt-0.5">×{item.quantity}</span>
                          <div className="min-w-0">
                            <p className="text-slate-200 text-sm font-medium leading-tight">{item.name}</p>
                            {item.special_instructions && (
                              <p className="text-slate-500 text-[10px] mt-1 italic">{item.special_instructions}</p>
                            )}
                          </div>
                        </div>
                        <span className="text-slate-300 text-xs font-mono flex-shrink-0">{formatCurrency(item.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {expanded.notes && (
                  <div className="pt-4 border-t border-slate-800/50">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Notes from Guest</p>
                    <p className="text-slate-400 text-xs italic bg-slate-800/30 p-2.5 rounded-lg border border-slate-700/30">{expanded.notes}</p>
                  </div>
                )}
              </div>

              {/* Total + actions */}
              <div className="p-5 border-t border-slate-800 bg-surface-950/50 backdrop-blur-md">
                <div className="flex justify-between items-center mb-5">
                  <span className="text-slate-500 text-xs uppercase tracking-wider font-medium">Total Amount</span>
                  <span className="text-slate-100 font-display text-xl font-bold">{formatCurrency(expanded.total)}</span>
                </div>

                {ORDER_STATUS_CONFIG[expanded.status].next && (
                  <button
                    disabled={updatingId === expanded.id}
                    onClick={() => advanceStatus(expanded.id, expanded.status)}
                    className="w-full bg-brand-500 hover:bg-brand-400 disabled:opacity-60 text-slate-900 font-bold py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-brand-500/10 active:scale-[0.98]"
                  >
                    {updatingId === expanded.id ? 'Updating...' : (
                      `Mark as ${ORDER_STATUS_CONFIG[ORDER_STATUS_CONFIG[expanded.status].next!].label} →`
                    )}
                  </button>
                )}

                {expanded.status === 'served' && (
                  <div className="flex items-center justify-center gap-2 py-3 text-green-400 text-sm font-semibold bg-green-400/5 rounded-xl border border-green-400/10">
                    <RefreshCw size={14} className="animate-spin-slow" />
                    Order completed
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>

    </>
  )
}
