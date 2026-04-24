'use client'

import { Bell, Search } from 'lucide-react'

interface HeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export default function Header({ title, subtitle, actions }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-surface-950/80 backdrop-blur-xl border-b border-slate-800/70">
      <div className="flex items-center justify-between px-7 h-16">
        <div>
          <h1 className="font-display text-xl font-semibold text-slate-100 leading-none">{title}</h1>
          {subtitle && <p className="text-slate-500 text-xs mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-3">
          {actions}
          <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors">
            <Bell size={17} />
          </button>
        </div>
      </div>
    </header>
  )
}
