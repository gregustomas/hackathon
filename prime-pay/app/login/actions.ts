'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export type ActionState = {
  error: string | null
}

export async function login(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'Špatný email nebo heslo.' }
  }

  // KONTROLA MFA (Dvoufázové ověření)
  const { data: factors, error: mfaError } = await supabase.auth.mfa.listFactors()
  
  if (!mfaError && factors && factors.totp && factors.totp.length > 0) {
    redirect('/auth/mfa')
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const supabaseAdmin = await createAdminClient()

  // Sběr rozšířených dat
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string
  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string
  const phone = formData.get('phone') as string

  if (password !== confirmPassword) {
    return { error: 'Hesla se neshodují.' }
  }
  
  if (password.length < 8) {
     return { error: 'Heslo musí mít alespoň 8 znaků.' }
  }

  // 1. Vytvoření uživatele
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (authError || !authData.user) {
    return { error: authError?.message || 'Registrace selhala. Zkontrolujte údaje.' }
  }

  // 2. Vytvoření rozšířeného profilu (nyní i s telefonem)
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert([{
      id: authData.user.id,
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone: phone || null, // Volitelné, ale doporučené
      role: 'CLIENT'
    }])

  if (profileError) {
    return { error: `Nelze vytvořit profil: ${profileError.message}` } 
  }

  // 3. Založení bankovního účtu s bonusem
  const accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString()
  
  const { error: accountError } = await supabaseAdmin
    .from('accounts')
    .insert([{
      profile_id: authData.user.id,
      account_number: accountNumber,
      balance: 1000.00
    }])

  if (accountError) {
    return { error: `Nelze vytvořit bankovní účet: ${accountError.message}` }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}