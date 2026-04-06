import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { WalletCards } from "lucide-react";
import { UserNav } from "@/components/user-nav";
import { ThemeToggle } from "@/components/theme-switcher";
import { createAdminClient } from "@/lib/supabase/server";
import { InactivityProvider } from "@/components/inactivity-provider";

type UserRole = "CLIENT" | "CHILD" | "BANKER" | "ADMIN";

interface ProfileRow {
  first_name: string;
  last_name: string;
  role: UserRole;
  email: string | null;
}

interface AccountRow {
  id: string;
  account_number: string;
  balance: number;
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();

  const supabaseAdmin = await createAdminClient();
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

  // Middleware už ověřil session – tady jen ověříme, že user existuje
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Načteme profil a účty pro header
  const { data: profileData } = await supabaseAdmin
    .from("profiles")
    .select("first_name, last_name, role, email")
    .eq("id", user.id)
    .single();

  const profile = profileData as ProfileRow;

  const { data: rawAccounts } = await supabaseAdmin
    .from("accounts")
    .select("id, account_number, balance")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: true })
    .returns<AccountRow[]>();

  const accounts: AccountRow[] = (rawAccounts ?? []).filter(
    (acc) => !acc.account_number.startsWith("9999"),
  );

  const fallbackAccountId = accounts[0]?.id;

  return (
    <InactivityProvider>
      <div
        className="flex flex-col bg-background min-h-screen"
        suppressHydrationWarning
      >
        <header className="top-0 z-50 sticky bg-background/95 supports-backdrop-filter:bg-background/60 shadow-sm backdrop-blur border-b w-full">
          <div className="flex justify-between items-center h-16 cs-container">
            <div className="flex items-center gap-2">
              <div className="bg-primary p-1.5 rounded-lg text-primary-foreground">
                <WalletCards className="size-5" />
              </div>
              <span className="hidden sm:inline-block font-bold text-lg tracking-tight">
                Prime Pay
              </span>

              {profile.role !== "CLIENT" && profile.role !== "CHILD" && (
                <span className="bg-red-100 ml-2 px-2 py-0.5 rounded-md font-semibold text-red-700 text-xs">
                  {profile.role} VIEW
                </span>
              )}
              {profile.role === "CHILD" && (
                <span className="bg-blue-100 ml-2 px-2 py-0.5 rounded-md font-semibold text-blue-700 text-xs">
                  JUNIOR
                </span>
              )}
            </div>

            <div className="flex items-center gap-4">
              <ThemeToggle />
              <UserNav
              
                firstName={profile.first_name}
                lastName={profile.last_name}
                email={profile.email ?? user.email as string}
                role={profile.role}
                accounts={accounts}
                fallbackAccountId={fallbackAccountId}
              />
            </div>
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </InactivityProvider>
  );
}
