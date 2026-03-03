import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { EnrollMfaClient } from "@/components/enroll-mfa-client";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ChildAccount {
    id: string;
    account_number: string;
    profiles: {
        first_name: string;
    } | null;
}

export default async function SettingsPage() {
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

    // 1. Kdo se dívá?
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    // Získáme profil a účet
    const { data: profile } = await supabase
        .from("profiles")
        .select("role, first_name")
        .eq("id", user.id)
        .single();
    const { data: account } = await supabase
        .from("accounts")
        .select("id, is_child_account, parent_account_id")
        .eq("profile_id", user.id)
        .single();

    // Pokud je to rodič, zjistíme, jestli už má děti
    let childrenAccounts: ChildAccount[] = [];

    if (profile?.role === "CLIENT" && account) {
        // Vybereme účty, které mají tento účet nastavený jako nadřazený
        const { data } = await supabase
            .from("accounts")
            .select("id, account_number, profiles(first_name)")
            .eq("parent_account_id", account.id);

        // Castneme data, protože Supabase typování u vnorených selectů (joinů)
        // přes JS klienta někdy vrací 'any'
        childrenAccounts = (data as unknown as ChildAccount[]) || [];
    }

    // Pokud je to dítě, zjistíme jméno rodiče
    let parentName = null;
    if (profile?.role === "CHILD" && account?.parent_account_id) {
        // Zjistíme jméno rodiče pro dítě
        const { data: parentAcc } = await supabase
            .from("accounts")
            .select("profiles(first_name)")
            .eq("id", account.parent_account_id)
            .single();

        const typedParent = parentAcc as unknown as {
            profiles: { first_name: string };
        };
        parentName = typedParent?.profiles?.first_name;
    }

    return (
        <div className="space-y-6 py-8 cs-container">
            <div>
                <h1 className="font-bold text-3xl tracking-tight">
                    Nastavení účtu
                </h1>
                <p className="text-muted-foreground">
                    Správa zabezpečení a propojených účtů
                </p>
            </div>

            <div className="gap-6 grid grid-cols-1 md:grid-cols-2">
                {/* 1. Modul Zabezpečení (2FA) - Pro všechny společný, proto to vyčleníme do Client Componenty */}
                <EnrollMfaClient />

                {/* 2. Modul Specifický podle role */}
                <Card>
                    <CardHeader>
                        <CardTitle>Správa rolí a rodiny</CardTitle>
                        <CardDescription>
                            Vaše aktuální role:{" "}
                            <strong className="text-primary">
                                {profile?.role}
                            </strong>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Pohled Rodiče (Klienta) */}
                        {profile?.role === "CLIENT" && (
                            <div>
                                <h3 className="mb-2 font-medium">
                                    Dětské účty pod vaším dohledem:
                                </h3>
                                {childrenAccounts.length === 0 ? (
                                    <p className="mb-4 text-muted-foreground text-sm">
                                        Zatím nemáte propojené žádné dětské
                                        účty.
                                    </p>
                                ) : (
                                    <ul className="space-y-2 mb-4">
                                        {childrenAccounts.map(
                                            (child: ChildAccount) => (
                                                <li
                                                    key={child.id}
                                                    className="bg-muted p-2 rounded text-sm"
                                                >
                                                    {child.profiles?.first_name}{" "}
                                                    (Účet:{" "}
                                                    {child.account_number})
                                                </li>
                                            ),
                                        )}
                                    </ul>
                                )}
                                {/* Pro Hackathon: Tlačítko na vytvoření by volalo Server Action, 
                    která vytvoří nového usera s rolí CHILD a do parent_account_id dá ID rodiče */}
                                <Button variant="outline" className="w-full">
                                    Vytvořit dětský účet
                                </Button>
                            </div>
                        )}

                        {/* Pohled Dítěte */}
                        {profile?.role === "CHILD" && (
                            <div className="bg-muted p-4 rounded-md">
                                <p className="text-sm">
                                    Tento účet je pod dohledem.
                                </p>
                                <p className="mt-1 font-medium">
                                    Váš rodič: {parentName || "Neznámý"}
                                </p>
                                <p className="mt-2 text-muted-foreground text-xs">
                                    Větší platby musí schválit váš rodič.
                                </p>
                            </div>
                        )}

                        {/* Pohled Bankéře / Admina */}
                        {(profile?.role === "BANKER" ||
                            profile?.role === "ADMIN") && (
                            <div className="bg-muted p-4 rounded-md">
                                <p className="text-sm">
                                    Máte speciální systémová oprávnění. Pro
                                    správu klientů přejděte na váš hlavní
                                    Dashboard.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
