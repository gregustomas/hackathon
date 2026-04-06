import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DevicesPanel } from "@/components/settings/devices-panel";

export default async function DevicesPage() {
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

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6 py-8 cs-container">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Přihlášená zařízení</h1>
        <p className="text-muted-foreground text-sm">
          Zkontrolujte, kde všude jste přihlášeni, a případně vybraná zařízení odhlašte.
        </p>
      </div>

      <DevicesPanel />
    </div>
  );
}
