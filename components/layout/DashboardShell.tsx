'use client'

import { SidebarProvider, useSidebar } from '@/lib/context/sidebar-context'
import Sidebar from './Sidebar'

interface DashboardShellProps {
  children: React.ReactNode
  role: 'super_admin' | 'restaurant_admin'
  restaurantName?: string
  pendingOrders?: number
}

function ShellInner({ children, role, restaurantName, pendingOrders }: DashboardShellProps) {
  const { isSidebarOpen, closeSidebar } = useSidebar()

  return (
    <div className="flex min-h-screen bg-surface-950">
      <Sidebar 
        role={role} 
        restaurantName={restaurantName} 
        pendingOrders={pendingOrders} 
        isOpen={isSidebarOpen} 
        onClose={closeSidebar} 
      />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0">
          {children}
        </div>
      </div>
    </div>
  )
}

export default function DashboardShell(props: DashboardShellProps) {
  return (
    <SidebarProvider>
      <ShellInner {...props} />
    </SidebarProvider>
  )
}
