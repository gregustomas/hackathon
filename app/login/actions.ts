'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { createVirtualCardForAccount } from '@/lib/cards/create-virtual-card'
import type { JwtPayload } from "jwt-decode";
import { jwtDecode } from "jwt-decode";


export type ActionState = {
  error: string | null
}

type UserRole = "CLIENT" | "CHILD" | "BANKER" | "ADMIN"


type ProfileRow = {
  is_active: boolean | null;
  role: UserRole;
  current_session_id?: string | null;
};

export async function login(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const supabaseAdmin = await createAdminClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !signInData.user || !signInData.session) {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("is_active, role")
      .eq("email", email)
      .maybeSingle();

    if (profile && profile.is_active === false) {
      return { error: "Váš účet byl dočasně zablokován administrátorem." };
    }

    return { error: "Špatný email nebo heslo." };
  }

  const userId = signInData.user.id;
  const session = signInData.session;

  // 3. Získání session_id z JWT (claim "session_id")
  type SessionClaims = JwtPayload & { session_id?: string };

  let sessionId: string | null = null;
  try {
    const decoded = jwtDecode<SessionClaims>(session.access_token);
    sessionId = decoded.session_id ?? null;
  } catch {
    sessionId = null;
  }

  if (sessionId) {
    await supabaseAdmin
      .from("profiles")
      .update({ current_session_id: sessionId })
      .eq("id", userId);
  }

  // 4. Kontrola 2FA
  const { data: factors, error: mfaError } = await supabase.auth.mfa.listFactors();

  if (!mfaError && factors?.totp && factors.totp.length > 0) {
    redirect("/auth/mfa");
  }

  // 5. Přesměrování dle role
  const { data: profileData } = await supabaseAdmin
    .from("profiles")
    .select("is_active, role")
    .eq("id", userId)
    .maybeSingle();

  const profile = profileData as ProfileRow | null;

  if (profile?.is_active === false) {
    await supabase.auth.signOut();
    return { error: "Váš účet byl dočasně zablokován administrátorem." };
  }

  revalidatePath("/", "layout");

  const role = profile?.role;

  if (role === "ADMIN" || role === "BANKER") redirect("/dashboard/admin");
  else if (role === "CHILD") redirect("/dashboard/child");
  else redirect("/dashboard/client");
}



export async function signup(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const supabaseAdmin = await createAdminClient()

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
  const { data: authData, error: authError } = await supabase.auth.signUp({ email, password })

  if (authError || !authData.user) {
    return { error: authError?.message ?? 'Registrace selhala. Zkontrolujte údaje.' }
  }

  // 2. Vytvoření profilu
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert([{
      id: authData.user.id,
      first_name: formData.get('firstName'),
      last_name: formData.get('lastName'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      street: formData.get('street'),
      city: formData.get('city'),
      zip_code: formData.get('zipCode'),
      role: 'CLIENT',
      is_active: true,
    }])

  if (profileError) {
    return { error: `Nelze vytvořit profil: ${profileError.message}` }
  }

  // 3. Vytvoření bankovního účtu
  const BANK_CODE = '8888'
  const randomCore = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0')
  const accountNumber = `${randomCore}/${BANK_CODE}`
  const initialDailyLimit = 5000

  const { data: newAccount, error: accountError } = await supabaseAdmin
    .from('accounts')
    .insert([{
      profile_id: authData.user.id,
      account_number: accountNumber,
      balance: 1000.00,
      daily_limit: initialDailyLimit,
      is_active: true,
    }])
    .select('id')
    .single()

  if (accountError || !newAccount) {
    return { error: `Nelze vytvořit bankovní účet: ${accountError?.message}` }
  }

  // 4. Vytvoření virtuální karty
  try {
    await createVirtualCardForAccount({
      supabaseAdmin,
      accountId: newAccount.id,
      dailyLimit: initialDailyLimit,
    })
  } catch (cardError) {
    const message = cardError instanceof Error ? cardError.message : 'Neznámá chyba'
    return { error: `Nelze vytvořit kartu: ${message}` }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard/client')
}
