'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { SavedRecipient } from '@/types/dashboard'

export async function getSavedRecipients(profileId: string): Promise<SavedRecipient[]> {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('saved_recipients')
    .select('id, account_number, label')
    .eq('profile_id', profileId)
    .order('label', { ascending: true })

  if (error) {
    console.error('getSavedRecipients error:', error.message)
    return []
  }

  return (data ?? []) as SavedRecipient[]
}

export async function saveRecipient({
  profileId,
  accountNumber,
  label,
}: {
  profileId: string
  accountNumber: string
  label: string
}): Promise<{ error: string | null }> {
  if (!label.trim() || label.trim().length > 40) {
    return { error: 'Název musí mít 1–40 znaků.' }
  }

  const supabase = await createAdminClient()
  const { error } = await supabase.from('saved_recipients').insert({
    profile_id: profileId,
    account_number: accountNumber,
    label: label.trim(),
  })

  if (error) {
    if (error.code === '23505') {
      return { error: 'Příjemce s tímto číslem účtu je již uložen.' }
    }
    return { error: 'Příjemce se nepodařilo uložit.' }
  }

  revalidatePath('/dashboard/client')
  revalidatePath('/dashboard/child')
  revalidatePath('/dashboard/settings')
  return { error: null }
}

export async function deleteRecipient({
  recipientId,
  profileId,
}: {
  recipientId: string
  profileId: string
}): Promise<{ error: string | null }> {
  const supabase = await createAdminClient()
  const { error } = await supabase
    .from('saved_recipients')
    .delete()
    .eq('id', recipientId)
    .eq('profile_id', profileId)

  if (error) {
    return { error: 'Příjemce se nepodařilo smazat.' }
  }

  revalidatePath('/dashboard/settings')
  return { error: null }
}
