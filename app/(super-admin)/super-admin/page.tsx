import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import { StatCard } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Building2, Users, CreditCard, TrendingUp, Circle } from 'lucide-react'
import { formatCurrency, timeAgo } from '@/lib/utils'

export const metadata = { title: 'Super Admin — Overview' }

export default async function SuperAdminDashboard() {
  const supabase = createClient()

  const [
    { count: totalRestaurants },
    { count: activeRestaurants },
    { data: recentRestaurants },
    { data: subscriptions },
  ] = await Promise.all([
    supabase.from('restaurants').select('*', { count: 'exact', head: true }),
    supabase.from('restaurants').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('restaurants').select('id, name, status, city, created_at, owner_id').order('created_at', { ascending: false }).limit(8),
    supabase.from('subscriptions').select('id, status, plan:plans(name, price_monthly)').eq('status', 'active').limit(100),
  ])

  const mrr = subscriptions?.reduce((sum, s) => {
    const plan = s.plan as unknown as { name: string; price_monthly: number } | null
    return sum + (plan?.price_monthly ?? 0)
  }, 0) ?? 0

  const statusStyles: Record<string, string> = {
    active: 'success',
    trial: 'warning',
    inactive: 'default',
    suspended: 'error',
  }

  return (
    <>
      <Header
        title="Platform Overview"
        subtitle="Monitor all restaurants and subscriptions"
      />

      <main className="flex-1 p-7 space-y-7 animate-fade-in">
        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Restaurants"
            value={totalRestaurants ?? 0}
            change="All time"
            icon={<Building2 size={16} />}
          />
          <StatCard
            label="Active Restaurants"
            value={activeRestaurants ?? 0}
            change="Currently serving"
            changeType="positive"
            icon={<Circle size={16} />}
          />
          <StatCard
            label="Monthly Revenue"
            value={formatCurrency(mrr)}
            change="From subscriptions"
            changeType="positive"
            icon={<CreditCard size={16} />}
          />
          <StatCard
            label="Growth"
            value={`${totalRestaurants ?? 0} total`}
            change="Platform wide"
            changeType="neutral"
            icon={<TrendingUp size={16} />}
          />
        </div>

        {/* Recent restaurants */}
        <div className="bg-surface-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
            <div>
              <h2 className="font-semibold text-slate-100 text-base">All Restaurants</h2>
              <p className="text-slate-500 text-xs mt-0.5">Recently onboarded</p>
            </div>
            <a href="/super-admin/restaurants" className="text-xs text-brand-400 hover:text-brand-300 font-medium transition-colors">
              View all →
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800/60">
                  <th className="text-left px-6 py-3 text-slate-500 font-medium text-xs uppercase tracking-wider">Restaurant</th>
                  <th className="text-left px-6 py-3 text-slate-500 font-medium text-xs uppercase tracking-wider">City</th>
                  <th className="text-left px-6 py-3 text-slate-500 font-medium text-xs uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3 text-slate-500 font-medium text-xs uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentRestaurants?.map(restaurant => (
                  <tr key={restaurant.id} className="table-row-hover">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                          <Building2 size={15} className="text-brand-400" />
                        </div>
                        <span className="text-slate-100 font-medium">{restaurant.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400">{restaurant.city ?? '—'}</td>
                    <td className="px-6 py-4">
                      <Badge variant={statusStyles[restaurant.status] as 'success' | 'warning' | 'default' | 'error'}>
                        {restaurant.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{timeAgo(restaurant.created_at)}</td>
                    <td className="px-6 py-4 text-right">
                      <a
                        href={`/super-admin/restaurants/${restaurant.id}`}
                        className="text-xs text-slate-500 hover:text-brand-400 transition-colors font-medium"
                      >
                        Manage →
                      </a>
                    </td>
                  </tr>
                ))}
                {(!recentRestaurants || recentRestaurants.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-600">
                      No restaurants yet. Onboard your first restaurant.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  )
}
