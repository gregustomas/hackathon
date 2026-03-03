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
  status: "active" | "blocked";
  role: "CLIENT" | "BANKER";
}

// Přidán parametr role
export async function getUsers(role: "CLIENT" | "BANKER"): Promise<Client[]> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
      },
    },
  );

  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email, created_at, is_active")
    .eq("role", role) // Filtrujeme podle role
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((p: any) => ({
    ...p,
    balance: 0, 
    status: p.is_active ? ("active" as const) : ("blocked" as const),
  }));
}