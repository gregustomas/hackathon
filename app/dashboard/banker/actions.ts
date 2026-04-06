"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// 1. Akce pro Resetování MFA (2FA) uživatele
export async function resetClientMfa(userId: string) {
    const supabaseAdmin = await createAdminClient();

    try {
        // A) Najdeme všechny aktuální MFA faktory uživatele
        const { data: factors, error: listError } = await supabaseAdmin.auth.admin.mfa.listFactors({
            userId: userId
        });

        if (listError) throw listError;

        if (!factors || factors.factors.length === 0) {
            return { success: false, message: "Tento uživatel nemá nastavené žádné MFA (2FA)." };
        }

        // B) Smažeme je jeden po druhém
        for (const factor of factors.factors) {
            const { error: deleteError } = await supabaseAdmin.auth.admin.mfa.deleteFactor({
                id: factor.id,
                userId: userId
            });
            if (deleteError) throw deleteError;
        }

        // Logování pro audit (abychom věděli, který bankéř mu to zrušil)
        const { data: { user: bankerUser } } = await supabaseAdmin.auth.getUser();
        await supabaseAdmin.from("admin_logs").insert({
            user_email: bankerUser?.email || "Bankéř",
            action_type: 'MFA_RESET',
            message: `Bankéř resetoval 2FA pro účet ID: ${userId}`,
            severity: 'warning'
        });

        revalidatePath("/dashboard/banker");
        return { success: true, message: "MFA bylo úspěšně odstraněno. Klient si ho musí nastavit znovu." };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error("Chyba při resetu MFA:", error);
        return { success: false, message: error.message };
    }
}

// 2. Akce pro navýšení nadstandardního limitu pro účet
export async function updateAccountLimit(accountId: string, newLimit: number) {
    const supabaseAdmin = await createAdminClient();

    try {
        const { error } = await supabaseAdmin
            .from("accounts")
            .update({ daily_limit: newLimit })
            .eq("id", accountId);

        if (error) throw error;

        revalidatePath("/dashboard/banker");
        return { success: true, message: "Limit úspěšně aktualizován." };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
         return { success: false, message: error.message };
    }
}
