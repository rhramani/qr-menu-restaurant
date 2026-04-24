import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

export function Card({ children, className, hover }: CardProps) {
  return (
    <div className={cn(
      'bg-surface-800 border border-slate-700/60 rounded-xl',
      hover && 'hover:border-slate-600 hover:shadow-card-hover transition-all duration-200 cursor-pointer',
      className
    )}>
      {children}
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon?: React.ReactNode
  className?: string
}

export function StatCard({ label, value, change, changeType = 'neutral', icon, className }: StatCardProps) {
  const changeColor = {
    positive: 'text-green-400',
    negative: 'text-red-400',
    neutral: 'text-slate-500',
  }[changeType]

  return (
    <div className={cn('stat-card', className)}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-slate-500 text-sm font-medium">{label}</p>
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-400">
            {icon}
          </div>
        )}
      </div>
      <p className="font-display text-3xl font-semibold text-slate-100 tracking-tight">{value}</p>
      {change && <p className={cn('text-xs mt-1.5 font-medium', changeColor)}>{change}</p>}
    </div>
  )
}
