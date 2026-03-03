'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export type ActionState = {
  error: string | null
}

export async function login(prevState: ActionState, formData: FormData): Promise<ActionState> {
  console.log("--> ZAČÁTEK LOGIN AKCE")
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // 1. Zkusíme přihlásit uživatele přes Supabase Auth
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error("❌ Chyba přihlášení:", error.message)
    return { error: 'Špatný email nebo heslo.' }
  }

  console.log("✅ Uživatel ověřen. Kontroluji MFA...")

  // 2. KONTROLA MFA (Dvoufázové ověření)
  const { data: factors, error: mfaError } = await supabase.auth.mfa.listFactors()
  
  // Pokud listFactors selže nebo má uživatel MFA nastavené
  if (!mfaError && factors && factors.totp && factors.totp.length > 0) {
    console.log("⚠️ Uživatel má MFA. Přesměrovávám na ověření kódu.")
    redirect('/auth/mfa')
  }

  // 3. Přihlášení bylo úspěšné a MFA není vyžadováno
  console.log("✅ Přihlášení úspěšné, jdeme na dashboard.")
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(prevState: ActionState, formData: FormData): Promise<ActionState> {
  console.log("--> ZAČÁTEK SIGNUP AKCE") 
  
  // 1. Obyčejný klient pro přihlášení (uloží cookies do prohlížeče)
  const supabase = await createClient()
  // 2. Admin klient s plnými právy k zápisu do databáze (ignoruje RLS)
  const supabaseAdmin = await createAdminClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string

  // Krok 1: Vytvoření v Auth (přes normálního klienta)
  console.log("Krok 1: Volám supabase.auth.signUp...")
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (authError || !authData.user) {
    return { error: authError?.message || 'Registrace selhala.' }
  }

  // Krok 2: Zápis do profiles (PŘES ADMIN KLIENTA!)
  console.log("Krok 2: Zapisuji do tabulky profiles (jako Admin)...")
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert([{
      id: authData.user.id,
      first_name: firstName,
      last_name: lastName,
      email: email,
      role: 'CLIENT'
    }])

  if (profileError) {
    console.error("❌ Chyba:", profileError)
    return { error: `Nelze vytvořit profil: ${profileError.message}` } 
  }

  // Krok 3: Vytvoření účtu (PŘES ADMIN KLIENTA!)
  console.log("Krok 3: Vytvářím bankovní účet...")
  const accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString()
  
  const { error: accountError } = await supabaseAdmin
    .from('accounts')
    .insert([{
      profile_id: authData.user.id,
      account_number: accountNumber,
      balance: 1000.00
    }])

  if (accountError) {
    console.error("❌ Chyba:", accountError)
    return { error: `Nelze vytvořit bankovní účet: ${accountError.message}` }
  }

  console.log("✅ Vše úspěšně vytvořeno!")
  
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}