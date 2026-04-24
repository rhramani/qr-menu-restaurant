import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const OrderSchema = z.object({
  restaurant_id: z.string().uuid(),
  table_id: z.string().uuid(),
  customer_name: z.string().min(1).max(100),
  customer_phone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  items: z.array(z.object({
    menu_item_id: z.string().uuid(),
    name: z.string(),
    price: z.number().positive(),
    quantity: z.number().int().positive(),
    special_instructions: z.string().optional().nullable(),
  })).min(1),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = OrderSchema.parse(body)
    const supabase = createAdminClient()

    // Validate restaurant is accepting orders
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('is_accepting_orders, status')
      .eq('id', data.restaurant_id)
      .single()

    if (!restaurant || !restaurant.is_accepting_orders || !['active', 'trial'].includes(restaurant.status)) {
      return NextResponse.json({ error: 'Restaurant is not accepting orders' }, { status: 400 })
    }

    // Validate all menu items belong to this restaurant
    const itemIds = data.items.map(i => i.menu_item_id)
    const { data: menuItems } = await supabase
      .from('menu_items')
      .select('id, price, is_available')
      .in('id', itemIds)
      .eq('restaurant_id', data.restaurant_id)

    if (!menuItems || menuItems.length !== itemIds.length) {
      return NextResponse.json({ error: 'Invalid menu items' }, { status: 400 })
    }

    const unavailable = menuItems.filter(m => !m.is_available)
    if (unavailable.length > 0) {
      return NextResponse.json({ error: 'Some items are unavailable' }, { status: 400 })
    }

    // Calculate totals using DB prices (not client-side)
    const priceMap = Object.fromEntries(menuItems.map(m => [m.id, m.price]))
    const subtotal = data.items.reduce((sum, item) => sum + priceMap[item.menu_item_id] * item.quantity, 0)
    const tax = Math.round(subtotal * 0.05 * 100) / 100
    const total = subtotal + tax

    // Generate order number
    const orderNumber = `${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 9000 + 1000)}`

    // Create order
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        restaurant_id: data.restaurant_id,
        table_id: data.table_id,
        order_number: orderNumber,
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        status: 'pending',
        subtotal,
        tax,
        total,
        notes: data.notes,
      })
      .select()
      .single()

    if (error || !order) {
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    // Create order items
    const orderItems = data.items.map(item => ({
      order_id: order.id,
      menu_item_id: item.menu_item_id,
      name: item.name,
      price: priceMap[item.menu_item_id],
      quantity: item.quantity,
      subtotal: priceMap[item.menu_item_id] * item.quantity,
      special_instructions: item.special_instructions,
    }))

    await supabase.from('order_items').insert(orderItems)

    return NextResponse.json({ success: true, order_id: order.id, order_number: order.order_number })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: err.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
