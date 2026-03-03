"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ArrowDownRight, ArrowUpRight, CreditCard } from "lucide-react";

export interface Transaction {
    id: string;
    from_account_id: string;
    to_account_id: string;
    amount: number;
    description: string;
    receiver: { account_number: string } | { account_number: string }[] | null;
    sender: { account_number: string } | { account_number: string }[] | null;
    created_at: string;
}

export function HistoryTable({
    transactions,
    currentAccountId,
}: {
    transactions: Transaction[];
    currentAccountId: string;
}) {

    if (transactions.length === 0) {
        return (
            <div className="py-8 text-muted-foreground text-center">
                Zatím nemáte žádné transakce.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto" suppressHydrationWarning>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Typ</TableHead>
                        <TableHead>Protistrana</TableHead>
                        <TableHead>Datum</TableHead>
                        <TableHead>Popis</TableHead>
                        <TableHead className="text-right">Částka</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {transactions.map((tx) => {
                        const isOutgoing = tx.from_account_id === currentAccountId;
                        
                        // ZJIŠŤOVÁNÍ TYPU PLATBY (pouze pro tento jeden konkrétní řádek)
                        const safeDescription = tx.description || "";
                        const isCardPayment = safeDescription.startsWith('[KARTA]');
                        const cleanDescription = isCardPayment 
                            ? safeDescription.replace('[KARTA] ', '').replace('[KARTA]', '') 
                            : safeDescription;

                        const date = new Date(tx.created_at).toLocaleDateString(
                            "cs-CZ",  
                            {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                            },
                        );

                        // Určení protistrany
                        let targetAccount = 'Neznámý účet';
                        if (isOutgoing && tx.receiver) {
                            targetAccount = Array.isArray(tx.receiver) 
                                ? tx.receiver[0]?.account_number 
                                : tx.receiver.account_number;
                        } else if (!isOutgoing && tx.sender) {
                            targetAccount = Array.isArray(tx.sender) 
                                ? tx.sender[0]?.account_number 
                                : tx.sender.account_number;
                        }

                        // Pokud je to karetní platba, změníme i zobrazení "Protistrany"
                        // aby se neukazovalo nudné ID obchodníka, ale nápis "Obchodník / Terminál"
                        if (isCardPayment && targetAccount !== 'Neznámý účet') {
                            targetAccount = `Obchodník (ID: ${targetAccount})`;
                        }

                        return (
                            <TableRow key={tx.id} suppressHydrationWarning>
                                <TableCell>
                                    {/* Rozlišení odznáčků (Badge) pro typ transakce */}
                                    {isCardPayment ? (
                                        <span className="flex items-center bg-blue-500/10 px-2 py-1 rounded-md w-fit font-medium text-blue-500 text-xs">
                                            <CreditCard className="mr-1 w-3 h-3" />{" "}
                                            Platba kartou
                                        </span>
                                    ) : isOutgoing ? (
                                        <span className="flex items-center bg-red-500/10 px-2 py-1 rounded-md w-fit font-medium text-red-500 text-xs">
                                            <ArrowUpRight className="mr-1 w-3 h-3" />{" "}
                                            Odesláno
                                        </span>
                                    ) : (
                                        <span className="flex items-center bg-green-500/10 px-2 py-1 rounded-md w-fit font-medium text-green-500 text-xs">
                                            <ArrowDownRight className="mr-1 w-3 h-3" />{" "}
                                            Přijato
                                        </span>
                                    )}
                                </TableCell>

                                {/* Vykreslení čísla účtu / obchodníka */}
                                <TableCell className="font-mono text-sm">
                                    {targetAccount || "Neznámý účet"}
                                </TableCell>

                                <TableCell className="text-muted-foreground text-sm">
                                    {date}
                                </TableCell>
                                
                                {/* Čistý popis bez ošklivého [KARTA] */}
                                <TableCell>{cleanDescription || "-"}</TableCell>
                                
                                <TableCell
                                    className={`text-right font-bold ${isOutgoing ? "" : "text-green-500"}`}
                                >
                                    {isOutgoing ? "-" : "+"}
                                    {Number(tx.amount).toLocaleString("cs-CZ")}{" "}
                                    CZK
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
