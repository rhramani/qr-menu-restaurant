'use client'

import { Bell, Menu } from 'lucide-react'
import { useSidebar } from '@/lib/context/sidebar-context'

interface HeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  onMenuClick?: () => void
}

export default function Header({ title, subtitle, actions, onMenuClick }: HeaderProps) {
  const { toggleSidebar } = useSidebar()

  return (
    <header className="sticky top-0 z-30 bg-surface-950/80 backdrop-blur-xl border-b border-slate-800/70">
      <div className="flex items-center justify-between px-4 lg:px-7 h-16">
        <div className="flex items-center gap-3">
          <button 
            onClick={onMenuClick || toggleSidebar}
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <Menu size={20} />
          </button>
          
          <div>
            <h1 className="font-display text-base lg:text-xl font-semibold text-slate-100 leading-none truncate max-w-[150px] sm:max-w-none">{title}</h1>
            {subtitle && <p className="text-slate-500 text-[10px] lg:text-xs mt-1 leading-none">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2 lg:gap-3">
          <div className="hidden sm:flex items-center gap-2 lg:gap-3">
            {actions}
          </div>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors">
            <Bell size={17} />
          </button>
        </div>
      </div>
      {/* Mobile Actions Bar - if needed in future */}
      <div className="sm:hidden flex items-center gap-2 px-4 pb-2 -mt-1 overflow-x-auto scrollbar-none">
        {actions}
      </div>
    </header>
  )
}
