import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: { tableId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id, role')
    .eq('id', user.id)
    .single()

  const { data: qr } = await supabase
    .from('qr_codes')
    .select('*, restaurant_tables(*)')
    .eq('table_id', params.tableId)
    .single()

  if (!qr) {
    return NextResponse.json({ error: 'QR code not found' }, { status: 404 })
  }

  // Authorization check
  if (profile?.role !== 'super_admin') {
    const table = qr.restaurant_tables as { restaurant_id: string } | null
    if (!table || table.restaurant_id !== profile?.restaurant_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.headers.get('origin') ?? ''
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('slug')
    .eq('id', (qr.restaurant_tables as { restaurant_id: string }).restaurant_id)
    .single()

  const menuUrl = `${appUrl}/menu/${restaurant?.slug}/${params.tableId}`

  return NextResponse.json({ qr_token: qr.qr_token, menu_url: menuUrl, scan_count: qr.scan_count })
}
