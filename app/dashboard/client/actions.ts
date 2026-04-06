'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@supabase/ssr'

export type PaymentState = { error: string | null; success?: boolean }

export async function processPayment(prevState: PaymentState | null, formData: FormData): Promise<PaymentState> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [] } }
  )

  const senderAccountId = formData.get('senderAccountId') as string
  const targetAccountNumber = formData.get('accountNumber') as string
  const amountStr = formData.get('amount') as string
  const rawDescription = formData.get('description') as string || ''
  const idempotencyKey = formData.get('idempotencyKey') as string
  
  // Získáme nový typ platby, co jsme přidali ve frontendu (TRANSFER nebo CARD)
  const paymentType = formData.get('paymentType') as string || 'TRANSFER'

  const amount = parseFloat(amountStr)
  if (isNaN(amount) || amount <= 0) return { error: 'Částka musí být větší než 0.' }

  // 1. Upravíme popis platby podle typu, aby to bylo v historii krásně vidět
  const defaultDescription = paymentType === 'CARD' ? 'Platba kartou' : 'Převod na účet'
  const finalDescription = rawDescription 
    ? (paymentType === 'CARD' ? `[KARTA] ${rawDescription}` : rawDescription) 
    : defaultDescription;

  // 2. Najdeme účet příjemce (nebo "Obchodníka" v případě karty)
  const { data: receiverAccount, error: accError } = await supabase
    .from('accounts')
    .select('id')
    .eq('account_number', targetAccountNumber)
    .single()

  if (accError || !receiverAccount) {
    // Upravíme chybovou hlášku podle kontextu platby
    return { error: paymentType === 'CARD' ? 'Terminál / Obchodník s tímto ID neexistuje.' : 'Účet příjemce neexistuje.' }
  }

  // 3. Zavoláme bezpečnou databázovou funkci
  const { error: transferError } = await supabase.rpc('transfer_money', {
    p_from_account_id: senderAccountId,
    p_to_account_id: receiverAccount.id,
    p_amount: amount,
    p_description: finalDescription,
    p_idempotency_key: idempotencyKey
  })

  // 4. Zpracování chyb z RPC funkce
  if (transferError) {
    if (transferError.message.includes('Insufficient funds')) return { error: 'Nemáte dostatek prostředků.' }
    if (transferError.message.includes('same account')) return { error: 'Nemůžete poslat peníze sami sobě.' }
    if (transferError.message.includes('unique constraint')) return { error: 'Tato platba již proběhla.' }
    
    // Fallback pro logování během hackathonu
    console.error("Transfer RPC Error:", transferError)
    return { error: 'Transakce selhala. Zkuste to prosím znovu.' }
  }

  // Obnoví data na všech důležitých stránkách po provedení platby
  revalidatePath('/dashboard/client')
  revalidatePath('/dashboard/history')
  
  return { error: null, success: true }
}
