"use server";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/server";
import { jwtDecode } from "jwt-decode";

interface DeviceRow {
  id: string;
  session_id: string;
  user_agent: string | null;
  ip_address: string | null;
  created_at: string;
  last_seen_at: string;
}

interface SessionClaims {
  session_id?: string;
}

export interface DevicesResult {
  currentSessionId: string | null;
  devices: DeviceRow[];
}

export async function getDevices(): Promise<DevicesResult> {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Nejste přihlášen.");
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  let currentSessionId: string | null = null;
  if (session) {
    try {
      const decoded = jwtDecode<SessionClaims>(session.access_token);
      currentSessionId = decoded.session_id ?? null;
    } catch {
      currentSessionId = null;
    }
  }

  const supabaseAdmin = await createAdminClient();

  const { data, error } = await supabaseAdmin
    .from("user_devices")
    .select("id, session_id, user_agent, ip_address, created_at, last_seen_at")
    .eq("user_id", user.id)
    .order("last_seen_at", { ascending: false })
    .returns<DeviceRow[]>();

  if (error) {
    throw new Error("Nepodařilo se načíst přihlášená zařízení.");
  }

  return {
    currentSessionId,
    devices: data ?? [],
  };
}

export async function revokeDevice(deviceId: string): Promise<{ success: boolean }> {
  const supabaseAdmin = await createAdminClient();

  // smažeme záznam v user_devices – session zůstane, ale tvůj guard ji už stejně ignoruje,
  // případně bys tady mohl ještě navíc signoutnout session přes admin API, pokud to přidají
  const { error } = await supabaseAdmin
    .from("user_devices")
    .delete()
    .eq("id", deviceId);

  if (error) {
    throw new Error("Nepodařilo se odhlásit zařízení.");
  }

  return { success: true };
}

export async function revokeAllDevices(): Promise<{ success: boolean }> {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Nejste přihlášen.");
  }

  const supabaseAdmin = await createAdminClient();

  const { error } = await supabaseAdmin
    .from("user_devices")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    throw new Error("Nepodařilo se odhlásit všechna zařízení.");
  }

  return { success: true };
}
