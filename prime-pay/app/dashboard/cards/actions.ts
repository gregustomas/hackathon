'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function generateVirtualCard(accountId: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [] } }
  )

  const prefix = Math.random() > 0.5 ? '4' : '5'
  const cardNumber = prefix + Math.random().toString().slice(2, 17)
  
  const cvv = Math.floor(100 + Math.random() * 900).toString() 
  
  const today = new Date()
  const expMonth = String(today.getMonth() + 1).padStart(2, '0')
  const expYear = String(today.getFullYear() + 3).slice(-2) 
  const expiryDate = `${expMonth}/${expYear}`

  // 2. Uložení do databáze 
  const { error } = await supabase
    .from('cards')
    .insert([{
      account_id: accountId,
      card_number: cardNumber,
      expiry_date: expiryDate,
      cvv: cvv,
      is_active: true,
      daily_limit: 5000.00
    }])

  if (error) {
    return { error: 'Nepodařilo se vygenerovat kartu. Zkuste to prosím znovu.' }
  }

  revalidatePath('/dashboard/cards')
  return { success: true }
}

export async function blockCard(cardId: string) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [] } }
  )

  const { error } = await supabase
    .from('cards')
    .update({ is_active: false })
    .eq('id', cardId)

  if (error) return { error: 'Nepodařilo se zablokovat kartu.' }

  revalidatePath('/dashboard/cards')
  return { success: true }
}

export async function updateCardLimits(cardId: string, paymentLimit: number, atmLimit: number) {
  // Ochrana před nesmyslnými limity
  if (paymentLimit < 0 || paymentLimit > 1000000 || atmLimit < 0 || atmLimit > 1000000) {
    return { error: 'Neplatná hodnota limitu.' }
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [] } }
  )

  const { error } = await supabase
    .from('cards')
    .update({ 
      daily_limit: paymentLimit, 
      atm_limit: atmLimit 
    })
    .eq('id', cardId)

  if (error) {
    return { error: 'Nepodařilo se aktualizovat limity karty.' }
  }

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard/cards')
  revalidatePath('/dashboard/client')
  
  return { success: true }
}
