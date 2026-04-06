"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useInactivityLogout } from "@/hooks/use-inactivity-logout";
import { InactivityWarningDialog } from "./inactivity-warning-dialog";

export function InactivityProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = createClient();

  const { showWarning, secondsLeft, stayLoggedIn, performLogout } =
    useInactivityLogout(async () => {
      await supabase.auth.signOut();
      router.push("/login");
    });

  return (
    <>
      {children}
      <InactivityWarningDialog
        open={showWarning}
        secondsLeft={secondsLeft}
        onStayLoggedIn={stayLoggedIn}
        onLogout={performLogout}
      />
    </>
  );
}
