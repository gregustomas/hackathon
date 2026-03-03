import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";

import { CardDisplay } from "@/components/client/card-display"; // Zkontroluj cestu k tvé komponentě!
import { NewCardButton } from "@/components/client/new-card-button";
import { 
    Card,  
    CardDescription, 
    CardHeader, 
    CardTitle 
} from "@/components/ui/card";

export interface SupabaseCardRow {
    id: string;
    account_id: string;
    card_number: string;
    expiry_date: string;  
    cvv: string;
    is_active: boolean;
    daily_limit: number;
    atm_limit: number;
    created_at: string;
}


export default async function CardsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const cookieStore = await cookies();
    
    // 1. Ověření uživatele (AAL ověření)
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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    // 2. Bezpečné načtení dat přes Admin klienta
    const supabaseAdmin = await createAdminClient();

    // Nejprve potřebujeme ID účtu, ke kterému se budou karty vázat
    const { data: accounts } = await supabaseAdmin
        .from("accounts")
        .select("id")
        .eq("profile_id", user.id)
        .order("created_at", { ascending: true });

    let account = accounts && accounts.length > 0 ? accounts[0] : null;
    if (selectedAccountId && accounts) {
        const found = accounts.find(a => a.id === selectedAccountId);
        if (found) account = found;
    }

    if (!account) {
        return (
            <div className="py-10 cs-container">
                <p>Nenalezen žádný účet pro přiřazení karty.</p>
            </div>
        );
    }

    // Nyní načteme všechny karty patřící k tomuto účtu
    const { data: dbCards, error: cardsError } = await supabaseAdmin
        .from("cards")
        .select("*")
        .eq("account_id", account.id)
        .order("created_at", { ascending: false });

    if (cardsError) {
        console.error("Chyba při načítání karet:", cardsError);
    }

    // 3. Mapování z DB struktury do Props struktury tvé komponenty
    // DB vrací snake_case (card_number), komponenta chce camelCase (cardNumber)
    const cards = (dbCards || []).map((card: SupabaseCardRow) => ({
        id: card.id,
        card_number: card.card_number,
        expiry_date: card.expiry_date,
        cvv: card.cvv,
        is_active: card.is_active,
        daily_limit: card.daily_limit
    }));

    return (
        <div className="space-y-8 py-8 cs-container">
            {/* Header */}
            <header className="flex md:flex-row flex-col justify-between md:items-end gap-4">
                <div>
                    <h1 className="font-bold text-3xl tracking-tight">Karty</h1>
                    <p className="text-muted-foreground">
                        Spravujte své virtuální karty a bezpečnostní limity
                    </p>
                </div>
                {/* Předáme accountId do klientského tlačítka */}
                <NewCardButton accountId={account.id} />
            </header>

            {/* Seznam karet */}
            {cards.length === 0 ? (
                <Card className="bg-muted/50 border-dashed">
                    <CardHeader className="text-center">
                        <CardTitle>Zatím nemáte žádnou kartu</CardTitle>
                        <CardDescription>
                            Vytvořte si svou první virtuální kartu pro bezpečné platby na internetu.
                        </CardDescription>
                    </CardHeader>
                </Card>
            ) : (
                <div className="gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {cards.map((card) => (
                        <div key={card.id} className="flex flex-col gap-4">
                            <CardDisplay card={card} />
                            
                            {/* Doprovodné informace pod kartou (volitelné) */}
                            <div className="flex justify-between px-2 text-muted-foreground text-sm">
                                <span>Limit pro platby:</span>
                                <span>{Number(card.daily_limit).toLocaleString("cs-CZ")} CZK</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
