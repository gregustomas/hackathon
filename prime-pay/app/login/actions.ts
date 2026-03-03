'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export type ActionState = {
  error: string | null
}

export async function login(prevState: ActionState, formData: FormData): Promise<ActionState> {
  // Inicializujeme jak normálního, tak i admin klienta
  const supabase = await createClient()
  const supabaseAdmin = await createAdminClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // 1. Zkusíme uživatele přihlásit
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // 2. Pokud přihlášení selže, zjistíme, jestli to není kvůli BANu.
    // Použijeme k tomu Admin klienta (obejde RLS), aby se jen nenápadně podíval na `is_active` v profilech
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_active')
      .eq('email', email)
      .maybeSingle()

    // 3. Pokud profil existuje a `is_active` je false, vypíšeme mu jasnou hlášku
    if (profile && profile.is_active === false) {
      return { error: 'Váš účet byl dočasně zablokován administrátorem.' }
    }

    // 4. Pokud to není ban, prostě vypsat, že zadal blbosti
    return { error: 'Špatný email nebo heslo.' }
  }

  // Přihlášení bylo úspěšné - kontrola 2FA
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
      first_name: formData.get('firstName'),
      last_name: formData.get('lastName'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      street: formData.get('street'),   // Nové
      city: formData.get('city'),       // Nové
      zip_code: formData.get('zipCode'), // Nové
      role: 'CLIENT'
    }])

  if (profileError) {
    return { error: `Nelze vytvořit profil: ${profileError.message}` } 
  }

  // 3. Založení bankovního účtu s bonusem
  const BANK_CODE = '8888' 
  
  // Bezpečnější vygenerování 10místného čísla vyplněného nulami (např. 0012345678)
  const randomCore = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0')
  const accountNumber = `${randomCore}/${BANK_CODE}`
  
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