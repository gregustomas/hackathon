'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type MFAActionState = {
  error: string | null
}

export async function verifyMfa(prevState: MFAActionState, formData: FormData): Promise<MFAActionState> {
  const supabase = await createClient()
  const code = formData.get('code') as string

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Uživatel nenalezen nebo vypršelo přihlášení.' }

  try {
    // 1. Zjistíme, jaké MFA faktory má uživatel nastavené
    const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors()
    
    if (factorsError || !factors || factors.totp.length === 0) {
      return { error: 'Uživatel nemá nastavené MFA (TOTP).' }
    }

    // Pro jednoduchost vezmeme první TOTP faktor, který má (většinou je stejně jen jeden)
    const totpFactor = factors.totp[0]

    // 2. Provedeme challenge (ověření kódu proti faktoru)
    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId: totpFactor.id,
    })

    if (challengeError) {
      return { error: 'Nepodařilo se inicializovat ověření.' }
    }

    // 3. Pošleme kód k ověření
    const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
      factorId: totpFactor.id,
      challengeId: challengeData.id,
      code: code
    })

    if (verifyError) {
      return { error: 'Neplatný kód. Zkuste to znovu.' }
    }

  } catch {
    return { error: 'Došlo k neočekávané chybě při ověřování.' }
  }

  redirect('/dashboard')
}