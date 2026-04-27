'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import type { Restaurant, Category, MenuItem, RestaurantTable, CartItem } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { Plus, Minus, ShoppingCart, Leaf, X, ArrowRight, Loader2, Check } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  restaurant: Restaurant
  table: RestaurantTable
  categories: Category[]
  menuItems: MenuItem[]
}

export default function CustomerMenuClient({ restaurant, table, categories, menuItems }: Props) {
  const router = useRouter()

  const [cart, setCart] = useState<CartItem[]>([])
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [showCart, setShowCart] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [placingOrder, setPlacingOrder] = useState(false)
  const [specialInstructions, setSpecialInstructions] = useState<Record<string, string>>({})

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const filteredItems = activeCategory === 'all'
    ? menuItems
    : menuItems.filter(item => item.category_id === activeCategory)

  const getCartItem = (menuItemId: string) => cart.find(c => c.menuItemId === menuItemId)

  const addToCart = useCallback((item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.menuItemId === item.id)
      if (existing) {
        return prev.map(c => c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c)
      }
      return [...prev, {
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        image_url: item.image_url,
      }]
    })
  }, [])

  const removeFromCart = useCallback((menuItemId: string) => {
    setCart(prev => {
      const existing = prev.find(c => c.menuItemId === menuItemId)
      if (existing && existing.quantity > 1) {
        return prev.map(c => c.menuItemId === menuItemId ? { ...c, quantity: c.quantity - 1 } : c)
      }
      return prev.filter(c => c.menuItemId !== menuItemId)
    })
  }, [])

  async function placeOrder() {
    if (cart.length === 0) return
    if (!customerName.trim()) {
      toast.error('Please enter your name')
      return
    }
    setPlacingOrder(true)

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: restaurant.id,
          table_id: table.id,
          customer_name: customerName,
          customer_phone: customerPhone || null,
          notes: notes || null,
          items: cart.map(item => ({
            menu_item_id: item.menuItemId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            special_instructions: specialInstructions[item.menuItemId] || null,
          })),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? 'Failed to place order. Please try again.')
        return
      }

      router.push(`/order/success?id=${data.order_id}&num=${data.order_number}&table=${table.table_number}`)
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setPlacingOrder(false)
    }
  }

  const allCategories = [
    { id: 'all', name: 'All Items' },
    ...categories,
  ]

  return (
    <div className="min-h-screen" style={{ background: '#faf7f2', color: '#1c1917' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-stone-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 lg:px-6 py-3.5 lg:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {restaurant.logo_url ? (
              <Image src={restaurant.logo_url} alt={restaurant.name} width={36} height={36} className="rounded-lg object-cover flex-shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 text-amber-700 font-display font-bold text-base">
                {restaurant.name[0]}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="font-display font-semibold text-stone-900 text-sm lg:text-base leading-tight truncate">{restaurant.name}</h1>
              <p className="text-stone-400 text-[10px] lg:text-xs">Table {table.table_number}</p>
            </div>
          </div>

          {cartCount > 0 && (
            <button
              onClick={() => setShowCart(true)}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs lg:text-sm px-3 lg:px-4 py-2 rounded-xl transition-all shadow-sm"
            >
              <ShoppingCart size={15} />
              <span>{cartCount}</span>
              <span className="hidden sm:inline text-amber-200">·</span>
              <span className="hidden sm:inline">{formatCurrency(cartTotal, restaurant.currency_symbol)}</span>
            </button>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 lg:px-6 pb-32">
        {/* Restaurant info */}
        {restaurant.description && (
          <p className="text-stone-500 text-sm mt-6 mb-1 text-center max-w-lg mx-auto">{restaurant.description}</p>
        )}

        {/* Category tabs - Sticky below header */}
        <div className="sticky top-[60px] lg:top-[68px] z-30 bg-[#faf7f2]/95 backdrop-blur-md pt-4 pb-4 -mx-4 px-4 overflow-x-auto scrollbar-none border-b border-stone-200/50 sm:border-none">
          <div className="flex gap-2 max-w-2xl mx-auto">
            {allCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs lg:text-sm font-semibold whitespace-nowrap flex-shrink-0 transition-all duration-300 ${
                  activeCategory === cat.id
                    ? 'bg-amber-500 text-white shadow-md transform scale-105'
                    : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Menu items grid */}
        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          {filteredItems.length === 0 && (
            <div className="col-span-full py-20 text-center text-stone-400">
              <p className="font-medium">No items in this category yet.</p>
            </div>
          )}

          {filteredItems.map(item => {
            const cartItem = getCartItem(item.id)
            const qty = cartItem?.quantity ?? 0

            return (
              <div key={item.id} className="group bg-white rounded-2xl overflow-hidden flex gap-4 p-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 border border-stone-100">
                {/* Item info */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      {item.is_vegetarian && (
                        <span className="w-3.5 h-3.5 rounded-sm border-2 border-green-500 flex items-center justify-center flex-shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        </span>
                      )}
                      <h3 className="font-bold text-stone-900 text-base leading-tight group-hover:text-amber-600 transition-colors">{item.name}</h3>
                    </div>

                    {item.description && (
                      <p className="text-stone-400 text-xs leading-snug mb-3 line-clamp-2 italic">{item.description}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <span className="font-display font-extrabold text-stone-900 text-base lg:text-lg">
                      {formatCurrency(item.price, restaurant.currency_symbol)}
                    </span>

                    {qty === 0 ? (
                      <button
                        onClick={() => addToCart(item)}
                        className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs lg:text-sm font-bold px-4 py-2 rounded-xl transition-all shadow-md active:scale-95"
                      >
                        <Plus size={14} /> Add
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-1.5 py-1">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors shadow-sm"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="font-bold text-amber-700 w-5 text-center text-sm">{qty}</span>
                        <button
                          onClick={() => addToCart(item)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors shadow-sm"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Item image */}
                {item.image_url && (
                  <div className="w-24 h-24 lg:w-28 lg:h-28 rounded-2xl overflow-hidden flex-shrink-0 bg-stone-100 shadow-inner">
                    <Image src={item.image_url} alt={item.name} width={112} height={112} className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Floating cart button (mobile) */}
      {cartCount > 0 && !showCart && (
        <div className="fixed bottom-6 inset-x-4 z-30 max-w-2xl mx-auto">
          <button
            onClick={() => setShowCart(true)}
            className="w-full flex items-center justify-between bg-stone-900 hover:bg-stone-800 text-white font-medium px-5 py-4 rounded-2xl shadow-premium transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="bg-amber-500 text-stone-900 font-bold text-xs w-6 h-6 rounded-full flex items-center justify-center">{cartCount}</span>
              <span>View cart</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-lg">{formatCurrency(cartTotal, restaurant.currency_symbol)}</span>
              <ArrowRight size={16} className="text-stone-400" />
            </div>
          </button>
        </div>
      )}

      {/* Cart drawer */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCart(false)} />
          <div className="relative bg-white rounded-t-3xl max-h-[90vh] flex flex-col shadow-2xl animate-slide-up">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-stone-200" />
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100">
              <h2 className="font-display font-semibold text-stone-900 text-xl">Your Order</h2>
              <button onClick={() => setShowCart(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {/* Cart items */}
              <div className="space-y-3 mb-5">
                {cart.map(item => (
                  <div key={item.menuItemId} className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-2 py-1 flex-shrink-0">
                      <button onClick={() => removeFromCart(item.menuItemId)} className="w-6 h-6 flex items-center justify-center rounded-lg bg-amber-500 text-white">
                        <Minus size={12} />
                      </button>
                      <span className="font-bold text-amber-700 w-4 text-center text-sm">{item.quantity}</span>
                      <button onClick={() => addToCart({ id: item.menuItemId, name: item.name, price: item.price, image_url: item.image_url } as MenuItem)} className="w-6 h-6 flex items-center justify-center rounded-lg bg-amber-500 text-white">
                        <Plus size={12} />
                      </button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-stone-800 font-medium text-sm leading-tight">{item.name}</p>
                      <input
                        className="text-xs text-stone-400 placeholder:text-stone-300 bg-transparent border-b border-stone-100 focus:border-amber-300 focus:outline-none w-full mt-0.5 pb-0.5"
                        placeholder="Special instructions..."
                        value={specialInstructions[item.menuItemId] ?? ''}
                        onChange={e => setSpecialInstructions(prev => ({ ...prev, [item.menuItemId]: e.target.value }))}
                      />
                    </div>
                    <span className="text-stone-700 font-semibold text-sm font-mono flex-shrink-0">
                      {formatCurrency(item.price * item.quantity, restaurant.currency_symbol)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Customer details */}
              <div className="border-t border-stone-100 pt-4 space-y-3">
                <h3 className="text-sm font-semibold text-stone-600 uppercase tracking-wide">Your Details</h3>
                <div>
                  <label className="block text-xs text-stone-500 mb-1">Name *</label>
                  <input
                    className="input-light"
                    style={{ background: '#faf7f2', borderColor: '#e7e5e4', color: '#1c1917' }}
                    placeholder="Your name"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-stone-500 mb-1">Phone (optional)</label>
                  <input
                    className="input-light"
                    style={{ background: '#faf7f2', borderColor: '#e7e5e4', color: '#1c1917' }}
                    placeholder="+91 98765 43210"
                    type="tel"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-stone-500 mb-1">Order notes (optional)</label>
                  <textarea
                    className="input-light resize-none h-16 text-sm"
                    style={{ background: '#faf7f2', borderColor: '#e7e5e4', color: '#1c1917' }}
                    placeholder="Any allergies or special requests..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Order summary + place order */}
            <div className="px-5 pb-8 pt-4 border-t border-stone-100">
              <div className="flex justify-between items-center mb-1 text-sm text-stone-500">
                <span>Subtotal</span>
                <span>{formatCurrency(cartTotal, restaurant.currency_symbol)}</span>
              </div>
              <div className="flex justify-between items-center mb-4 text-sm text-stone-500">
                <span>Tax (5%)</span>
                <span>{formatCurrency(Math.round(cartTotal * 0.05 * 100) / 100, restaurant.currency_symbol)}</span>
              </div>
              <div className="flex justify-between items-center mb-5 font-display font-bold text-xl text-stone-900">
                <span>Total</span>
                <span>{formatCurrency(cartTotal + Math.round(cartTotal * 0.05 * 100) / 100, restaurant.currency_symbol)}</span>
              </div>
              <button
                disabled={placingOrder || cart.length === 0}
                onClick={placeOrder}
                className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-bold py-4 rounded-2xl transition-all text-base shadow-sm"
              >
                {placingOrder ? (
                  <><Loader2 size={18} className="animate-spin" /> Placing order...</>
                ) : (
                  <><Check size={18} /> Place Order</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
