import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { EnrollMfaClient } from "@/components/settings/enroll-mfa-client";
import { SelfMfaResetButton } from "@/components/settings/self-mfa-reset-button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CardLimitForm } from "@/components/client/card-limit-form";
import { SupabaseCardRow } from "../cards/page";
import { createAdminClient } from "@/lib/supabase/server";
import { Check, UserCog, ArrowLeft } from "lucide-react";

interface ChildAccount {
  id: string;
  account_number: string;
  profiles: {
    first_name: string;
  } | null;
  is_child_account: boolean;
  parent_account_id: string | null;
}

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
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

    const resolvedParams = await searchParams;
    const selectedAccountId = resolvedParams.account as string | undefined;

    // 1. ZÍSKÁNÍ UŽIVATELE
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    // Pro jistotu obejití RLS pro čtení dat použijeme Admin klienta
    const supabaseAdmin = await createAdminClient();

    // 2. Získání profilu
    const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("role, first_name")
        .eq("id", user.id)
        .limit(1)
        .maybeSingle();

    // 2.5 Kontrola MFA
    const { data: mfaList } = await supabase.auth.mfa.listFactors();
    // Bezpečnější kontrola pole totp
    const hasMfaEnabled = !!(mfaList?.totp && Array.isArray(mfaList.totp) && mfaList.totp.length > 0);

    // 3. Získání vlastních účtů
    const { data: ownAccounts } = await supabaseAdmin
        .from("accounts")
        .select("id, account_number, is_child_account, parent_account_id")
        .eq("profile_id", user.id)
        .order("created_at", { ascending: true });
        
    const primaryAccount = ownAccounts && ownAccounts.length > 0 ? ownAccounts[0] : null;

    // 4. Pokud je to rodič, zjistíme, jestli má děti
    let childrenAccounts: ChildAccount[] = [];
    if (profile?.role === "CLIENT" && primaryAccount) {
        const { data } = await supabaseAdmin
            .from("accounts")
            .select("id, account_number, profiles(first_name)")
            .eq("parent_account_id", primaryAccount.id);

        childrenAccounts = (data as unknown as ChildAccount[]) || [];
    }

    // 5. Zjištění, JAKÝ účet zrovna spravujeme (umožňuje rodiči sledovat dítě)
    let targetAccount = primaryAccount;
    let isManagingChild = false;

    if (selectedAccountId) {
        const foundOwn = ownAccounts?.find(a => a.id === selectedAccountId);
        const foundChild = childrenAccounts.find(a => a.id === selectedAccountId);
        
        if (foundOwn) {
            targetAccount = foundOwn;
        } else if (foundChild) {
            targetAccount = foundChild as ChildAccount;
            isManagingChild = true;
        }
    }

    // 6. Pokud je to dítě, zjistíme jméno rodiče
    let parentName = null;
    if (profile?.role === "CHILD" && primaryAccount?.parent_account_id) {
        const { data: parentAcc } = await supabaseAdmin
            .from("accounts")
            .select("profiles(first_name)")
            .eq("id", primaryAccount.parent_account_id)
            .limit(1)
            .maybeSingle();

        const typedParent = parentAcc as unknown as { profiles: { first_name: string } };
        parentName = typedParent?.profiles?.first_name;
    }

    // 7. ZÍSKÁNÍ AKTIVNÍCH KARET PRO NASTAVENÍ LIMITŮ (z cílového účtu)
    let activeCards: SupabaseCardRow[] = [];
    if (targetAccount) {
        const { data: cardsData } = await supabaseAdmin
            .from("cards")
            .select("*")
            .eq("account_id", targetAccount.id)
            .eq("is_active", true) 
            .order("created_at", { ascending: false })
            .returns<SupabaseCardRow[]>();
            
        activeCards = cardsData || [];
    }

    // Zobrazení klientských funkcí jen pro klienty a děti
    const isClientOrChild = profile?.role === "CLIENT" || profile?.role === "CHILD";

    return (
        <div className="space-y-6 py-8 cs-container">
            <div>
                <h1 className="font-bold text-3xl tracking-tight">Nastavení účtu</h1>
                <p className="text-muted-foreground">Správa zabezpečení, limitů a propojených účtů</p>
            </div>

            <div className="gap-6 grid grid-cols-1 md:grid-cols-2">
                
                {/* 1. Modul Zabezpečení (2FA) */}
                <Card>
                    <CardHeader>
                        <CardTitle>Zabezpečení (2FA)</CardTitle>
                        <CardDescription>Chraňte svůj účet pomocí Authenticator aplikace.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {!hasMfaEnabled ? (
                            <EnrollMfaClient />
                        ) : (
                            <div className="bg-green-400/10 p-4 border border-green-400 rounded-md text-green-400">
                                <p className="inline-flex items-center font-medium text-sm">
                                    <Check className="mr-2 size-4" /> 2FA je aktivní a váš účet je chráněn.
                                </p>
                            </div>
                        )}

                        {/* Odstranění 2FA - Viditelné jen pro bankéře/adminy */}
                        {hasMfaEnabled && !isClientOrChild && (
                            <div className="mt-4 pt-4 border-t">
                                <p className="mb-3 text-muted-foreground text-sm">
                                    Jako zaměstnanec banky máte možnost své dvoufázové ověření dočasně deaktivovat (např. při změně telefonu).
                                </p>
                                <SelfMfaResetButton />
                            </div>
                        )}
                        
                        {/* Hláška pro klienta/dítě */}
                        {hasMfaEnabled && isClientOrChild && (
                            <div className="mt-4 pt-4 border-t text-muted-foreground text-xs">
                                Z bezpečnostních důvodů nemůžete 2FA sami deaktivovat. Pokud jste ztratili telefon, kontaktujte svého bankéře.
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 2. Modul Správa rolí a rodiny */}
                <Card>
                    <CardHeader>
                        <CardTitle>Správa rolí a rodiny</CardTitle>
                        <CardDescription>Vaše aktuální role: <strong className="text-primary">{profile?.role}</strong></CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Pohled Rodiče (Klienta) */}
                        {profile?.role === "CLIENT" && (
                            <div className="space-y-4">
                                <div>
                                    <h3 className="mb-3 font-medium text-sm">Dětské účty pod vaším dohledem:</h3>
                                    {childrenAccounts.length === 0 ? (
                                        <p className="mb-4 text-muted-foreground text-sm">Zatím nemáte propojené žádné dětské účty.</p>
                                    ) : (
                                        <ul className="space-y-3 mb-4">
                                            {childrenAccounts.map((child: ChildAccount) => (
                                                <li key={child.id} className="flex justify-between items-center bg-muted p-3 rounded-md text-sm">
                                                    <div>
                                                        <p className="font-medium">{child.profiles?.first_name}</p>
                                                        <p className="text-muted-foreground text-xs">Účet: {child.account_number}</p>
                                                    </div>
                                                    <Button variant="secondary" size="sm" asChild>
                                                        <Link href={`?account=${child.id}`}>
                                                            <UserCog className="mr-2 size-4" />
                                                            Spravovat
                                                        </Link>
                                                    </Button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                                <Button variant="outline" className="w-full" asChild>
                                    <Link href="/dashboard/settings/create-child">Vytvořit dětský účet</Link>
                                </Button>
                            </div>
                        )}

                        {/* Pohled Dítěte */}
                        {profile?.role === "CHILD" && (
                            <div className="bg-muted p-4 rounded-md">
                                <p className="text-sm">Tento účet je pod dohledem.</p>
                                <p className="mt-1 font-medium">Váš rodič: {parentName || "Neznámý"}</p>
                                <p className="mt-2 text-muted-foreground text-xs">Větší platby musí schválit váš rodič.</p>
                            </div>
                        )}

                        {/* Pohled Bankéře / Admina */}
                        {!isClientOrChild && (
                            <div className="bg-muted p-4 rounded-md">
                                <p className="text-sm">
                                    Máte speciální systémová oprávnění. Pro správu klientů přejděte na Dashboard.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 3. Modul pro nastavení limitů karet (SKRYTO PRO BANKÉŘE A ADMINY) */}
                {isClientOrChild && (
                    <Card className="relative md:col-span-2 border-primary/20">
                        {isManagingChild && (
                            <div className="top-0 right-0 absolute bg-primary px-3 py-1 rounded-tr-lg rounded-bl-lg font-medium text-primary-foreground text-xs">
                                Režim správy dítěte
                            </div>
                        )}
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle>Limity platebních karet</CardTitle>
                                    <CardDescription>
                                        Nastavení pro účet: <strong className="text-foreground">{targetAccount?.account_number}</strong>
                                    </CardDescription>
                                </div>
                                {isManagingChild && (
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link href="/dashboard/settings">
                                            <ArrowLeft className="mr-2 size-4" /> Zpět na můj účet
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {activeCards.length === 0 ? (
                                <div className="py-8 border-2 border-dashed rounded-lg text-muted-foreground text-sm text-center">
                                    K tomuto účtu nejsou vedeny žádné aktivní karty.
                                </div>
                            ) : (
                                <div className="gap-4 grid grid-cols-1 lg:grid-cols-2">
                                    {activeCards.map((card) => (
                                        <CardLimitForm 
                                            key={card.id}
                                            cardId={card.id}
                                            cardNumber={card.card_number}
                                            currentPaymentLimit={card.daily_limit}
                                            currentAtmLimit={card.atm_limit || 0}
                                        />
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
