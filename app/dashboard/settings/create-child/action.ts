"use server"

import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createVirtualCardForAccount } from "@/lib/cards/create-virtual-card";


export async function createChildAccountAction(formData: FormData) {
    const cookieStore = await cookies();
    
    // 1. ZÍSKÁNÍ PŘIHLÁŠENÉHO RODIČE (pomocí normálního klienta s přístupem ke cookies)
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

    const { data: { user: parentUser }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !parentUser) {
        throw new Error("Nejste přihlášeni (Session nebyla nalezena).");
    }

    // 2. ADMIN KLIENT PRO ZÁPISY DO DATABÁZE A AUTH
    const supabaseAdmin = await createAdminClient();

    // Získání účtu rodiče, abychom mohli účet dítěte napojit na `parent_account_id`
    const { data: parentAccount, error: parentAccountError } = await supabaseAdmin
        .from("accounts")
        .select("id")
        .eq("profile_id", parentUser.id)
        .limit(1)
        .single();

    if (parentAccountError || !parentAccount) {
        throw new Error("Nebyl nalezen váš primární bankovní účet pro propojení.");
    }

    // 3. EXTRAKCE DAT Z FORMULÁŘE
    const email = formData.get("email") as string;
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const phone = formData.get("phone") as string;
    const street = formData.get("street") as string;
    const city = formData.get("city") as string;
    const zipCode = formData.get("zipCode") as string;
    const country = formData.get("country") as string;
    const dailyLimit = Number(formData.get("dailyLimit")) || 0;

    // Generování hesla, které se dítěti zobrazí na obrazovce
    const temporaryPassword = "Gen" + Math.random().toString(36).slice(-8) + "123!";

    // 4. ZALOŽENÍ UŽIVATELE (DÍTĚTE) V SUPABASE AUTH
    const { data: newChildAuth, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: temporaryPassword,
        email_confirm: true // Dítě nebude muset klikat na link v e-mailu
    });

    if (authError) {
        throw new Error("Chyba při vytváření přihlašovacích údajů dítěte: " + authError.message);
    }

    // 5. VYTVOŘENÍ PROFILU DÍTĚTE (tabulka profiles)
    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
        id: newChildAuth.user.id,
        role: "CHILD", 
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone || null,
        street: street,
        city: city,
        zip_code: zipCode,
        country: country,
        is_active: true
    });

    if (profileError) {
        // Fallback: Pokud selže profil, měli bychom smazat i auth uživatele (volitelné)
        await supabaseAdmin.auth.admin.deleteUser(newChildAuth.user.id);
        throw new Error("Chyba při ukládání profilu: " + profileError.message);
    }

    // 6. VYTVOŘENÍ ÚČTU DÍTĚTE (tabulka accounts) s napojením na rodiče
    // Generování čísla účtu (pro reálnou aplikaci by mělo být unikátní)
    const BANK_CODE = "8888";

    const accNumberCore = Math.floor(
      10000000 + Math.random() * 90000000
    ).toString(); // 8 číslic za prefixem 20

    const accNumber = `20${accNumberCore}/${BANK_CODE}`;

    const { data: newChildAccount, error: accountError } = await supabaseAdmin.from("accounts").insert({
        profile_id: newChildAuth.user.id,
        account_number: accNumber,
        currency: "CZK",
        balance: 0,
        is_child_account: true,
        parent_account_id: parentAccount.id,
        daily_limit: dailyLimit,
        is_active: true
    })
    .select("id, daily_limit")
    .single();

    if (accountError || !newChildAccount) {
        throw new Error("Chyba při zakládání bankovního účtu: " + accountError?.message);
    }

    // 7. VYTVOŘENÍ VIRTUÁLNÍ KARTY PRO DÍTĚ
    try {
        await createVirtualCardForAccount({
            supabaseAdmin,
            accountId: newChildAccount.id,
            // Nastavíme kartě stejný daily limit jako má na účtu (podle formuláře)
            dailyLimit: newChildAccount.daily_limit || 500
        });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (cardErr: any) {
          throw new Error("Chyba při vystavování dětské karty: " + cardErr.message);
    }

    // 8. HOTOVO
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/cards"); // Pokud si kartu rodič chce prohlédnout v kartách
    return { success: true, email: email, temporaryPassword: temporaryPassword };
}