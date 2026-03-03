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

  // 1. Získání profilu
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", user.id)
    .single();

  // 2. Získání účtu
  const { data: account } = await supabase
    .from("accounts")
    .select("id, account_number, balance")
    .eq("profile_id", user.id)
    .single();

  if (!account)
    return <div className="py-10 cs-container">Účet nenalezen.</div>;

  // 3. Získání transakcí
  const { data: transactions } = await supabase
    .from("transactions")
    .select(
      `
      id, amount, description, created_at, from_account_id, to_account_id,
      sender:from_account_id (account_number),
      receiver:to_account_id (account_number)
    `,
    )
    .or(`from_account_id.eq.${account.id},to_account_id.eq.${account.id}`)
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div className="space-y-8 py-8 cs-container">
      {/* Header */}
      <header className="flex md:flex-row flex-col justify-between md:items-end gap-4">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">
            Vítejte, {profile?.first_name}
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
                {Number(account.balance).toLocaleString("cs-CZ")} CZK
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mt-4 font-mono text-primary-foreground/70 text-sm">
                Číslo účtu: <br />
                <span className="text-lg">{account.account_number}</span>
              </p>
            </CardContent>
          </Card>

          <Card className="flex">
            <CardHeader>
              <CardTitle>Nová platba</CardTitle>
              <CardDescription>Převeďte peníze na jiný účet</CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentForm
                senderAccountId={account.id}
                currentBalance={Number(account.balance)}
              />
            </CardContent>
          </Card>
        </div>

        {/* Pravý sloupec: Historie transakcí */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Nedávné transakce</CardTitle>
              <CardDescription>
                Posledních 10 pohybů na vašem účtu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HistoryTable
                transactions={transactions as any || []}
                currentAccountId={account.id}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
