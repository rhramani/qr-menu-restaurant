'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem } from '@/types'

interface CartStore {
  items: CartItem[]
  restaurantId: string | null
  tableId: string | null

  addItem: (item: Omit<CartItem, 'quantity'>, restaurantId: string, tableId: string) => void
  removeItem: (menuItemId: string) => void
  decrementItem: (menuItemId: string) => void
  clearCart: () => void

  cartTotal: () => number
  cartCount: () => number
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      restaurantId: null,
      tableId: null,

      addItem: (item, restaurantId, tableId) => {
        set(state => {
          // If switching restaurant, clear cart
          if (state.restaurantId && state.restaurantId !== restaurantId) {
            return {
              items: [{ ...item, quantity: 1 }],
              restaurantId,
              tableId,
            }
          }
          const existing = state.items.find(i => i.menuItemId === item.menuItemId)
          if (existing) {
            return {
              items: state.items.map(i =>
                i.menuItemId === item.menuItemId ? { ...i, quantity: i.quantity + 1 } : i
              ),
              restaurantId,
              tableId,
            }
          }
          return {
            items: [...state.items, { ...item, quantity: 1 }],
            restaurantId,
            tableId,
          }
        })
      },

      decrementItem: (menuItemId) => {
        set(state => {
          const item = state.items.find(i => i.menuItemId === menuItemId)
          if (!item) return state
          if (item.quantity <= 1) {
            return { items: state.items.filter(i => i.menuItemId !== menuItemId) }
          }
          return { items: state.items.map(i => i.menuItemId === menuItemId ? { ...i, quantity: i.quantity - 1 } : i) }
        })
      },

      removeItem: (menuItemId) => {
        set(state => ({ items: state.items.filter(i => i.menuItemId !== menuItemId) }))
      },

      clearCart: () => set({ items: [], restaurantId: null, tableId: null }),

      cartTotal: () => get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      cartCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    { name: 'qrbite-cart' }
  )
)
