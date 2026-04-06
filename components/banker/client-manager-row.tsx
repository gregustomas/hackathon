"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { resetClientMfa, updateAccountLimit } from "@/app/dashboard/banker/actions";
import { Client } from "@/interfaces/banker";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function ClientManagerRow({ client }: { client: Client }) {
    const [isResetting, setIsResetting] = useState(false);
    const [isUpdatingLimit, setIsUpdatingLimit] = useState(false);
    const [showMfaDialog, setShowMfaDialog] = useState(false);
    
    // Pro ukázku bereme první účet 
    const primaryAccount = client.accounts && client.accounts.length > 0 ? client.accounts[0] : null;
    const [limitInput, setLimitInput] = useState(primaryAccount?.daily_limit || 50000);

    // Akce: Reset MFA (Zavolá se až po potvrzení v dialogu)
    async function executeMfaReset() {
        setIsResetting(true);
        const res = await resetClientMfa(client.id);
        
        if (res.success) {
          toast.success(res.message);
        } else {
          toast.error(res.message);
        }
        
        setIsResetting(false);
        setShowMfaDialog(false);
    }

    // Akce: Změna limitu
    async function handleLimitChange() {
        if (!primaryAccount) return;
        setIsUpdatingLimit(true);
        
        const res = await updateAccountLimit(primaryAccount.id, Number(limitInput));
        
        if (res.success) {
            toast.success(res.message);
        } else {
            toast.error(res.message);
        }
        
        setIsUpdatingLimit(false);
    }

    return (
        <>
            <div className="flex md:flex-row flex-col justify-between items-start md:items-center hover:bg-muted p-4 last:border-0 border-b transition-colors">
                {/* 1. Info o klientovi */}
                <div className="mb-4 md:mb-0">
                    <p className="font-semibold text-base">{client.first_name} {client.last_name}</p>
                    <p className="text-muted-foreground text-xs">{client.email}</p>
                    
                    {primaryAccount ? (
                        <div className="flex items-center gap-2 mt-1 font-mono text-sm">
                            <Badge variant="secondary" className="font-normal">{primaryAccount.account_number}</Badge>
                            <span className="font-semibold text-primary">{Number(primaryAccount.balance).toLocaleString("cs-CZ")} Kč</span>
                        </div>
                    ) : (
                        <Badge variant="outline" className="mt-1">Bez účtu</Badge>
                    )}
                </div>

                {/* 2. Akce bankéře */}
                <div className="flex sm:flex-row flex-col items-center gap-3 bg-card shadow-sm p-2 border rounded-md w-full md:w-auto">
                    
                    {/* Nadstandardní limit */}
                    {primaryAccount && (
                        <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-xs whitespace-nowrap">Limit:</span>
                            <Input 
                                type="number" 
                                className="w-24 h-8 font-mono text-xs" 
                                value={limitInput}
                                onChange={(e) => setLimitInput(Number(e.target.value))}
                                step={10000}
                            />
                            <Button 
                                size="sm" 
                                variant="secondary" 
                                className="h-8 text-xs"
                                onClick={handleLimitChange}
                                disabled={isUpdatingLimit || limitInput === primaryAccount.daily_limit}
                            >
                                {isUpdatingLimit ? "..." : "Uložit"}
                            </Button>
                        </div>
                    )}

                    <div className="hidden sm:block mx-1 bg-border w-px h-6"></div>

                    {/* Tlačítko na MFA */}
                    <Button 
                        variant="destructive" 
                        size="sm" 
                        className="w-full sm:w-auto h-8 text-xs"
                        onClick={() => setShowMfaDialog(true)}
                        disabled={isResetting}
                    >
                        {isResetting ? "Zpracování..." : "Reset 2FA"}
                    </Button>
                </div>
            </div>

            {/* Dialog pro potvrzení Resetu MFA */}
            <AlertDialog open={showMfaDialog} onOpenChange={setShowMfaDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Resetovat 2FA zabezpečení?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Chystáte se smazat všechny ověřovací faktory (Authenticator aplikace) pro klienta{" "}
                            <strong className="text-foreground">{client.first_name} {client.last_name}</strong>.
                            <br /><br />
                            Tento krok nelze vrátit zpět. Klient bude po příštím přihlášení vyzván k nastavení nového 2FA zařízení.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isResetting}>Zrušit</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={(e) => {
                                e.preventDefault(); // Zabrání okamžitému zavření dialogu, zavřeme ho sami až po await
                                executeMfaReset();
                            }}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                            disabled={isResetting}
                        >
                            {isResetting ? "Resetuji..." : "Smazat 2FA"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
