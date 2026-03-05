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
import { HistoryTable } from "@/components/client/history-table";
import { RealtimeNotifications } from "@/components/client/realtime-notifications";
import { createAdminClient } from "@/lib/supabase/server";
import { CardDisplay } from "@/components/client/card-display";
import { NewCardButton } from "@/components/client/new-card-button";
import { SupabaseCardRow } from "../cards/page";
import { LoanRequestForm } from "@/components/client/loan-request-form";
import { TransactionsCharts } from "@/components/client/transaction-charts";
import { MarketReviewCZCard } from "@/components/client/market-review-cz";
import { getFrankfurterMarkets } from "@/lib/markets/frankfurter";
import { ParentApprovalCard } from "@/components/client/parent-approval-card";
import {
  Profile,
  Account,
  Transaction,
  PendingChildTransaction,
  ChildAccountWithProfile,
} from "@/types/dashboard";

export default async function ClientDashboard() {
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
  if (!user) redirect("/login");

  const supabaseAdmin = await createAdminClient();

  const profilePromise = supabaseAdmin
    .from("profiles")
    .select("first_name, last_name, role")
    .eq("id", user.id)
    .limit(1)
    .maybeSingle();

  const accountPromise = supabaseAdmin
    .from("accounts")
    .select("id, account_number, balance, daily_limit, is_child_account")
    .eq("profile_id", user.id)
    .limit(1)
    .maybeSingle();

  const marketsPromise = (async () => {
    try {
      const signal = AbortSignal.timeout(1500);
      return await getFrankfurterMarkets({ days: 30, signal });
    } catch {
      return null;
    }
  })();

  const [
    { data: profileData, error: profileError },
    { data: accountData, error: accountError },
    markets,
  ] = await Promise.all([profilePromise, accountPromise, marketsPromise]);

  if (profileError)
    console.error("CHYBA NAČÍTÁNÍ PROFILU:", profileError.message);
  if (accountError) console.error("CHYBA NAČÍTÁNÍ ÚČTU:", accountError.message);

  const profile = profileData as Profile | null;
  const account = accountData as Account | null;

  if (!account) {
    return (
      <div className="py-10 cs-container">
        Účet nenalezen. Počkejte na jeho vytvoření nebo kontaktujte podporu.
      </div>
    );
  }

  const isChild = profile?.role === "CHILD";

  // Paralelní dotazy na transakce a karty
  const transactionsPromise = supabaseAdmin
    .from("transactions")
    .select(
      `
        id, amount, description, created_at, status, from_account_id, to_account_id,
        sender:from_account_id (account_number),
        receiver:to_account_id (account_number)
    `,
    )
    .or(`from_account_id.eq.${account.id},to_account_id.eq.${account.id}`)
    .order("created_at", { ascending: false })
    .limit(10);

  const cardsPromise = supabaseAdmin
    .from("cards")
    .select(
      "id, account_id, card_number, expiry_date, cvv, is_active, daily_limit, atm_limit, created_at, card_name, card_color",
    )
    .eq("account_id", account.id)
    .order("created_at", { ascending: false });

  // Dotaz pro rodiče: Čekající žádosti od dětí
  let pendingChildTransactions: PendingChildTransaction[] = [];
  let childAccountIds: string[] = [];
  if (!isChild) {
    const { data: childAccounts } = await supabaseAdmin
      .from("accounts")
      .select("id, account_number, profiles(first_name)")
      .eq("parent_account_id", account.id)
      .returns<ChildAccountWithProfile[]>();

    if (childAccounts && childAccounts.length > 0) {
      childAccountIds = childAccounts.map((acc) => acc.id);

      const { data: pendingTx } = await supabaseAdmin
        .from("transactions")
        .select(
          `
            id, amount, description, created_at, status, from_account_id, to_account_id,
            sender:from_account_id (account_number, profiles(first_name))
        `,
        )
        .in("from_account_id", childAccountIds)
        .eq("status", "WAITING_FOR_APPROVAL")
        .order("created_at", { ascending: true })
        .returns<PendingChildTransaction[]>();

      pendingChildTransactions = pendingTx ?? [];
    }
  }

  const [{ data: rawTransactions }, { data: dbCards, error: cardsError }] =
    await Promise.all([transactionsPromise, cardsPromise]);

  if (cardsError)
    console.error("Chyba při stahování karet:", cardsError.message);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transactions: Transaction[] = (rawTransactions ?? []).map(
    (transaction: any) => ({
      ...transaction,
      sender: transaction.sender.length === 1 ? transaction.sender[0] : null,
    }),
  );

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
    card_name: card.card_name,
    card_color: card.card_color,
  }));

  return (
    <div className="space-y-8 py-8 cs-container">
      <header className="flex md:flex-row flex-col justify-between md:items-end gap-4">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">
            Vítejte, {profile?.first_name ?? "Uživateli"}
          </h1>
          <p className="text-muted-foreground">
            Přehled vašeho bankovního účtu
          </p>
        </div>
      </header>

      {/* Panel čekajících žádostí - viditelný jen pro rodiče, pokud má co schvalovat */}
      {!isChild && pendingChildTransactions.length > 0 && (
        <div>
          <h2 className="flex items-center mb-4 font-bold text-amber-500 text-xl">
            <span className="relative flex mr-3 w-3 h-3">
              <span className="inline-flex absolute bg-amber-400 opacity-75 rounded-full w-full h-full animate-ping"></span>
              <span className="inline-flex relative bg-amber-500 rounded-full w-3 h-3"></span>
            </span>
            Čekající žádosti o platbu ({pendingChildTransactions.length})
          </h2>
          <div className="gap-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {pendingChildTransactions.map((tx) => (
              <ParentApprovalCard key={tx.id} transaction={tx} />
            ))}
          </div>
        </div>
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
              {/* Pro dítě zobrazíme jeho limit */}
              {isChild && (
                <p className="mt-2 text-primary-foreground/60 text-xs">
                  Denní limit plateb:{" "}
                  {Number(account.daily_limit).toLocaleString("cs-CZ")} CZK
                </p>
              )}
            </CardContent>
          </Card>

          {/* Formulář platby */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Nová platba</CardTitle>
              <CardDescription>
                {isChild
                  ? `Platby nad ${Number(account.daily_limit).toLocaleString("cs-CZ")} Kč odešleme rodiči ke schválení.`
                  : "Převeďte peníze na jiný účet"}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <PaymentForm
                senderAccountId={account.id}
                currentBalance={Number(account.balance)}
              />
            </CardContent>
          </Card>

          {/* Žádost o půjčku – skryto pro dítě */}
          {!isChild && (
            <Card>
              <CardHeader>
                <CardTitle>Žádost o půjčku</CardTitle>
                <CardDescription>
                  Rychlé financování online do pár minut.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LoanRequestForm
                  profileId={user.id}
                  accountId={account.id}
                  currentBalance={Number(account.balance)}
                />
              </CardContent>
            </Card>
          )}

          {/* Market data – skryto pro dítě (zbytečná komplexita) */}
          {!isChild && (
            <MarketReviewCZCard initialData={markets ?? undefined} />
          )}
        </div>

        {/* Pravý sloupec */}
        <div className="space-y-6 lg:col-span-2">
          {/* Sekce karet */}
          <Card>
            <CardHeader className="flex flex-row justify-between items-center space-y-0 pb-4">
              <div>
                <CardTitle>Moje virtuální karty</CardTitle>
                <CardDescription>
                  {isChild
                    ? "Karty spravuje tvůj rodič"
                    : "Spravujte karty pro platby na internetu"}
                </CardDescription>
              </div>
              {/* Dítě nemůže generovat nové karty */}
              {!isChild && <NewCardButton accountId={account.id} />}
            </CardHeader>
            <CardContent>
              {cards.length === 0 ? (
                <div className="py-6 border-2 border-dashed rounded-lg text-muted-foreground text-sm text-center">
                  Zatím nemáte žádnou aktivní kartu.
                </div>
              ) : (
                <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
                  {cards.map((card) => (
                    <CardDisplay
                      key={card.id}
                      card={card}
                      profileId={user.id}
                      accountId={account.id}
                    />
                  ))}
                </div>
              )}
              {isChild && (
                <p className="mt-4 text-muted-foreground text-xs">
                  Pro změnu limitů nebo vydání nové karty požádej svého rodiče v
                  nastavení.
                </p>
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
