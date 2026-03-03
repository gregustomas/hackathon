"use client";

import { useRef, useState } from "react";
import { processPayment } from "@/app/dashboard/client/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { SendIcon, CreditCard, ArrowRightLeft, Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils"; 

export function PaymentForm({
    senderAccountId,
    currentBalance,
}: {
    senderAccountId: string;
    currentBalance: number;
}) {
    const formRef = useRef<HTMLFormElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [paymentType, setPaymentType] = useState<"TRANSFER" | "CARD">("TRANSFER");

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsPending(true);

        try {
            const formData = new FormData(e.currentTarget);
            formData.append("idempotencyKey", crypto.randomUUID());
            formData.append("paymentType", paymentType);
       
            const result = await processPayment({error: null }, formData);

            if (result?.error) {
                toast.error("Platba selhala", { description: result.error });
            } else if (result?.success) {
                toast.success("Platba byla úspěšná!");
                formRef.current?.reset();
                setIsOpen(false);
            }
        } catch  {
            toast.error("Nastala nečekaná chyba.");
        } finally {
            setIsPending(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
                        <Input
                            name="accountNumber"
                            required
                            placeholder={paymentType === "TRANSFER" ? "Např. 1234567890" : "ID Obchodníka"}
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
    );
}
