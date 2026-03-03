import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { PaymentForm } from "@/components/client/payment-form";
import { HistoryTable, type Transaction } from "@/components/client/history-table";
import { RealtimeNotifications } from "@/components/client/realtime-notifications";
import { createAdminClient } from '@/lib/supabase/server'
import { CardDisplay } from "@/components/client/card-display";
import { NewCardButton } from "@/components/client/new-card-button";
import { SupabaseCardRow } from "../cards/page";
import { LoanRequestForm } from "@/components/client/loan-request-form";
import { TransactionsCharts } from "@/components/client/transaction-charts";

export default async function ClientDashboard() {
    const cookieStore = await cookies();
    
    // 1. Získání uživatele přes normálního klienta (kvůli cookies)
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
    
    if (!user) redirect("/login");

    // 2. Vytvoření Admin klienta pro všechny databázové dotazy (obejití RLS)
    const supabaseAdmin = await createAdminClient();

    // 3. Získání profilu s bezpečnými limity
    const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", user.id)
        .limit(1)
        .maybeSingle();

    if (profileError) {
        console.error("CHYBA NAČÍTÁNÍ PROFILU:", profileError.message);
    }

    // 4. Získání účtu s bezpečnými limity
    const { data: account, error: accountError } = await supabaseAdmin
        .from("accounts")
        .select("id, account_number, balance")
        .eq("profile_id", user.id)
        .limit(1)
        .maybeSingle();

    if (accountError) {
        console.error("CHYBA NAČÍTÁNÍ ÚČTU:", accountError.message);
    }

    // Pokud uživatel nemá účet, ukončíme renderování zde
    if (!account) {
        return <div className="py-10 cs-container">Účet nenalezen. Počkejte na jeho vytvoření nebo kontaktujte podporu.</div>;
    }

    // 5. Získání transakcí (účet už zaručeně existuje)
    const { data: rawTransactions } = await supabaseAdmin
        .from('transactions')
        .select(`
            id, amount, description, created_at, from_account_id, to_account_id,
            sender:from_account_id (account_number),
            receiver:to_account_id (account_number)
        `)
        .or(`from_account_id.eq.${account.id},to_account_id.eq.${account.id}`)
        .order('created_at', { ascending: false })
        .limit(10);

    const transactions = (rawTransactions as unknown) as Transaction[];

    // 6. Získání karet
    const { data: dbCards, error: cardsError } = await supabaseAdmin
        .from('cards')
        .select('*')
        .eq('account_id', account.id)
        .order('created_at', { ascending: false })
    if (cardsError) {
        console.error("Chyba při stahování karet:", cardsError.message);
    }

    const cards: SupabaseCardRow[] = (dbCards || []).map((card) => ({
        id: card.id,
        account_id: card.account_id,
        card_number: card.card_number,
        expiry_date: card.expiry_date, 
        cvv: card.cvv,
        is_active: card.is_active,
        daily_limit: card.daily_limit,
        atm_limit: card.atm_limit,
        created_at: card.created_at,
    }));

    return (
        <div className="space-y-8 py-8 cs-container">
            <RealtimeNotifications accountId={account.id} />
            
            {/* Header */}
            <header className="flex md:flex-row flex-col justify-between md:items-end gap-4">
                <div>
                    <h1 className="font-bold text-3xl tracking-tight">
                        Vítejte, {profile?.first_name || 'Uživateli'}
                    </h1>
                    <p className="text-muted-foreground">
                        Přehled vašeho bankovního účtu
                    </p>
                </div>
            </header>

            <div className="gap-6 grid grid-cols-1 lg:grid-cols-3">
                {/* Levý sloupec: Zůstatek a Platba */}
                <div className="space-y-6 lg:col-span-1">
                    <Card className="bg-primary shadow-lg border-0 text-primary-foreground">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-primary-foreground/80">
                                Aktuální zůstatek
                            </CardDescription>
                            <CardTitle className="text-4xl">
                                {Number(account.balance).toLocaleString(
                                    "cs-CZ",
                                )}{" "}
                                CZK
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="mt-4 font-mono text-primary-foreground/70 text-sm">
                                Číslo účtu: <br />
                                <span className="text-lg">
                                    {account.account_number}
                                </span>
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="flex flex-col">
                        <CardHeader>
                            <CardTitle>Nová platba</CardTitle>
                            <CardDescription>
                                Převeďte peníze na jiný účet
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <PaymentForm
                                senderAccountId={account.id}
                                currentBalance={Number(account.balance)}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                          <CardTitle>Žádost o půjčku</CardTitle>
                          <CardDescription>Rychlé financování online do pár minut.</CardDescription>
                      </CardHeader>
                      <CardContent>
                          <LoanRequestForm 
                              profileId={user.id} 
                              accountId={account.id} 
                              currentBalance={Number(account.balance)} 
                          />

                      </CardContent>
                  </Card>
                </div>

                <div className="space-y-6 lg:col-span-2">
                    {/* SEKCE: Moje karty */}
                    <Card>
                        <CardHeader className="flex flex-row justify-between items-center space-y-0 pb-4">
                            <div>
                                <CardTitle>Moje virtuální karty</CardTitle>
                                <CardDescription>
                                    Spravujte karty pro platby na internetu
                                </CardDescription>
                            </div>
                            <NewCardButton accountId={account.id} />
                        </CardHeader>
                        
                        <CardContent>
                            {cards.length === 0 ? (
                                <div className="py-6 border-2 border-dashed rounded-lg text-muted-foreground text-center">
                                    Zatím nemáte žádnou aktivní kartu.
                                </div>
                            ) : (
                                <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
                                    {cards.map((card) => (
                                        <CardDisplay key={card.id} card={card} />
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    <TransactionsCharts 
                        transactions={transactions} 
                        currentAccountId={account.id} 
                    />

                    {/* SEKCE: Historie transakcí */}
                    <Card >
                        <CardHeader>
                            <CardTitle>Nedávné transakce</CardTitle>
                            <CardDescription>
                                Posledních 10 pohybů na vašem účtu
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <HistoryTable 
                                transactions={transactions || []}
                                currentAccountId={account.id}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
