import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CustomerMenuClient from './CustomerMenuClient'

interface Props {
  params: { slug: string; tableId: string }
}

export async function generateMetadata({ params }: Props) {
  const supabase = createClient()
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('name')
    .eq('slug', params.slug)
    .single()

  return {
    title: restaurant ? `Menu — ${restaurant.name}` : 'Menu',
  }
}

export default async function CustomerMenuPage({ params }: Props) {
  const supabase = createClient()

  // Fetch restaurant
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('slug', params.slug)
    .single()

  if (!restaurant || !['active', 'trial'].includes(restaurant.status)) notFound()

  // Verify table exists
  const { data: table } = await supabase
    .from('restaurant_tables')
    .select('*, qr_codes(*)')
    .eq('id', params.tableId)
    .eq('restaurant_id', restaurant.id)
    .eq('is_active', true)
    .single()

  if (!table) notFound()

  // Increment scan count
  if (table.qr_codes) {
    const qr = Array.isArray(table.qr_codes) ? table.qr_codes[0] : table.qr_codes
    if (qr?.id) {
      await supabase
        .from('qr_codes')
        .update({ scan_count: (qr.scan_count ?? 0) + 1, last_scanned_at: new Date().toISOString() })
        .eq('id', qr.id)
    }
  }

  // Fetch categories + menu items
  const [{ data: categories }, { data: menuItems }] = await Promise.all([
    supabase.from('categories').select('*').eq('restaurant_id', restaurant.id).eq('is_active', true).order('sort_order'),
    supabase.from('menu_items').select('*').eq('restaurant_id', restaurant.id).eq('is_available', true).order('sort_order'),
  ])

  return (
    <CustomerMenuClient
      restaurant={restaurant}
      table={table}
      categories={categories ?? []}
      menuItems={menuItems ?? []}
    />
  )
}
