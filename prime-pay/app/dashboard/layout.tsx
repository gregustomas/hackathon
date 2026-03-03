import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { WalletCards } from 'lucide-react'
import { UserNav } from '@/components/user-nav'
import { ThemeToggle } from '@/components/theme-switcher'
import { createAdminClient } from '@/lib/supabase/server'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()

  // Zde chyběl await u createAdminClient!
  const supabaseAdmin = await createAdminClient()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Získáme profil pro hlavičku a štítky rolí
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("first_name, last_name, role, email")
    .eq("id", user.id)
    .single();

  // Získáme data o všech uživatelových účtech pro Dropdown
  const { data: rawAccounts } = await supabaseAdmin
    .from("accounts")
    .select("id, account_number, balance")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: true });

 
  const accounts = (rawAccounts || []).filter(
      (acc) => !acc.account_number.startsWith("9999")
  );

  // Do UserNav pošleme jen jako výchozí (default) ID prvního účtu.
  const fallbackAccountId = accounts?.[0]?.id;

  return (
    <div className="flex flex-col bg-background min-h-screen" suppressHydrationWarning>
      
      {/* GLOBÁLNÍ HLAVIČKA */}
      <header className="top-0 z-50 sticky bg-background/95 supports-backdrop-filter:bg-background/60 shadow-sm backdrop-blur border-b w-full">
        <div className="flex justify-between items-center h-16 cs-container">
          
          {/* Levé logo */}
          <div className="flex items-center gap-2">
            <div className="bg-primary p-1.5 rounded-lg text-primary-foreground">
              <WalletCards className="size-5" />
            </div>
            <span className="hidden sm:inline-block font-bold text-lg tracking-tight">
              Prime Pay
            </span>
            
            {/* Štítek role */}
            {profile?.role !== 'CLIENT' && profile?.role !== 'CHILD' && (
                <span className="bg-red-100 ml-2 px-2 py-0.5 rounded-md font-semibold text-red-700 text-xs">
                  {profile?.role} VIEW
                </span> 
            )}
            {profile?.role === 'CHILD' && (
                <span className="bg-blue-100 ml-2 px-2 py-0.5 rounded-md font-semibold text-blue-700 text-xs">
                  JUNIOR
                </span>
            )}
          </div>

          {/* Pravá navigační sekce s Dropdownem */}
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <UserNav 
              firstName={profile?.first_name} 
              lastName={profile?.last_name} 
              email={profile?.email || user.email}
              role={profile?.role}
              accounts={accounts || []}
              fallbackAccountId={fallbackAccountId} // Nová prop
            />
          </div>
          
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>
      
    </div>
  )
}
