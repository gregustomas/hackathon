"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";

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
