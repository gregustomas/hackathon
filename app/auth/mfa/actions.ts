'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export type MFAActionState = { 
  error: string | null; 
  success?: boolean; 
}

export async function verifyLoginMfa(prevState: MFAActionState, formData: FormData): Promise<MFAActionState> {
  const code = formData.get('code') as string
  const supabase = await createClient()

  try {
    const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors()
    
    if (factorsError || !factors || !factors.totp || factors.totp.length === 0) {
      return { error: 'Ověření není nastaveno.' }
    }

    const verifiedFactor = factors.totp.find(f => f.status === 'verified')
    if (!verifiedFactor) return { error: 'Nenalezen žádný aktivní faktor.' }

    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId: verifiedFactor.id,
    })

    if (challengeError) return { error: 'Nepodařilo se komunikovat se serverem.' }

    const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
      factorId: verifiedFactor.id,
      challengeId: challengeData.id,
      code
    })

    if (verifyError) {
      console.error("MFA Verify Error:", verifyError.message)
      return { error: 'Neplatný kód!' }
    }

     await supabase.auth.refreshSession()
  } catch  {
    return { error: 'Kritická chyba ověření.' }
  }

  return { error: null, success: true }

}
