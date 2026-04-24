import type { Database, OrderStatus } from './database'

export type { UserRole, RestaurantStatus, PlanType, OrderStatus, SubscriptionStatus } from './database'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Plan = Database['public']['Tables']['plans']['Row']
export type Restaurant = Database['public']['Tables']['restaurants']['Row']
export type Subscription = Database['public']['Tables']['subscriptions']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type MenuItem = Database['public']['Tables']['menu_items']['Row']
export type RestaurantTable = Database['public']['Tables']['restaurant_tables']['Row']
export type QRCode = Database['public']['Tables']['qr_codes']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type OrderItem = Database['public']['Tables']['order_items']['Row']

// Extended types with relations
export type OrderWithItems = Order & {
  order_items: (OrderItem & { menu_item: MenuItem | null })[]
  restaurant_table: RestaurantTable | null
}

export type MenuItemWithCategory = MenuItem & {
  category: Category | null
}

export type RestaurantWithSubscription = Restaurant & {
  subscriptions: (Subscription & { plan: Plan })[]
}

// Cart types (client-side only, no DB)
export interface CartItem {
  menuItemId: string
  name: string
  price: number
  quantity: number
  image_url: string | null
  special_instructions?: string
}

export interface CartState {
  items: CartItem[]
  restaurantId: string | null
  tableId: string | null
  qrToken: string | null
}

// Dashboard stat types
export interface DashboardStats {
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
  activeRestaurants?: number
}

export const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; next?: OrderStatus }> = {
  pending: { label: 'Pending', color: 'amber', next: 'preparing' },
  preparing: { label: 'Preparing', color: 'blue', next: 'ready' },
  ready: { label: 'Ready', color: 'green', next: 'served' },
  served: { label: 'Served', color: 'slate' },
  cancelled: { label: 'Cancelled', color: 'red' },
}
