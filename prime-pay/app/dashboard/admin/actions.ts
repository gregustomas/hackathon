'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export type PaymentState = { error: string | null; success?: boolean }

export async function processPayment(prevState: PaymentState, formData: FormData): Promise<PaymentState> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [] } }
  )

  const senderAccountId = formData.get('senderAccountId') as string
  const targetAccountNumber = formData.get('accountNumber') as string
  const amountStr = formData.get('amount') as string
  const description = formData.get('description') as string || 'Platba'
  const idempotencyKey = formData.get('idempotencyKey') as string

  const amount = parseFloat(amountStr)
  if (isNaN(amount) || amount <= 0) return { error: 'Částka musí být větší než 0.' }

  // 1. Najdeme účet příjemce
  const { data: receiverAccount, error: accError } = await supabase
    .from('accounts').select('id').eq('account_number', targetAccountNumber).single()

  if (accError || !receiverAccount) return { error: 'Účet příjemce neexistuje.' }

  // 2. Zavoláme bezpečnou databázovou funkci
  const { error: transferError } = await supabase.rpc('transfer_money', {
    p_from_account_id: senderAccountId,
    p_to_account_id: receiverAccount.id,
    p_amount: amount,
    p_description: description,
    p_idempotency_key: idempotencyKey
  })

  if (transferError) {
    if (transferError.message.includes('Insufficient funds')) return { error: 'Nemáte dostatek prostředků.' }
    if (transferError.message.includes('same account')) return { error: 'Nemůžete poslat peníze sami sobě.' }
    if (transferError.message.includes('unique constraint')) return { error: 'Tato platba již proběhla.' }
    return { error: 'Transakce selhala.' }
  }

  // Obnoví data na stránce
  revalidatePath('/dashboard/client')
  return { error: null, success: true }
}
