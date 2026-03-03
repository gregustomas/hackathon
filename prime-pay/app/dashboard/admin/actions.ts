"use server";

import { createAdminClient } from "@/lib/supabase/server"; 
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Client } from "@/interfaces/admin";
import { revalidatePath } from "next/cache";

// =====================================
// 1. NAČÍTÁNÍ UŽIVATELŮ (bez rekurze díky Adminovi)
// =====================================
export async function getUsers(role: "CLIENT" | "BANKER"): Promise<Client[]> {
  const supabaseAdmin = await createAdminClient();

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select(`
      id, 
      first_name, 
      last_name, 
      email, 
      created_at, 
      is_active,
      accounts(id, account_number, balance)
    `)
    .eq("role", role)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Chyba při stahování klientů:", error);
    throw new Error(error.message);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((p: any) => ({
    id: p.id,
    first_name: p.first_name,
    last_name: p.last_name,
    email: p.email,
    created_at: p.created_at,
    role: role,
    status: p.is_active ? ("active" as const) : ("blocked" as const),
    accounts: p.accounts ? (Array.isArray(p.accounts) ? p.accounts : [p.accounts]) : []
  }));
}

// =====================================
// 2. SOFT DELETE & RESTORE S LOGOVÁNÍM
// =====================================
export async function toggleUserStatus(targetUserId: string, currentStatus: "active" | "blocked") {
  const supabaseAdmin = await createAdminClient();
  const newIsActive = currentStatus === "blocked"; // Pokud byl zablokován, chceme ho aktivovat a naopak
  const actionType = newIsActive ? "UNBLOCK" : "BLOCK";

  try {
    // A) Zjistíme email Admina, který klikl na tlačítko (přes klasický user session)
    const cookieStore = await cookies();
    const supabaseUser = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll(); } } }
    );
    const { data: { user: adminUser } } = await supabaseUser.auth.getUser();

    // B) Zjistíme jméno a email toho, koho blokujeme (pro zápis do zprávy v logu)
    const { data: targetProfile } = await supabaseAdmin
        .from("profiles")
        .select("email, first_name, last_name")
        .eq("id", targetUserId)
        .single();
    
    const targetIdentifier = targetProfile 
        ? `${targetProfile.first_name} ${targetProfile.last_name} (${targetProfile.email})` 
        : targetUserId;

    // C) Soft Delete / Restore (update is_active v public.profiles)
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ is_active: newIsActive })
      .eq("id", targetUserId);

    if (profileError) throw new Error(profileError.message);

    // D) Znemožníme mu úplně login do appky (v auth.users)
    if (!newIsActive) {
      await supabaseAdmin.auth.admin.updateUserById(targetUserId, { ban_duration: '87600h' });
    } else {
      await supabaseAdmin.auth.admin.updateUserById(targetUserId, { ban_duration: 'none' });
    }

    // E) Zápis do tvé specifické tabulky admin_logs
    await supabaseAdmin.from("admin_logs").insert({
        user_email: adminUser?.email || "Neznámý admin",
        action_type: actionType,
        message: `Admin ${newIsActive ? 'odblokoval' : 'zablokoval'} účet: ${targetIdentifier}`,
        severity: newIsActive ? 'info' : 'warning'
    });

    revalidatePath("/dashboard/admin");
    return { success: true };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Nepodařilo se změnit stav uživatele:", error);
    return { success: false, message: error.message };
  }
}

export async function getAdminLogs() {
  const supabaseAdmin = await createAdminClient();
  
  const { data, error } = await supabaseAdmin
    .from("admin_logs")
    .select("id, created_at, user_email, action_type, message, severity")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Chyba při načítání logů:", error);
    return [];
  }
  
  return data || [];
}
