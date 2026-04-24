import { cn } from '@/lib/utils'
import type { OrderStatus } from '@/types'

const orderStatusStyles: Record<OrderStatus, string> = {
  pending: 'bg-amber-500/15 text-amber-400 border-amber-500/25 before:bg-amber-400',
  preparing: 'bg-blue-500/15 text-blue-400 border-blue-500/25 before:bg-blue-400',
  ready: 'bg-green-500/15 text-green-400 border-green-500/25 before:bg-green-400',
  served: 'bg-slate-500/15 text-slate-400 border-slate-500/25 before:bg-slate-400',
  cancelled: 'bg-red-500/15 text-red-400 border-red-500/25 before:bg-red-400',
}

const orderStatusLabels: Record<OrderStatus, string> = {
  pending: 'Pending',
  preparing: 'Preparing',
  ready: 'Ready',
  served: 'Served',
  cancelled: 'Cancelled',
}

interface OrderStatusBadgeProps {
  status: OrderStatus
  className?: string
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  return (
    <span className={cn('badge border', orderStatusStyles[status], className)}>
      {orderStatusLabels[status]}
    </span>
  )
}

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  className?: string
}

const variantStyles = {
  default: 'bg-slate-700 text-slate-300',
  success: 'bg-green-500/15 text-green-400',
  warning: 'bg-amber-500/15 text-amber-400',
  error: 'bg-red-500/15 text-red-400',
  info: 'bg-blue-500/15 text-blue-400',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', variantStyles[variant], className)}>
      {children}
    </span>
  )
}
