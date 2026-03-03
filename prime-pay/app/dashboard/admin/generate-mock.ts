"use server";

import { createAdminClient } from "@/lib/supabase/server";

export async function generateMockData() {
    const supabaseAdmin = await createAdminClient();
    const results = [];

    try {
        // ==========================================
        // 1. GENERUJEME 5 KLIENTŮ
        // ==========================================
        for (let i = 1; i <= 5; i++) {
            const email = `klient${i}@test.cz`;
            const firstName = `Jan${i}`;
            const lastName = `Novák${i}`;

            // A) Vytvoření uživatele v auth.users
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email: email,
                password: "password123",
                email_confirm: true,
                user_metadata: { first_name: firstName, last_name: lastName }
            });

            if (authError) {
                console.error(`Chyba vytvoření (Auth) ${email}:`, authError.message);
                continue; 
            }

            const userId = authData.user.id;

            // B) RUČNÍ VYTVOŘENÍ PROFILU (Obejmutí chybějícího triggeru)
            // Ujistíme se, že profil fakt existuje, než mu dáme účet
            const { error: profileError } = await supabaseAdmin.from("profiles")
                .upsert({ 
                    id: userId, 
                    first_name: firstName,
                    last_name: lastName,
                    email: email,
                    role: "CLIENT",
                    is_active: true
                });

            if (profileError) {
                console.error(`Chyba vytvoření (Profile) ${email}:`, profileError.message);
                continue; // Pokud se nepovedl profil, nebudeme mu dělat účet
            }

            // C) Vytvoření bankovního účtu
            const randomBalance = Math.floor(Math.random() * (500000 - 1000 + 1) + 1000);
            const { data: accountData, error: accError } = await supabaseAdmin.from("accounts")
                .insert({
                    profile_id: userId,
                    account_number: `200000000${i}/8888`,
                    currency: "CZK",
                    balance: randomBalance,
                    is_active: true
                })
                .select("id")
                .single();

            if (accError) console.error("Chyba účtu:", accError.message);

            // D) Vytvoření karty k tomuto účtu
            if (accountData) {
                await supabaseAdmin.from("cards").insert({
                    account_id: accountData.id,
                    card_number: `453211112222333${i}`,
                    expiry_date: "12/28",
                    cvv: String(Math.floor(Math.random() * 899) + 100).padStart(3, '0'),
                    daily_limit: 50000,
                    is_active: true
                });
            }
            
            results.push(`Klient ${i} vytvořen`);
        }

        // ==========================================
        // 2. GENERUJEME 2 BANKÉŘE
        // ==========================================
        for (let i = 1; i <= 2; i++) {
            const email = `banker${i}@test.cz`;
            const firstName = "Bankéř";
            const lastName = `Karel${i}`;
            
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email: email,
                password: "password123",
                email_confirm: true,
                user_metadata: { first_name: firstName, last_name: lastName }
            });

            if (authError) continue;
            const userId = authData.user.id;

            // Ruční vytvoření profilu pro bankéře
            await supabaseAdmin.from("profiles")
                .upsert({ 
                    id: userId, 
                    first_name: firstName,
                    last_name: lastName,
                    email: email,
                    role: "BANKER",
                    is_active: true
                });
                
            results.push(`Bankéř ${i} vytvořen`);
        }

        console.log(results);
        return { success: true, message: "Mock data úspěšně vygenerována!" };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error("Fatální chyba generátoru:", error);
        return { success: false, message: error.message };
    }
}
