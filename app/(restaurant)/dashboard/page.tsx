import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import { StatCard } from '@/components/ui/Card'
import { OrderStatusBadge } from '@/components/ui/Badge'
import { ShoppingBag, DollarSign, Clock, CheckCircle2 } from 'lucide-react'
import { formatCurrency, timeAgo } from '@/lib/utils'

export const metadata = { title: 'Dashboard' }

export default async function RestaurantDashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id')
    .eq('id', user.id)
    .single()

  const restaurantId = profile?.restaurant_id
  if (!restaurantId) {
    return (
      <>
        <Header title="Dashboard" />
        <main className="flex-1 p-7">
          <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-6 text-center">
            <p className="text-amber-300 font-medium mb-1">No restaurant linked to your account</p>
            <p className="text-slate-500 text-sm">Ask a super admin to link your account to a restaurant.</p>
          </div>
        </main>
      </>
    )
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [
    { data: todayOrders },
    { count: pendingCount },
    { count: totalCount },
  ] = await Promise.all([
    supabase.from('orders')
      .select('id, order_number, status, total, created_at, customer_name, restaurant_tables(table_number)')
      .eq('restaurant_id', restaurantId)
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false })
      .limit(10),
    supabase.from('orders').select('*', { count: 'exact', head: true })
      .eq('restaurant_id', restaurantId).eq('status', 'pending'),
    supabase.from('orders').select('*', { count: 'exact', head: true })
      .eq('restaurant_id', restaurantId).gte('created_at', today.toISOString()),
  ])

  const todayRevenue = todayOrders?.reduce((sum, o) => sum + (o.total ?? 0), 0) ?? 0
  const servedToday = todayOrders?.filter(o => o.status === 'served').length ?? 0

  return (
    <>
      <Header
        title="Dashboard"
        subtitle={`${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}`}
      />

      <main className="flex-1 p-7 space-y-7 animate-fade-in">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Today's Revenue"
            value={formatCurrency(todayRevenue)}
            icon={<DollarSign size={16} />}
            changeType="positive"
          />
          <StatCard
            label="Today's Orders"
            value={totalCount ?? 0}
            icon={<ShoppingBag size={16} />}
          />
          <StatCard
            label="Pending"
            value={pendingCount ?? 0}
            change={pendingCount && pendingCount > 0 ? 'Needs attention' : 'All clear'}
            changeType={pendingCount && pendingCount > 0 ? 'negative' : 'positive'}
            icon={<Clock size={16} />}
          />
          <StatCard
            label="Served Today"
            value={servedToday}
            changeType="positive"
            icon={<CheckCircle2 size={16} />}
          />
        </div>

        {/* Live orders */}
        <div className="bg-surface-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
            <div>
              <h2 className="font-semibold text-slate-100">Today&apos;s Orders</h2>
              <p className="text-slate-500 text-xs mt-0.5">Real-time order feed</p>
            </div>
            <a href="/dashboard/orders" className="text-xs text-brand-400 hover:text-brand-300 font-medium">
              View all →
            </a>
          </div>

          {(!todayOrders || todayOrders.length === 0) ? (
            <div className="py-16 text-center">
              <ShoppingBag size={32} className="text-slate-700 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">No orders yet today</p>
              <p className="text-slate-700 text-sm mt-1">Orders placed via QR code will appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800/60">
                    <th className="text-left px-6 py-3 text-slate-500 font-medium text-xs uppercase tracking-wider">Order</th>
                    <th className="text-left px-6 py-3 text-slate-500 font-medium text-xs uppercase tracking-wider">Table</th>
                    <th className="text-left px-6 py-3 text-slate-500 font-medium text-xs uppercase tracking-wider">Customer</th>
                    <th className="text-left px-6 py-3 text-slate-500 font-medium text-xs uppercase tracking-wider">Total</th>
                    <th className="text-left px-6 py-3 text-slate-500 font-medium text-xs uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-3 text-slate-500 font-medium text-xs uppercase tracking-wider">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {todayOrders.map(order => {
                    const table = order.restaurant_tables as unknown as { table_number: string } | null
                    return (
                      <tr key={order.id} className="table-row-hover">
                        <td className="px-6 py-4">
                          <code className="text-brand-400 text-xs font-mono">{order.order_number}</code>
                        </td>
                        <td className="px-6 py-4 text-slate-300">
                          {table ? `Table ${table.table_number}` : '—'}
                        </td>
                        <td className="px-6 py-4 text-slate-400">{order.customer_name ?? 'Guest'}</td>
                        <td className="px-6 py-4 text-slate-100 font-medium">{formatCurrency(order.total)}</td>
                        <td className="px-6 py-4">
                          <OrderStatusBadge status={order.status} />
                        </td>
                        <td className="px-6 py-4 text-slate-500">{timeAgo(order.created_at)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
