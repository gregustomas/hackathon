'use client'

import { useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function RealtimeNotifications({ accountId }: { accountId: string }) {
  const router = useRouter()
  
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `to_account_id=eq.${accountId}` 
        },
        (payload) => {
          const newTx = payload.new
          
          toast.success('Příchozí platba!', {
            description: `Právě vám přišlo ${Number(newTx.amount).toLocaleString('cs-CZ')} CZK.`,
            duration: 5000,
          })

          router.refresh()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [accountId, router])

  return null 
}
