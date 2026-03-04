"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowDownRight, ArrowUpRight, CreditCard, Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

type HistoryTableProps = {
    transactions: Transaction[];
    currentAccountId: string;
    accountNumber: string;
};

export function HistoryTable({
    transactions,
    currentAccountId,
    accountNumber,
}: HistoryTableProps) {
    const normalizeText = (value: string) =>
        value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const handleExportPdf = () => {
        if (transactions.length === 0) {
            return;
        }

        const doc = new jsPDF();

        doc.setFontSize(16);
        doc.text(normalizeText("Výpis transakcí"), 14, 18);

        doc.setFontSize(10);
        doc.text(normalizeText(`Číslo účtu: ${accountNumber}`), 14, 26);
        doc.text(
            normalizeText(`Vygenerováno: ${new Date().toLocaleString("cs-CZ")}`),
            14,
            31
        );

        const head = [[
            normalizeText("Typ"),
            normalizeText("Protistrana"),
            normalizeText("Datum"),
            normalizeText("Popis"),
            normalizeText("Částka"),
        ]];

        const body = transactions.map((tx) => {
            const isOutgoing = tx.from_account_id === currentAccountId;
            const safeDescription = tx.description || "";
            const isCardPayment = safeDescription.startsWith("[KARTA]");
            const cleanDescription = isCardPayment
                ? safeDescription.replace("[KARTA] ", "").replace("[KARTA]", "")
                : safeDescription;

            const date = new Date(tx.created_at).toLocaleDateString("cs-CZ", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });

            let targetAccount = "Neznámý účet";
            if (isOutgoing && tx.receiver) {
                targetAccount = Array.isArray(tx.receiver)
                    ? tx.receiver[0]?.account_number
                    : tx.receiver.account_number;
            } else if (!isOutgoing && tx.sender) {
                targetAccount = Array.isArray(tx.sender)
                    ? tx.sender[0]?.account_number
                    : tx.sender.account_number;
            }

            if (isCardPayment && targetAccount !== "Neznámý účet") {
                targetAccount = `Obchodník (ID: ${targetAccount})`;
            }

            const amountPrefix = isOutgoing ? "-" : "+";
            const amountValue = Number(tx.amount).toLocaleString("cs-CZ");

            const typeLabel = isCardPayment
                ? "Platba kartou"
                : isOutgoing
                ? "Odesláno"
                : "Přijato";

            return [
                normalizeText(typeLabel),
                normalizeText(targetAccount || "Neznámý účet"),
                date,
                normalizeText(cleanDescription || "-"),
                `${amountPrefix}${amountValue} CZK`,
            ];
        });

        autoTable(doc, {
            head,
            body,
            startY: 38,
            styles: { fontSize: 9 },
            headStyles: { fillColor: [249, 250, 251], textColor: 0 },
        });

        doc.save(`vypis-${accountNumber}.pdf`);
    };

    return (
        <Card className="flex flex-col h-full" suppressHydrationWarning>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                    <CardTitle>Nedávné transakce</CardTitle>
                    <CardDescription>
                        Posledních 10 pohybů na vašem účtu
                    </CardDescription>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={handleExportPdf}
                    className="gap-2"
                    disabled={transactions.length === 0}
                >
                    <Download className="w-4 h-4" />
                    Exportovat výpis (PDF)
                </Button>
            </CardHeader>
            <CardContent className="flex-1">
                {transactions.length === 0 ? (
                    <div className="py-8 text-muted-foreground text-center">
                        Zatím nemáte žádné transakce.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
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
                                    const isOutgoing =
                                        tx.from_account_id === currentAccountId;

                                    const safeDescription = tx.description || "";
                                    const isCardPayment =
                                        safeDescription.startsWith("[KARTA]");
                                    const cleanDescription = isCardPayment
                                        ? safeDescription
                                              .replace("[KARTA] ", "")
                                              .replace("[KARTA]", "")
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

                                    let targetAccount = "Neznámý účet";
                                    if (isOutgoing && tx.receiver) {
                                        targetAccount = Array.isArray(tx.receiver)
                                            ? tx.receiver[0]?.account_number
                                            : tx.receiver.account_number;
                                    } else if (!isOutgoing && tx.sender) {
                                        targetAccount = Array.isArray(tx.sender)
                                            ? tx.sender[0]?.account_number
                                            : tx.sender.account_number;
                                    }

                                    if (isCardPayment && targetAccount !== "Neznámý účet") {
                                        targetAccount = `Obchodník (ID: ${targetAccount})`;
                                    }

                                    return (
                                        <TableRow key={tx.id} suppressHydrationWarning>
                                            <TableCell>
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

                                            <TableCell className="font-mono text-sm">
                                                {targetAccount || "Neznámý účet"}
                                            </TableCell>

                                            <TableCell className="text-muted-foreground text-sm">
                                                {date}
                                            </TableCell>

                                            <TableCell>{cleanDescription || "-"}</TableCell>

                                            <TableCell
                                                className={`text-right font-bold ${
                                                    isOutgoing ? "" : "text-green-500"
                                                }`}
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
                )}
            </CardContent>
        </Card>
    );
}
