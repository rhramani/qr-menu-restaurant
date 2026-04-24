'use client'

import { useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*'

interface RealtimeOptions {
  table: string
  filter?: string
  event?: RealtimeEvent
  onEvent: (payload: unknown) => void
}

export function useRealtime({ table, filter, event = '*', onEvent }: RealtimeOptions) {
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`realtime-${table}-${filter ?? 'all'}`)
      .on(
        'postgres_changes' as any,
        { event, schema: 'public', table, filter },
        onEvent
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, filter, event])
}

export function useOrderRealtime(restaurantId: string | null, onNewOrder: () => void) {
  useRealtime({
    table: 'orders',
    filter: restaurantId ? `restaurant_id=eq.${restaurantId}` : undefined,
    event: 'INSERT',
    onEvent: onNewOrder,
  })
}
