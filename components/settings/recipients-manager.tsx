"use client";

import { useState } from "react";
import { SavedRecipient } from "@/types/dashboard";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PaymentForm } from "@/components/client/payment-form";
import { toast } from "sonner";
import { Trash2, SendHorizonal, BookUser } from "lucide-react";

interface RecipientsManagerProps {
    recipients: SavedRecipient[];
    profileId: string;
    primaryAccountId: string;
    currentBalance: number;
    deleteRecipientAction: (args: { recipientId: string; profileId: string }) => Promise<{ error: string | null }>;
}

export function RecipientsManager({
    recipients,
    profileId,
    primaryAccountId,
    currentBalance,
    deleteRecipientAction,
}: RecipientsManagerProps) {
    const [list, setList] = useState<SavedRecipient[]>(recipients);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    // Který příjemce má otevřený PaymentForm dialog
    const [payingTo, setPayingTo] = useState<SavedRecipient | null>(null);

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        const result = await deleteRecipientAction({ recipientId: id, profileId });
        setDeletingId(null);
        if (result.error) {
            toast.error(result.error);
        } else {
            setList((prev) => prev.filter((r) => r.id !== id));
            toast.success("Příjemce byl odebrán z adresáře.");
        }
    };

    return (
        <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BookUser className="size-5" />
                    Adresář příjemců
                </CardTitle>
                <CardDescription>
                    Uložení příjemci pro rychlé platby. Nové příjemce lze přidat po odeslání platby.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {list.length === 0 ? (
                    <div className="py-8 border-2 border-dashed rounded-lg text-muted-foreground text-sm text-center">
                        Zatím nemáte uložené žádné příjemce. Příjemce se uloží automaticky po platbě.
                    </div>
                ) : (
                    <ul className="divide-y">
                        {list.map((r) => (
                            <li key={r.id} className="flex items-center justify-between py-3 gap-4">
                                <div className="min-w-0">
                                    <p className="font-medium truncate">{r.label}</p>
                                    <p className="text-xs text-muted-foreground font-mono">{r.account_number}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    {/* Tlačítko Zaplatit — otevře PaymentForm s předvyplněným účtem */}
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setPayingTo(r)}
                                    >
                                        <SendHorizonal className="size-3.5 mr-1.5" />
                                        Zaplatit
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-destructive hover:text-destructive"
                                        disabled={deletingId === r.id}
                                        onClick={() => handleDelete(r.id)}
                                    >
                                        <Trash2 className="size-3.5" />
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>

            {/* Platební dialog pro vybraného příjemce */}
            {payingTo && (
                <PaymentFormDialog
                    recipient={payingTo}
                    profileId={profileId}
                    primaryAccountId={primaryAccountId}
                    currentBalance={currentBalance}
                    savedRecipients={list}
                    onClose={() => setPayingTo(null)}
                />
            )}
        </Card>
    );
}

// Samostatný dialog pro platbu z adresáře
function PaymentFormDialog({
    recipient,
    profileId,
    primaryAccountId,
    currentBalance,
    savedRecipients,
    onClose,
}: {
    recipient: SavedRecipient;
    profileId: string;
    primaryAccountId: string;
    currentBalance: number;
    savedRecipients: SavedRecipient[];
    onClose: () => void;
}) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-background rounded-xl shadow-xl p-6 w-full max-w-md mx-4 space-y-4">
                <div>
                    <h2 className="font-semibold text-lg">Platba pro: {recipient.label}</h2>
                    <p className="text-sm text-muted-foreground font-mono">{recipient.account_number}</p>
                </div>
                <PaymentForm
                    senderAccountId={primaryAccountId}
                    currentBalance={currentBalance}
                    profileId={profileId}
                    savedRecipients={savedRecipients}
                    prefillAccountNumber={recipient.account_number}
                    onPaymentSuccess={onClose}
                />
            </div>
        </div>
    );
}

