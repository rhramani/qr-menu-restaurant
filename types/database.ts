export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type UserRole = 'super_admin' | 'restaurant_admin' | 'staff'
export type RestaurantStatus = 'active' | 'inactive' | 'suspended' | 'trial'
export type PlanType = 'starter' | 'professional' | 'enterprise'
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled'
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'trial'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          res_pass: string
          full_name: string | null
          avatar_url: string | null
          role: UserRole
          restaurant_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      plans: {
        Row: {
          id: string
          name: string
          type: PlanType
          price_monthly: number
          price_yearly: number | null
          max_tables: number
          max_menu_items: number
          max_categories: number
          features: Json
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['plans']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['plans']['Insert']>
      }
      restaurants: {
        Row: {
          id: string
          owner_id: string | null
          name: string
          slug: string
          description: string | null
          logo_url: string | null
          cover_image_url: string | null
          address: string | null
          city: string | null
          country: string
          phone: string | null
          email: string | null
          currency: string
          currency_symbol: string
          status: RestaurantStatus
          is_accepting_orders: boolean
          primary_color: string
          res_pass: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['restaurants']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['restaurants']['Insert']>
      }
      subscriptions: {
        Row: {
          id: string
          restaurant_id: string
          plan_id: string
          status: SubscriptionStatus
          started_at: string
          expires_at: string | null
          cancelled_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['subscriptions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>
      }
      categories: {
        Row: {
          id: string
          restaurant_id: string
          name: string
          description: string | null
          image_url: string | null
          sort_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          restaurant_id: string
          name: string
          description?: string | null
          image_url?: string | null
          sort_order?: number
          is_active?: boolean
        }
        Update: Partial<Database['public']['Tables']['categories']['Insert']>
      }
      menu_items: {
        Row: {
          id: string
          restaurant_id: string
          category_id: string | null
          name: string
          description: string | null
          price: number
          image_url: string | null
          is_vegetarian: boolean
          is_vegan: boolean
          is_gluten_free: boolean
          is_featured: boolean
          is_available: boolean
          sort_order: number
          prep_time_minutes: number
          calories: number | null
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          restaurant_id: string
          name: string
          price: number
          category_id?: string | null
          description?: string | null
          image_url?: string | null
          is_vegetarian?: boolean
          is_vegan?: boolean
          is_gluten_free?: boolean
          is_featured?: boolean
          is_available?: boolean
          sort_order?: number
          prep_time_minutes?: number
          calories?: number | null
          tags?: string[]
        }
        Update: Partial<Database['public']['Tables']['menu_items']['Insert']>
      }
      restaurant_tables: {
        Row: {
          id: string
          restaurant_id: string
          table_number: string
          capacity: number
          floor: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          restaurant_id: string
          table_number: string
          capacity?: number
          floor?: string | null
          is_active?: boolean
        }
        Update: Partial<Database['public']['Tables']['restaurant_tables']['Insert']>
      }
      qr_codes: {
        Row: {
          id: string
          restaurant_id: string
          table_id: string
          qr_token: string
          scan_count: number
          last_scanned_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['qr_codes']['Row'], 'id' | 'created_at' | 'qr_token' | 'scan_count'>
        Update: Partial<Database['public']['Tables']['qr_codes']['Insert']>
      }
      orders: {
        Row: {
          id: string
          restaurant_id: string
          table_id: string | null
          qr_code_id: string | null
          order_number: string
          customer_name: string | null
          customer_phone: string | null
          status: OrderStatus
          subtotal: number
          tax: number
          total: number
          notes: string | null
          served_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          restaurant_id: string
          order_number: string
          subtotal: number
          tax: number
          total: number
          table_id?: string | null
          qr_code_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          status?: OrderStatus
          notes?: string | null
          served_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['orders']['Insert']>
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          menu_item_id: string | null
          name: string
          price: number
          quantity: number
          subtotal: number
          special_instructions: string | null
          created_at: string
        }
        Insert: {
          order_id: string
          name: string
          price: number
          quantity: number
          subtotal: number
          menu_item_id?: string | null
          special_instructions?: string | null
        }
        Update: Partial<Database['public']['Tables']['order_items']['Insert']>
      }
    }
  }
}
