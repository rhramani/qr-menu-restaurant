'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { QrCode, LayoutDashboard, UtensilsCrossed, Table2, Building2, CreditCard, ShoppingBag, LogOut, Settings, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface NavItem {
  href: string
  icon: React.ElementType
  label: string
  badge?: number
}

interface SidebarProps {
  role: 'super_admin' | 'restaurant_admin'
  restaurantName?: string
  pendingOrders?: number
  isOpen?: boolean
  onClose?: () => void
}

const superAdminNav: NavItem[] = [
  { href: '/super-admin', icon: LayoutDashboard, label: 'Overview' },
  { href: '/super-admin/restaurants', icon: Building2, label: 'Restaurants' },
  { href: '/super-admin/plans', icon: CreditCard, label: 'Plans' },
  { href: '/super-admin/subscriptions', icon: ShoppingBag, label: 'Subscriptions' },
]

const restaurantAdminNav: NavItem[] = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/orders', icon: ShoppingBag, label: 'Orders' },
  { href: '/dashboard/menu', icon: UtensilsCrossed, label: 'Menu' },
  { href: '/dashboard/tables', icon: Table2, label: 'Tables & QR' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar({ role, restaurantName, pendingOrders, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const nav = role === 'super_admin' ? superAdminNav : restaurantAdminNav

  async function handleSignOut() {
    await supabase.auth.signOut()
    toast.success('Signed out')
    router.push('/login')
    router.refresh()
  }

  const isActive = (href: string) => {
    if (href === '/super-admin' || href === '/dashboard') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-surface-950 border-r border-slate-800/80 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Brand */}
        <div className="px-5 py-5 border-b border-slate-800/60 flex items-center justify-between">
          <Link 
            href={role === 'super_admin' ? '/super-admin' : '/dashboard'} 
            className="flex items-center gap-2.5"
            onClick={onClose}
          >
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center flex-shrink-0">
              <QrCode size={16} className="text-slate-900" />
            </div>
            <div className="min-w-0">
              <span className="font-display font-semibold text-slate-100 text-base block">QRBite</span>
              {restaurantName && (
                <span className="text-xs text-slate-500 truncate block">{restaurantName}</span>
              )}
            </div>
          </Link>
          
          <button 
            onClick={onClose}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Role badge */}
        <div className="px-4 pt-4 pb-2">
          <div className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium',
            role === 'super_admin'
              ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          )}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {role === 'super_admin' ? 'Super Admin' : 'Restaurant Admin'}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {nav.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                'sidebar-link group',
                isActive(href) && 'active'
              )}
            >
              <Icon size={17} className="flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {label === 'Orders' && pendingOrders && pendingOrders > 0 ? (
                <span className="text-xs bg-brand-500 text-slate-900 font-bold px-1.5 py-0.5 rounded-md min-w-[20px] text-center status-pulse-amber">
                  {pendingOrders}
                </span>
              ) : isActive(href) ? (
                <ChevronRight size={13} className="text-brand-400/60" />
              ) : null}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800/60">
          <button
            onClick={handleSignOut}
            className="sidebar-link w-full text-left hover:text-red-400 hover:bg-red-500/10"
          >
            <LogOut size={17} className="flex-shrink-0" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  )
}
