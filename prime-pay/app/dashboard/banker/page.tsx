import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { revalidatePath } from "next/cache";
import { Client, Account, PendingLoan, CardUnblockRequest } from "@/interfaces/banker";
import { ClientManagerRow } from "@/components/banker/client-manager-row";
import { resolveCardUnblockRequest } from "@/app/dashboard/cards/actions";

export default async function BankerDashboard() {
    const cookieStore = await cookies();
    
    // Auth check
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll() { return cookieStore.getAll(); } } },
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const supabaseAdmin = await createAdminClient();

    // Kontrola, zda je uživatel opravdu bankéř (pro sichr i přestože tě chrání middleware)
    const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("role, first_name, last_name")
        .eq("id", user.id)
        .limit(1)
        .maybeSingle();

    if (profile?.role !== "BANKER" && profile?.role !== "ADMIN") {
        redirect("/dashboard/client");
    }

    // Načtení všech klientů
    const { data: clients } = await supabaseAdmin
        .from("profiles")
        .select(`
            id, first_name, last_name, email, role,
            accounts(id, account_number, balance)
        `)
        .eq("role", "CLIENT")
        .order("created_at", { ascending: false });

    // Načtení čekajících žádostí o půjčku
    const { data: dbLoans } = await supabaseAdmin
        .from("loans")
        .select(`
            id, amount, purpose, status, created_at,
            profiles(first_name, last_name),
            accounts(account_number)
        `)
        .eq("status", "PENDING")
        .order("created_at", { ascending: false });

    const pendingLoans = (dbLoans || []) as unknown as PendingLoan[];

    const { data: dbUnblockRequests } = await supabaseAdmin
        .from("card_unblock_requests")
        .select(`
            id, status, created_at,
            profiles(first_name, last_name),
            accounts(account_number),
            cards(id, card_number)
        `)
        .eq("status", "PENDING")
        .order("created_at", { ascending: true });

    const unblockRequests = (dbUnblockRequests || []) as unknown as CardUnblockRequest[];

    // Server akce pro schválení půjčky (převede peníze na účet a změní status)
    async function approveLoan(formData: FormData) {
        "use server";
        const loanId = formData.get("loanId") as string;
        const accountId = formData.get("accountId") as string;
        const amount = Number(formData.get("amount"));

        const admin = await createAdminClient();

        // 1. Nastavit půjčku jako schválenou
        await admin.from("loans").update({ status: "APPROVED" }).eq("id", loanId);

        // 2. Načíst aktuální zůstatek účtu klienta
        const { data: account } = await admin.from("accounts").select("balance").eq("id", accountId).single();

        // 3. Připsat peníze z půjčky na účet klienta
        if (account) {
            await admin.from("accounts")
                .update({ balance: Number(account.balance) + amount })
                .eq("id", accountId);
            
            // Log do transakcí - peníze "od banky"
            await admin.from("transactions").insert({
                to_account_id: accountId,
                amount: amount,
                currency: "CZK",
                type: "TRANSFER",
                description: "Schválení úvěru",
                status: "COMPLETED"
            });
        }
        revalidatePath("/dashboard/banker");
    }

    // Server akce pro zamítnutí půjčky
    async function rejectLoan(formData: FormData) {
        "use server";
        const loanId = formData.get("loanId") as string;
        const admin = await createAdminClient();
        await admin.from("loans").update({ status: "REJECTED" }).eq("id", loanId);
        revalidatePath("/dashboard/banker");
    }

    return (
        <div className="space-y-8 py-8 cs-container">
            <header>
                <h1 className="font-bold text-3xl tracking-tight">Bankovní portál</h1>
                <p className="text-muted-foreground">Správa klientů a žádostí (Bankéř: {profile?.first_name})</p>
            </header>

            <div className="gap-6 grid grid-cols-1 lg:grid-cols-2">
                <div className="space-y-6">
                    {/* Modul 1: Čekající půjčky */}
                    <Card className="shadow-sm border-orange-500/20">
                        <CardHeader>
                            <CardTitle className="flex justify-between">
                                Žádosti o půjčku 
                                <Badge variant="destructive">{pendingLoans?.length || 0}</Badge>
                            </CardTitle>
                            <CardDescription>Klienti čekající na schválení financování</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {!pendingLoans || pendingLoans.length === 0 ? (
                                <p className="text-muted-foreground text-sm">Žádné čekající žádosti.</p>
                            ) : (
                                <div className="space-y-4">
                                    {pendingLoans?.map((loan) => (
                                        <div
                                            key={loan.id}
                                            className="flex justify-between items-center bg-card p-4 border rounded-lg"
                                        >
                                            <div>
                                                <p className="font-semibold">
                                                    {loan.profiles?.first_name} {loan.profiles?.last_name}
                                                </p>
                                                <p className="text-muted-foreground text-sm">
                                                    Účet: {loan.accounts?.account_number}
                                                </p>
                                                <p className="mt-1 text-sm">
                                                    Účel:{' '}
                                                    <span className="italic">
                                                        &quot;{loan.purpose}&quot;
                                                    </span>
                                                </p>
                                                <p className="mt-1 font-bold text-primary">
                                                    {Number(loan.amount).toLocaleString("cs-CZ")} CZK
                                                </p>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <form action={approveLoan}>
                                                    <input type="hidden" name="loanId" value={loan.id} />
                                                    <input
                                                        type="hidden"
                                                        name="accountId"
                                                        value={loan.accounts?.id}
                                                    />
                                                    <input type="hidden" name="amount" value={loan.amount} />
                                                    <Button
                                                        size="sm"
                                                        className="bg-green-600 hover:bg-green-700 w-full"
                                                    >
                                                        Schválit
                                                    </Button>
                                                </form>
                                                <form action={rejectLoan}>
                                                    <input type="hidden" name="loanId" value={loan.id} />
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        className="w-full"
                                                    >
                                                        Zamítnout
                                                    </Button>
                                                </form>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Modul 2: Ostatní klientské žádosti (odblokování karet) */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex justify-between">
                                Ostatní klientské žádosti
                                <Badge variant="outline">
                                    {unblockRequests?.length || 0}
                                </Badge>
                            </CardTitle>
                            <CardDescription>
                                Žádosti o odblokování karet a další speciální požadavky.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {!unblockRequests || unblockRequests.length === 0 ? (
                                <p className="text-muted-foreground text-sm">
                                    Žádné další klientské žádosti.
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {unblockRequests.map((req) => (
                                        <div
                                            key={req.id}
                                            className="flex justify-between items-center bg-card p-4 border rounded-lg"
                                        >
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <Badge
                                                        variant="outline"
                                                        className="text-[11px] uppercase tracking-wide"
                                                    >
                                                        Odblokování karty
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(req.created_at).toLocaleString("cs-CZ")}
                                                    </span>
                                                </div>
                                                <p className="mt-2 font-semibold">
                                                    {req.profiles?.first_name} {req.profiles?.last_name}
                                                </p>
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    Karta:{' '}
                                                    {req.cards?.card_number
                                                        ? `•••• ${req.cards.card_number.slice(-4)}`
                                                        : "Neznámé číslo karty"}
                                                </p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    Účet: {req.accounts?.account_number ?? "Neznámý účet"}
                                                </p>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <form
                                                    action={async () => {
                                                        "use server";
                                                        await resolveCardUnblockRequest({
                                                            requestId: req.id,
                                                            newStatus: "APPROVED",
                                                        });
                                                    }}
                                                >
                                                    <Button
                                                        size="sm"
                                                        className="bg-green-600 hover:bg-green-700 w-full"
                                                    >
                                                        Odblokovat kartu
                                                    </Button>
                                                </form>
                                                <form
                                                    action={async () => {
                                                        "use server";
                                                        await resolveCardUnblockRequest({
                                                            requestId: req.id,
                                                            newStatus: "REJECTED",
                                                        });
                                                    }}
                                                >
                                                    <Button size="sm" variant="outline" className="w-full">
                                                        Zamítnout
                                                    </Button>
                                                </form>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Modul 3: Seznam klientů */}
                <Card>
                    <CardHeader>
                        <CardTitle>Aktivní klienti</CardTitle>
                        <CardDescription>Rychlý přehled stavu účtů a správa</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="flex flex-col">
                            {clients?.map((client: Client) => (
                                <ClientManagerRow key={client.id} client={client} />
                            ))}
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
