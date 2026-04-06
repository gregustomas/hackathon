"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { jwtDecode, type JwtPayload } from "jwt-decode";

export async function changePassword(
    currentPassword: string,
    newPassword: string
): Promise<{ error: string | null }> {
    const cookieStore = await cookies();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll(); },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch { }
                },
            },
        }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user?.email) return { error: "Nejste přihlášen." };

    // Ověření současného hesla
    const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
    });
    if (signInError) return { error: "Současné heslo není správné." };

    if (currentPassword === newPassword) {
        return { error: "Nové heslo musí být jiné než současné." };
    }

    const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
    });

    if (updateError) {
        if (updateError.status === 429) return { error: "Příliš mnoho pokusů, zkuste za chvíli." };
        return { error: updateError.message };
    }

    // Po updateUser Supabase invaliduje session a vytvoří novou s novým session_id.
    // getSession() vrací cached hodnotu — musíme použít refreshSession() pro nové tokeny.
    // Bez uložení nového session_id by proxy vyhodnotila session jako stale → redirect loop.
    const { data: { session: newSession } } = await supabase.auth.refreshSession();
    if (newSession?.access_token) {
        try {
            type SessionClaims = JwtPayload & { session_id?: string };
            const decoded = jwtDecode<SessionClaims>(newSession.access_token);
            if (decoded.session_id) {
                const supabaseAdmin = await createAdminClient();
                await supabaseAdmin
                    .from("profiles")
                    .update({ current_session_id: decoded.session_id })
                    .eq("id", user.id);
            }
        } catch { /* session_id se nepodařilo přečíst, nevadí */ }
    }

    return { error: null };
}

export async function unenrollMyMfa() {
    const cookieStore = await cookies();
    
    // 1. Klient s aktuálním session
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll() { return cookieStore.getAll(); } } }
    );

    // 2. Admin klient pro bezpečné přečtení skutečné role
    const supabaseAdmin = await createAdminClient();

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Nejste přihlášen.");


        const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (!profile) throw new Error("Profil nenalezen.");

        // Pokud je to klient nebo dítě, okamžitě akci zablokujeme
        if (profile.role === "CLIENT" || profile.role === "CHILD") {
            return { 
                success: false, 
                message: "Z bezpečnostních důvodů (ochrana majetku) nemůžete 2FA zrušit sami. Kontaktujte svého bankéře." 
            };
        }

        const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
        
        if (listError) throw listError;
        
        if (!factors || factors.totp.length === 0) {
            return { success: false, message: "Nemáte aktivní žádné 2FA." };
        }

        for (const factor of factors.totp) {
            const { error: unenrollError } = await supabase.auth.mfa.unenroll({
                factorId: factor.id
            });
            if (unenrollError) throw unenrollError;
        }

        revalidatePath("/dashboard/settings");
        return { success: true, message: "Vaše 2FA bylo úspěšně vypnuto." };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}
