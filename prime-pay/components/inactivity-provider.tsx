"use client";

import { useInactivityLogout } from "@/hooks/use-inactivity-logout";
import { InactivityWarningDialog } from "./inactivity-warning-dialog";

export function InactivityProvider({ children }: { children: React.ReactNode }) {
    const { showWarning, secondsLeft, stayLoggedIn, performLogout } = useInactivityLogout(()=>{});

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
