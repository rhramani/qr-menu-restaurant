import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardShell from '@/components/layout/DashboardShell'

export default async function RestaurantLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, restaurant_id')
    .eq('id', user.id)
    .single()

  if (!profile || !['restaurant_admin', 'staff'].includes(profile.role)) {
    redirect('/super-admin')
  }

  let restaurantName: string | undefined
  if (profile.restaurant_id) {
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('name')
      .eq('id', profile.restaurant_id)
      .single()
    restaurantName = restaurant?.name
  }

  // Count pending orders for sidebar badge
  let pendingOrders = 0
  if (profile.restaurant_id) {
    const { count } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', profile.restaurant_id)
      .eq('status', 'pending')
    pendingOrders = count ?? 0
  }

  return (
    <DashboardShell 
      role="restaurant_admin" 
      restaurantName={restaurantName} 
      pendingOrders={pendingOrders}
    >
      {children}
    </DashboardShell>
  )
}
