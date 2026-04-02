"use client";

import { useRef, useState } from "react";
import { processPayment } from "@/app/dashboard/client/actions";
import { saveRecipient } from "@/lib/recipients/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { SendIcon, CreditCard, ArrowRightLeft, Loader2, BookmarkPlus } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { RecipientsCombobox } from "./recipients-combobox";
import { SavedRecipient } from "@/types/dashboard";

export function PaymentForm({
    senderAccountId,
    currentBalance,
    profileId,
    savedRecipients = [],
    prefillAccountNumber,
    onPaymentSuccess,
}: {
    senderAccountId: string;
    currentBalance: number;
    profileId: string;
    savedRecipients?: SavedRecipient[];
    prefillAccountNumber?: string;
    onPaymentSuccess?: () => void;
}) {
    const formRef = useRef<HTMLFormElement>(null);
    const [isOpen, setIsOpen] = useState(!!prefillAccountNumber);
    const [isPending, setIsPending] = useState(false);
    const [paymentType, setPaymentType] = useState<"TRANSFER" | "CARD">("TRANSFER");

    // Řízený input pro číslo účtu (potřeba pro combobox)
    const [accountNumber, setAccountNumber] = useState(prefillAccountNumber ?? "");

    // Stav po úspěšné platbě — nabídne uložení příjemce
    const [justPaidTo, setJustPaidTo] = useState<string | null>(null);
    const [saveLabel, setSaveLabel] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const isAlreadySaved = savedRecipients.some(
        (r) => r.account_number === justPaidTo
    );

    const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsPending(true);

        try {
            const formData = new FormData(e.currentTarget);
            formData.set("accountNumber", accountNumber);
            formData.append("idempotencyKey", crypto.randomUUID());
            formData.append("paymentType", paymentType);

            const result = await processPayment({ error: null }, formData);

            if (result?.error) {
                toast.error("Platba selhala", { description: result.error });
            } else if (result?.success) {
                toast.success("Platba byla úspěšná!");
                const paidTo = accountNumber;
                formRef.current?.reset();
                setAccountNumber("");
                setIsOpen(false);
                onPaymentSuccess?.();
                // Po zavření dialogu nabídneme uložení příjemce (jen pro převod)
                if (paymentType === "TRANSFER") {
                    setJustPaidTo(paidTo);
                }
            }
        } catch {
            toast.error("Nastala nečekaná chyba.");
        } finally {
            setIsPending(false);
        }
    };

    const handleSaveRecipient = async () => {
        if (!justPaidTo || !saveLabel.trim()) return;
        setIsSaving(true);
        const result = await saveRecipient({
            profileId,
            accountNumber: justPaidTo,
            label: saveLabel.trim(),
        });
        setIsSaving(false);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Příjemce byl uložen do adresáře.");
            setJustPaidTo(null);
            setSaveLabel("");
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => {
                setIsOpen(open);
                if (!open) { setAccountNumber(""); }
            }}>
                <DialogTrigger asChild>
                    <Button>Nová platba</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-106.25">
                    <DialogHeader>
                        <DialogTitle>Nová platba</DialogTitle>
                        <DialogDescription>
                            Vyberte způsob platby a vyplňte detaily.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="gap-2 grid grid-cols-2 bg-muted mb-4 p-1 rounded-lg">
                        <button
                            type="button"
                            onClick={() => setPaymentType("TRANSFER")}
                            className={cn(
                                "flex justify-center items-center gap-2 px-3 py-2 rounded-md font-medium text-sm transition-all",
                                paymentType === "TRANSFER"
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                            )}
                        >
                            <ArrowRightLeft className="w-4 h-4" />
                            Převod na účet
                        </button>
                        <button
                            type="button"
                            onClick={() => setPaymentType("CARD")}
                            className={cn(
                                "flex justify-center items-center gap-2 px-3 py-2 rounded-md font-medium text-sm transition-all",
                                paymentType === "CARD"
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                            )}
                        >
                            <CreditCard className="size-4" />
                            Platba kartou
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} ref={formRef} className="space-y-4">
                        <input type="hidden" name="senderAccountId" value={senderAccountId} />

                        <div className="space-y-2">
                            <label className="font-medium text-sm">
                                {paymentType === "TRANSFER" ? "Číslo účtu příjemce" : "Identifikátor obchodníka / Terminálu"}
                            </label>

                            {/* Combobox pro adresář — jen pro převody */}
                            {paymentType === "TRANSFER" && savedRecipients.length > 0 && (
                                <RecipientsCombobox
                                    recipients={savedRecipients}
                                    onSelect={(num) => setAccountNumber(num)}
                                />
                            )}

                            <Input
                                name="accountNumber"
                                required
                                value={accountNumber}
                                onChange={(e) => setAccountNumber(e.target.value)}
                                placeholder={paymentType === "TRANSFER" ? "Např. 1234567890/8888" : "ID Obchodníka"}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="font-medium text-sm">Částka (CZK)</label>
                            <Input
                                name="amount"
                                type="number"
                                min="1"
                                max={currentBalance}
                                step="0.01"
                                required
                                placeholder="0.00"
                            />
                            <p className="text-muted-foreground text-xs">
                                Maximum k odeslání: {currentBalance.toLocaleString()} CZK
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="font-medium text-sm">
                                {paymentType === "TRANSFER" ? "Zpráva pro příjemce" : "Popis platby"}
                            </label>
                            <Input
                                name="description"
                                placeholder={paymentType === "TRANSFER" ? "Např. Za oběd..." : "Nákup v eshopu"}
                                maxLength={140}
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                    Zpracovávám...
                                </>
                            ) : (
                                <>
                                    {paymentType === "TRANSFER" ? <SendIcon className="mr-2 w-4 h-4" /> : <CreditCard className="mr-2 w-4 h-4" />}
                                    {paymentType === "TRANSFER" ? "Odeslat platbu" : "Zaplatit kartou"}
                                </>
                            )}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Inline nabídka uložení příjemce po platbě */}
            {justPaidTo && !isAlreadySaved && (
                <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
                    <p className="text-sm font-medium flex items-center gap-2">
                        <BookmarkPlus className="size-4 text-primary" />
                        Uložit příjemce do adresáře?
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">{justPaidTo}</p>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Název (např. Mama, Pronájem…)"
                            value={saveLabel}
                            onChange={(e) => setSaveLabel(e.target.value)}
                            maxLength={40}
                            className="h-8 text-sm"
                        />
                        <Button
                            size="sm"
                            disabled={!saveLabel.trim() || isSaving}
                            onClick={handleSaveRecipient}
                        >
                            {isSaving ? <Loader2 className="size-3 animate-spin" /> : "Uložit"}
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => { setJustPaidTo(null); setSaveLabel(""); }}
                        >
                            Ne
                        </Button>
                    </div>
                </div>
            )}
        </>
    );
}
