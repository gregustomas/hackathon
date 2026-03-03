"use client";

import {
    useActionState,
    useEffect,
    useRef,
    startTransition,
    useState,
} from "react";
import {
    processPayment,
    type PaymentState,
} from "@/app/dashboard/client/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { SendIcon } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
export function PaymentForm({
    senderAccountId,
    currentBalance,
}: {
    senderAccountId: string;
    currentBalance: number;
}) {
    const [state, formAction, isPending] = useActionState(processPayment, {
        error: null,
    });
    const formRef = useRef<HTMLFormElement>(null);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (state.error) {
            toast.error("Platba selhala", { description: state.error });
        }
        if (state.success) {
            toast.success("Platba byla úspěšná!");
            formRef.current?.reset();
        }
    }, [state]);

    const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);
        formData.append("idempotencyKey", crypto.randomUUID());
        startTransition(() => {
            formAction(formData);
        });
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button>Začít</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nová platba</DialogTitle>
                        <DialogDescription>
                            <form
                                onSubmit={handleSubmit}
                                ref={formRef}
                                className="space-y-4"
                            >
                                <input
                                    type="hidden"
                                    name="senderAccountId"
                                    value={senderAccountId}
                                />

                                <div className="space-y-2">
                                    <label className="font-medium text-sm">
                                        Číslo účtu příjemce
                                    </label>
                                    <Input
                                        name="accountNumber"
                                        required
                                        placeholder="Např. 1234567890"
                                        pattern="\d+"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="font-medium text-sm">
                                        Částka (CZK)
                                    </label>
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
                                        Maximum k odeslání:{" "}
                                        {currentBalance.toLocaleString()} CZK
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="font-medium text-sm">
                                        Zpráva pro příjemce
                                    </label>
                                    <Input
                                        name="description"
                                        placeholder="Např. Za oběd..."
                                        maxLength={140}
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={isPending}
                                >
                                    {isPending ? (
                                        "Zpracovávám..."
                                    ) : (
                                        <>
                                            <SendIcon className="mr-2 w-4 h-4" />
                                            Odeslat platbu
                                        </>
                                    )}
                                </Button>
                            </form>
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        </>
    );
}
