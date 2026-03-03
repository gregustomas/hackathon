"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

interface Transaction {
    id: string;
    from_account_id: string;
    to_account_id: string;
    amount: number;
    description: string;
    receiver: { account_number: string } | null;
    sender: { account_number: string } | null;
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
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Typ</TableHead>
                        <TableHead>Protistrana</TableHead> {/* Nový sloupec */}
                        <TableHead>Datum</TableHead>
                        <TableHead>Popis</TableHead>
                        <TableHead className="text-right">Částka</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {transactions.map((tx) => {
                        const isOutgoing =
                            tx.from_account_id === currentAccountId;
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

                        // Zjištění čísla účtu protistrany z joinnutých dat
                        const targetAccount = isOutgoing
                            ? tx.receiver?.account_number
                            : tx.sender?.account_number;

                        return (
                            <TableRow key={tx.id} suppressHydrationWarning>
                                <TableCell>
                                    {isOutgoing ? (
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

                                {/* Vykreslení čísla účtu protistrany */}
                                <TableCell className="font-mono text-sm">
                                    {targetAccount || "Neznámý účet"}
                                </TableCell>

                                <TableCell className="text-muted-foreground text-sm">
                                    {date}
                                </TableCell>
                                <TableCell>{tx.description || "-"}</TableCell>
                                <TableCell
                                    className={`text-right font-bold ${isOutgoing ? "" : "text-green-500"}`}
                                >
                                    {isOutgoing ? "-" : "+"}
                                    {Number(tx.amount).toLocaleString(
                                        "cs-CZ",
                                    )}{" "}
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
