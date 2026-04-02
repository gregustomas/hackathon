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
import { createAdminClient } from "@/lib/supabase/server";
import { CardDisplay } from "@/components/client/card-display";
import { SupabaseCardRow } from "../cards/page";
import { TransactionsCharts } from "@/components/client/transaction-charts";
import { ShieldAlert, UserCheck, Clock } from "lucide-react";
import { getSavedRecipients } from "@/lib/recipients/actions";

interface ChildProfile {
    first_name: string;
    last_name: string;
    role: string;
}

interface ChildAccount {
    id: string;
    account_number: string;
    balance: number;
    daily_limit: number;
    is_child_account: boolean;
    parent_account_id: string | null;
}

interface ParentProfile {
    profiles: {
        first_name: string;
        last_name: string;
    } | null;
}

interface PendingTransaction {
    id: string;
    amount: number;
    description: string | null;
    created_at: string;
    to_account_id: string;
    receiver: { account_number: string } | null;
}

export default async function ChildDashboard() {
    const cookieStore = await cookies();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll() { return cookieStore.getAll(); } } },
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const supabaseAdmin = await createAdminClient();

    // 1. Načtení profilu a ověření role
    const { data: profileData } = await supabaseAdmin
        .from("profiles")
        .select("first_name, last_name, role")
        .eq("id", user.id)
        .limit(1)
        .maybeSingle();

    const profile = profileData as ChildProfile | null;

    // Pokud user není CHILD, přesměrujeme ho jinam
    if (!profile || profile.role !== "CHILD") {
        redirect("/dashboard/client");
    }

    // 2. Načtení účtu dítěte
    const { data: accountData } = await supabaseAdmin
        .from("accounts")
        .select("id, account_number, balance, daily_limit, is_child_account, parent_account_id")
        .eq("profile_id", user.id)
        .limit(1)
        .maybeSingle();

    const account = accountData as ChildAccount | null;

    if (!account) {
        return (
            <div className="py-10 cs-container">
                Účet nenalezen. Kontaktujte svého rodiče nebo podporu.
            </div>
        );
    }

    // 3. Načtení jména rodiče (přes parent_account_id → profiles)
    let parentFullName: string | null = null;
    if (account.parent_account_id) {
        const { data: parentAccData } = await supabaseAdmin
            .from("accounts")
            .select("profiles(first_name, last_name)")
            .eq("id", account.parent_account_id)
            .limit(1)
            .maybeSingle();

        const parentAcc = parentAccData as ParentProfile | null;
        if (parentAcc?.profiles) {
            parentFullName = `${parentAcc.profiles.first_name} ${parentAcc.profiles.last_name}`;
        }
    }

    // 4. Paralelní načtení transakcí a karet
    const transactionsPromise = supabaseAdmin
        .from("transactions")
        .select(`
            id, amount, description, created_at, status, from_account_id, to_account_id,
            sender:from_account_id (account_number),
            receiver:to_account_id (account_number)
        `)
        .or(`from_account_id.eq.${account.id},to_account_id.eq.${account.id}`)
        .order("created_at", { ascending: false })
        .limit(20);

    const cardsPromise = supabaseAdmin
        .from("cards")
        .select("id, account_id, card_number, expiry_date, cvv, is_active, daily_limit, atm_limit, created_at, card_name, card_color")
        .eq("account_id", account.id)
        .order("created_at", { ascending: false });

    // 5. Načtení čekajících plateb (přes limit – čekají na rodiče)
    const pendingTransactionsPromise = supabaseAdmin
        .from("transactions")
        .select(`
            id, amount, description, created_at, to_account_id,
            receiver:to_account_id (account_number)
        `)
        .eq("from_account_id", account.id)
        .eq("status", "WAITING_FOR_APPROVAL")
        .order("created_at", { ascending: false })
        .returns<PendingTransaction[]>();

    const [
        { data: rawTransactions },
        { data: dbCards, error: cardsError },
        { data: pendingTx },
    ] = await Promise.all([transactionsPromise, cardsPromise, pendingTransactionsPromise]);

    if (cardsError) console.error("Chyba při načítání karet:", cardsError.message);

    const transactions = (rawTransactions ?? []) as Transaction[];
    const pendingTransactions = pendingTx ?? [];

    const cards: SupabaseCardRow[] = (dbCards ?? []).map((card) => ({
        id: card.id,
        account_id: card.account_id,
        card_number: card.card_number,
        expiry_date: card.expiry_date,
        cvv: card.cvv,
        is_active: card.is_active,
        daily_limit: card.daily_limit,
        atm_limit: card.atm_limit,
        created_at: card.created_at,
        card_name: card.card_name ?? null,
        card_color: card.card_color ?? null,
    }));

    const savedRecipients = await getSavedRecipients(user.id);

    return (
        <div className="space-y-8 py-8 cs-container">
            <RealtimeNotifications accountId={account.id} />

            {/* Header */}
            <header className="flex md:flex-row flex-col justify-between md:items-end gap-4">
                <div>
                    <h1 className="font-bold text-3xl tracking-tight">
                        Ahoj, {profile.first_name}!
                    </h1>
                    <p className="text-muted-foreground">Přehled tvého účtu</p>
                </div>
                {/* Badge: pod dohledem */}
                <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full w-fit font-medium text-primary text-sm">
                    <UserCheck className="size-4" />
                    Pod dohledem: {parentFullName ?? "Rodič"}
                </div>
            </header>

            {/* Pokud existují platby čekající na schválení rodiče */}
            {pendingTransactions.length > 0 && (
                <Card className="bg-amber-500/5 border-amber-500/40">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center text-amber-600 text-base">
                            <Clock className="mr-2 size-4" />
                            Platby čekající na schválení rodiče ({pendingTransactions.length})
                        </CardTitle>
                        <CardDescription>
                            Tyto platby překročily tvůj denní limit a čekají na souhlas.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {pendingTransactions.map((tx) => (
                                <li
                                    key={tx.id}
                                    className="flex justify-between items-center bg-background p-3 border border-amber-500/20 rounded-md text-sm"
                                >
                                    <div>
                                        <p className="font-mono text-muted-foreground text-xs">
                                            Pro: {tx.receiver?.account_number ?? tx.to_account_id}
                                        </p>
                                        {tx.description && (
                                            <p className="max-w-50 text-muted-foreground text-xs truncate">
                                                {tx.description}
                                            </p>
                                        )}
                                    </div>
                                    <span className="font-bold text-amber-600">
                                        -{Number(tx.amount).toLocaleString("cs-CZ")} CZK
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}

            <div className="gap-6 grid grid-cols-1 lg:grid-cols-3">

                {/* Levý sloupec */}
                <div className="space-y-6 lg:col-span-1">

                    {/* Karta se zůstatkem */}
                    <Card className="bg-primary shadow-lg border-0 text-primary-foreground">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-primary-foreground/80">
                                Aktuální zůstatek
                            </CardDescription>
                            <CardTitle className="text-4xl">
                                {Number(account.balance).toLocaleString("cs-CZ")} CZK
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="mt-4 font-mono text-primary-foreground/70 text-sm">
                                Číslo účtu: <br />
                                <span className="text-lg">{account.account_number}</span>
                            </p>
                            <p className="mt-3 text-primary-foreground/60 text-xs">
                                Denní limit plateb:{" "}
                                <strong className="text-primary-foreground/80">
                                    {Number(account.daily_limit).toLocaleString("cs-CZ")} CZK
                                </strong>
                            </p>
                        </CardContent>
                    </Card>

                    {/* Formulář platby */}
                    <Card className="flex flex-col">
                        <CardHeader>
                            <CardTitle>Nová platba</CardTitle>
                            <CardDescription>
                                Platby nad{" "}
                                <strong>{Number(account.daily_limit).toLocaleString("cs-CZ")} Kč</strong>{" "}
                                odešleme rodiči ke schválení.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <PaymentForm
                                senderAccountId={account.id}
                                currentBalance={Number(account.balance)}
                                profileId={user.id}
                                savedRecipients={savedRecipients}
                            />
                        </CardContent>
                    </Card>

                    {/* Info blok o omezeních */}
                    <Card className="bg-muted/50 border-dashed">
                        <CardContent className="space-y-3 pt-4">
                            <div className="flex items-start gap-3 text-muted-foreground text-sm">
                                <ShieldAlert className="mt-0.5 size-4 text-primary shrink-0" />
                                <p>
                                    Vydávání nových karet a změnu limitů spravuje tvůj rodič v nastavení.
                                </p>
                            </div>
                            <div className="flex items-start gap-3 text-muted-foreground text-sm">
                                <ShieldAlert className="mt-0.5 size-4 text-primary shrink-0" />
                                <p>
                                    Půjčky nejsou pro tvůj typ účtu dostupné.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Pravý sloupec */}
                <div className="space-y-6 lg:col-span-2">

                    {/* Karty – jen zobrazení, bez možnosti generovat */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Moje virtuální karty</CardTitle>
                            <CardDescription>
                                Karty pro platby na internetu a v obchodech
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {cards.length === 0 ? (
                                <div className="py-6 border-2 border-dashed rounded-lg text-muted-foreground text-sm text-center">
                                    Zatím nemáš žádnou aktivní kartu. Požádej rodiče o vydání karty.
                                </div>
                            ) : (
                                <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
                                    {cards.map((card) => (
                                        <CardDisplay key={card.id} card={card} accountId={account.id} profileId={user.id} />
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <TransactionsCharts
                        transactions={transactions}
                        currentAccountId={account.id}
                    />

                    <div className="h-fit">
                        <HistoryTable
                            transactions={transactions}
                            currentAccountId={account.id}
                            accountNumber={account.account_number}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
