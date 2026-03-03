"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
  balance: number | null;
  status: "active" | "blocked"; // Tohle necháme pro UI logiku
}

export async function getClients(): Promise<Client[]> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
      },
    }
  );

  // Dotaz na správný název sloupce "is_active"
  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email, created_at, is_active")
    .eq("role", "CLIENT")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase error:", error.message);
    throw new Error(error.message);
  }

  // Přemapování is_active (boolean) na status (string) pro tabulku
  return (data ?? []).map((p: any) => ({
    ...p,
    balance: 0, // Zde by přišel join na tabulku accounts, pokud ho potřebuješ
    status: p.is_active ? ("active" as const) : ("blocked" as const),
  }));
}

export async function toggleClientStatus(clientId: string, currentStatus: "active" | "blocked") {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
      },
    }
  );

  const { error } = await supabase
    .from("profiles")
    .update({ is_active: currentStatus === "blocked" }) // Pokud byl blocked, posíláme true
    .eq("id", clientId);

  if (error) throw new Error(error.message);
}