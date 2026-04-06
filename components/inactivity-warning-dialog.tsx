"use client";

import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

interface InactivityWarningDialogProps {
    open: boolean;
    secondsLeft: number;
    onStayLoggedIn: () => void;
    onLogout: () => void;
}

export function InactivityWarningDialog({
    open,
    secondsLeft,
    onStayLoggedIn,
    onLogout,
}: InactivityWarningDialogProps) {
    return (
        <AlertDialog open={open}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <ShieldAlert className="size-5 text-amber-500" />
                        Automatické odhlášení
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                        <span className="block">
                            Z bezpečnostních důvodů vás za{" "}
                            <strong className="text-foreground text-lg">{secondsLeft}</strong>{" "}
                            sekund automaticky odhlásíme z důvodu neaktivity.
                        </span>
                        <span className="block text-xs">
                            Pokud chcete zůstat přihlášeni, klikněte na tlačítko níže.
                        </span>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <Button variant="outline" onClick={onLogout}>
                        Odhlásit se
                    </Button>
                    <Button onClick={onStayLoggedIn}>
                        Zůstat přihlášen
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
