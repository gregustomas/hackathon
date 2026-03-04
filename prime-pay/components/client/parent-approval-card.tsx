"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2, Clock } from "lucide-react";
import type { PendingChildTransaction } from "@/types/dashboard";
// import { resolveChildTransactionAction } from "@/app/actions/transactions";

interface ParentApprovalCardProps {
    transaction: PendingChildTransaction;
}

type ResolveAction = "APPROVE" | "REJECT";

export function ParentApprovalCard({ transaction }: ParentApprovalCardProps) {
    const [isLoading, setIsLoading] = useState<ResolveAction | null>(null);

    const handleResolve = async (action: ResolveAction) => {
        setIsLoading(action);
        try {
            // await resolveChildTransactionAction(transaction.id, action);
            alert(`Platba byla ${action === "APPROVE" ? "schválena a odeslána" : "zamítnuta"}.`);
        } catch (error) {
            console.error(error);
            alert("Něco se pokazilo.");
        } finally {
            setIsLoading(null);
        }
    };

    const childName = transaction.sender?.profiles?.first_name ?? "Dítě";
    const formattedAmount = Number(transaction.amount).toLocaleString("cs-CZ");
    const formattedDate = new Date(transaction.created_at).toLocaleDateString("cs-CZ", {
        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
    });

    return (
        <Card className="bg-amber-500/5 shadow-sm border-amber-500/30">
            <CardContent className="space-y-3 pt-4 pb-2">
                <div className="flex items-center font-medium text-amber-600 text-sm">
                    <Clock className="mr-2 size-4" />
                    Čeká na schválení · {formattedDate}
                </div>

                <div className="flex justify-between items-end">
                    <span className="text-muted-foreground text-sm">{childName} posílá:</span>
                    <span className="font-bold text-lg">-{formattedAmount} CZK</span>
                </div>

                <div className="pt-2 border-amber-500/20 border-t">
                    <span className="block mb-1 text-muted-foreground text-xs">Příjemce (ID účtu):</span>
                    <span className="font-mono text-sm">{transaction.to_account_id}</span>
                </div>

                {transaction.description && (
                    <p className="text-muted-foreground text-xs truncate">
                        Zpráva: {transaction.description}
                    </p>
                )}
            </CardContent>

            <CardFooter className="gap-2 pt-2 pb-4">
                <Button
                    variant="outline"
                    className="hover:bg-red-50 w-full text-red-600 hover:text-red-700"
                    onClick={() => handleResolve("REJECT")}
                    disabled={isLoading !== null}
                >
                    {isLoading === "REJECT"
                        ? <Loader2 className="size-4 animate-spin" />
                        : <><X className="mr-1 size-4" /> Zamítnout</>
                    }
                </Button>
                <Button
                    className="bg-green-600 hover:bg-green-700 w-full text-white"
                    onClick={() => handleResolve("APPROVE")}
                    disabled={isLoading !== null}
                >
                    {isLoading === "APPROVE"
                        ? <Loader2 className="size-4 animate-spin" />
                        : <><Check className="mr-1 size-4" /> Schválit</>
                    }
                </Button>
            </CardFooter>
        </Card>
    );
}
