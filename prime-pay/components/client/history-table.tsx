"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDownRight, ArrowUpRight, CreditCard, Download, Search, ChevronLeft, ChevronRight } from "lucide-react";
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
    // Stavy pro filtry a stránkování
    const [globalFilter, setGlobalFilter] = useState("");
    const [typeFilter, setTypeFilter] = useState("ALL"); 
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    // ==========================================
    // 1. ZPRACOVÁNÍ A FILTRACE (rychlá JS logika)
    // ==========================================
    const filteredData = transactions.filter(tx => {
        const isOutgoing = tx.from_account_id === currentAccountId;
        const isCardPayment = (tx.description || "").startsWith('[KARTA]');
        const txType = isCardPayment ? "CARD" : (isOutgoing ? "OUT" : "IN");

        // Filtr Typu
        if (typeFilter !== "ALL" && txType !== typeFilter) return false;

        // Fulltext Filtr
        if (globalFilter.trim() !== "") {
            const query = globalFilter.toLowerCase();
            const amountStr = String(tx.amount);
            const descStr = (tx.description || "").toLowerCase();
            
            let target = '';
            if (isOutgoing && tx.receiver) {
                target = Array.isArray(tx.receiver) ? tx.receiver[0]?.account_number : tx.receiver.account_number;
            } else if (!isOutgoing && tx.sender) {
                target = Array.isArray(tx.sender) ? tx.sender[0]?.account_number : tx.sender.account_number;
            }

            if (!amountStr.includes(query) && !descStr.includes(query) && !(target || "").toLowerCase().includes(query)) {
                return false;
            }
        }
        return true; 
    });

    // ==========================================
    // 2. STRÁNKOVÁNÍ
    // ==========================================
    const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
    const validCurrentPage = Math.min(currentPage, totalPages);
    
    const startIndex = (validCurrentPage - 1) * pageSize;
    const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

    // Handlery pro vyhledávání
    const handleSearchChange = (val: string) => {
        setGlobalFilter(val);
        setCurrentPage(1); // Vždy na první stranu při hledání
    };

    const handleTypeChange = (val: string) => {
        setTypeFilter(val);
        setCurrentPage(1); 
    };

    // ==========================================
    // 3. EXPORT DO PDF (Kolegův kód aplikovaný na vyfiltrovaná data)
    // ==========================================
    const normalizeText = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const handleExportPdf = () => {
        if (filteredData.length === 0) return;

        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text(normalizeText("Výpis transakcí"), 14, 18);

        doc.setFontSize(10);
        doc.text(normalizeText(`Číslo účtu: ${accountNumber}`), 14, 26);
        doc.text(normalizeText(`Vygenerováno: ${new Date().toLocaleString("cs-CZ")}`), 14, 31);

        const head = [[
            normalizeText("Typ"),
            normalizeText("Protistrana"),
            normalizeText("Datum"),
            normalizeText("Popis"),
            normalizeText("Částka"),
        ]];

        const body = filteredData.map((tx) => {
            const isOutgoing = tx.from_account_id === currentAccountId;
            const safeDescription = tx.description || "";
            const isCardPayment = safeDescription.startsWith("[KARTA]");
            const cleanDescription = isCardPayment
                ? safeDescription.replace("[KARTA] ", "").replace("[KARTA]", "")
                : safeDescription;

            const date = new Date(tx.created_at).toLocaleDateString("cs-CZ", {
                day: "2-digit", month: "2-digit", year: "numeric",
                hour: "2-digit", minute: "2-digit",
            });

            let targetAccount = "Neznámý účet";
            if (isOutgoing && tx.receiver) {
                targetAccount = Array.isArray(tx.receiver) ? tx.receiver[0]?.account_number : tx.receiver.account_number;
            } else if (!isOutgoing && tx.sender) {
                targetAccount = Array.isArray(tx.sender) ? tx.sender[0]?.account_number : tx.sender.account_number;
            }

            if (isCardPayment && targetAccount !== "Neznámý účet") {
                targetAccount = `Obchodník (ID: ${targetAccount})`;
            }

            const amountPrefix = isOutgoing ? "-" : "+";
            const amountValue = Number(tx.amount).toLocaleString("cs-CZ");

            const typeLabel = isCardPayment ? "Platba kartou" : isOutgoing ? "Odesláno" : "Přijato";

            return [
                normalizeText(typeLabel),
                normalizeText(targetAccount || "Neznámý účet"),
                date,
                normalizeText(cleanDescription || "-"),
                `${amountPrefix}${amountValue} CZK`,
            ];
        });

        autoTable(doc, {
            head, body,
            startY: 38,
            styles: { fontSize: 9 },
            headStyles: { fillColor: [249, 250, 251], textColor: 0 },
        });

        doc.save(`vypis-${accountNumber}.pdf`);
    };

    // ==========================================
    // VYKRESLENÍ (JSX)
    // ==========================================
    return (
        <Card className="flex flex-col h-full" suppressHydrationWarning>
            <CardHeader className="flex sm:flex-row flex-col justify-between items-start sm:items-center gap-4 pb-4">
                <div>
                    <CardTitle>Historie transakcí</CardTitle>
                    <CardDescription>
                        Přehled všech vašich pohybů na účtu
                    </CardDescription>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={handleExportPdf}
                    className="gap-2 shrink-0"
                    disabled={filteredData.length === 0}
                >
                    <Download className="w-4 h-4" />
                    Exportovat výpis (PDF)
                </Button>
            </CardHeader>
            <CardContent className="flex flex-col flex-1 gap-4">
                
                {/* OVLÁDACÍ PANEL FILTRŮ */}
                <div className="flex sm:flex-row flex-col justify-between items-center gap-4">
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="top-2.5 left-2.5 absolute w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Hledat transakci..."
                            value={globalFilter}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="bg-card pl-9"
                        />
                    </div>
                    <div className="w-full sm:w-45">
                        <Select value={typeFilter} onValueChange={handleTypeChange}> 
                            <SelectTrigger className="bg-card w-full">
                                <SelectValue placeholder="Typ transakce" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Všechny transakce</SelectItem>
                                <SelectItem value="IN">Příchozí platby</SelectItem>
                                <SelectItem value="OUT">Odchozí platby</SelectItem>
                                <SelectItem value="CARD">Platby kartou</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* TABULKA */}
                {transactions.length === 0 ? (
                    <div className="py-8 border rounded-md text-muted-foreground text-center">
                        Zatím nemáte žádné transakce.
                    </div>
                ) : (
                    <div className="bg-card border rounded-md overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead>Typ</TableHead>
                                    <TableHead>Protistrana</TableHead>
                                    <TableHead>Datum</TableHead>
                                    <TableHead>Popis</TableHead>
                                    <TableHead className="text-right">Částka</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedData.length > 0 ? (
                                    paginatedData.map((tx) => {
                                        const isOutgoing = tx.from_account_id === currentAccountId;
                                        const safeDescription = tx.description || "";
                                        const isCardPayment = safeDescription.startsWith("[KARTA]");
                                        const cleanDescription = isCardPayment
                                            ? safeDescription.replace("[KARTA] ", "").replace("[KARTA]", "")
                                            : safeDescription;

                                        const date = new Date(tx.created_at).toLocaleDateString("cs-CZ", {
                                            day: "2-digit", month: "2-digit", year: "numeric",
                                            hour: "2-digit", minute: "2-digit",
                                        });

                                        let targetAccount = "Neznámý účet";
                                        if (isOutgoing && tx.receiver) {
                                            targetAccount = Array.isArray(tx.receiver) ? tx.receiver[0]?.account_number : tx.receiver.account_number;
                                        } else if (!isOutgoing && tx.sender) {
                                            targetAccount = Array.isArray(tx.sender) ? tx.sender[0]?.account_number : tx.sender.account_number;
                                        }
                                        if (isCardPayment && targetAccount !== "Neznámý účet") {
                                            targetAccount = `Obchodník (ID: ${targetAccount})`;
                                        }

                                        return (
                                            <TableRow key={tx.id} suppressHydrationWarning className="hover:bg-muted/30">
                                                <TableCell>
                                                    {isCardPayment ? (
                                                        <span className="flex items-center bg-blue-500/10 px-2 py-1 rounded-md w-fit font-medium text-blue-500 text-xs">
                                                            <CreditCard className="mr-1 w-3 h-3" /> Platba kartou
                                                        </span>
                                                    ) : isOutgoing ? (
                                                        <span className="flex items-center bg-red-500/10 px-2 py-1 rounded-md w-fit font-medium text-red-500 text-xs">
                                                            <ArrowUpRight className="mr-1 w-3 h-3" /> Odesláno
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center bg-green-500/10 px-2 py-1 rounded-md w-fit font-medium text-green-500 text-xs">
                                                            <ArrowDownRight className="mr-1 w-3 h-3" /> Přijato
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-mono text-sm">{targetAccount || "Neznámý účet"}</TableCell>
                                                <TableCell className="text-muted-foreground text-sm">{date}</TableCell>
                                                <TableCell>{cleanDescription || "-"}</TableCell>
                                                <TableCell className={`text-right font-bold ${isOutgoing ? "" : "text-green-500"}`}>
                                                    {isOutgoing ? "-" : "+"}
                                                    {Number(tx.amount).toLocaleString("cs-CZ")} CZK
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-muted-foreground text-center">
                                            Nebyly nalezeny žádné transakce odpovídající filtru.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {/* STRÁNKOVÁNÍ NA MÍRU */}
                {filteredData.length > 0 && (
                    <div className="flex sm:flex-row flex-col justify-between items-center gap-4 pt-2">
                        <div className="text-muted-foreground text-sm">
                            Zobrazeno {paginatedData.length} z {filteredData.length} transakcí
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={validCurrentPage === 1}
                            >
                                <ChevronLeft className="hidden sm:block mr-1 w-4 h-4" /> Předchozí
                            </Button>
                            <div className="w-16 font-medium text-sm text-center">
                                {validCurrentPage} / {totalPages}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={validCurrentPage === totalPages}
                            >
                                Další <ChevronRight className="hidden sm:block ml-1 w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}

            </CardContent>
        </Card>
    );
}
