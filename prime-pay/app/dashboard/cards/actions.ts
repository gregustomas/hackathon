'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

type CardUnblockStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

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

// @/app/dashboard/cards/actions.ts

export async function deleteCard(cardId: string) {
  // 1. Použijte SERVICE_ROLE_KEY pro obcházení RLS a plný přístup
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Změna zde!
    { cookies: { getAll: () => [] } }
  );

  // 2. Nejdříve musíme smazat všechny žádosti o odblokování spojené s touto kartou
  // Jinak nám DB vyhodí chybu (foreign key constraint)
  await supabase
    .from("card_unblock_requests")
    .delete()
    .eq("card_id", cardId);

  // 3. Nyní můžeme smazat samotnou kartu
  const { error } = await supabase
    .from("cards")
    .delete()
    .eq("id", cardId);

  if (error) {
    console.error("Detail chyby při mazání:", error.message);
    return { error: "Nepodařilo se odstranit kartu z databáze." };
  }

  // 4. Revalidace všech cest, kde se karta může vyskytovat
  revalidatePath("/dashboard/client");
  revalidatePath("/dashboard/cards");
  
  return { success: true };
}

export async function updateCardLimits(cardId: string, paymentLimit: number, atmLimit: number) {
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

export async function requestCardUnblock(params: {
  profileId: string
  accountId: string
  cardId: string
}) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [] } }
  )

  const { error } = await supabase
    .from('card_unblock_requests')
    .insert({
      profile_id: params.profileId,
      account_id: params.accountId,
      card_id: params.cardId,
      status: 'PENDING' as CardUnblockStatus,
    })

  if (error) {
    console.error('Chyba při odesílání žádosti o odblokování karty:', error.message)
    return {
      ok: false as const,
      message: 'Nepodařilo se odeslat žádost o odblokování karty.',
    }
  }

  revalidatePath('/dashboard/banker')

  return { ok: true as const }
}

export async function resolveCardUnblockRequest(params: {
  requestId: string
  newStatus: Exclude<CardUnblockStatus, 'PENDING'>
}) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [] } }
  )

  const { data: request, error: fetchError } = await supabase
    .from('card_unblock_requests')
    .select('id, status, card_id')
    .eq('id', params.requestId)
    .maybeSingle()

  if (fetchError || !request) {
    console.error('Žádost o odblokování nenalezena:', fetchError?.message)
    return {
      ok: false as const,
      message: 'Žádost o odblokování nebyla nalezena.',
    }
  }

  if (request.status !== 'PENDING') {
    return {
      ok: false as const,
      message: 'Žádost už byla vyřízena.',
    }
  }

  const { error: updateReqError } = await supabase
    .from('card_unblock_requests')
    .update({ status: params.newStatus })
    .eq('id', params.requestId)

  if (updateReqError) {
    console.error('Chyba při aktualizaci žádosti o odblokování:', updateReqError.message)
    return {
      ok: false as const,
      message: 'Nepodařilo se aktualizovat stav žádosti.',
    }
  }

  if (params.newStatus === 'APPROVED') {
    const { error: cardError } = await supabase
      .from('cards')
      .update({ is_active: true })
      .eq('id', request.card_id)

    if (cardError) {
      console.error('Chyba při odblokování karty:', cardError.message)
      return {
        ok: false as const,
        message: 'Žádost byla schválena, ale kartu se nepodařilo odblokovat.',
      }
    }
  }

  revalidatePath('/dashboard/banker')
  revalidatePath('/dashboard/client')
  revalidatePath('/dashboard/cards')

  return { ok: true as const }
}
