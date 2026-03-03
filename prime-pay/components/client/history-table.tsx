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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDownRight, ArrowUpRight, CreditCard, Search, ChevronLeft, ChevronRight } from "lucide-react";

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
    const [globalFilter, setGlobalFilter] = useState("");
    const [typeFilter, setTypeFilter] = useState("ALL"); 
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    // 1. Zpracování a filtrace všech dat (bleskurychlé)
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

    // 2. Výpočet stránek pro zobrazení
    const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
    
    // Ošetření, pokud hledání zmenší počet stran
    const validCurrentPage = Math.min(currentPage, totalPages);
    
    // Oříznutí dat jen pro aktuální stránku
    const startIndex = (validCurrentPage - 1) * pageSize;
    const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

    // Handlery pro resetování stránky při hledání
    const handleSearchChange = (val: string) => {
        setGlobalFilter(val);
        setCurrentPage(1); // Při psaní se vždy vrátíme na stranu 1
    };

    const handleTypeChange = (val: string) => {
        setTypeFilter(val);
        setCurrentPage(1); // Při změně selectu taktéž na stranu 1
    };

    if (transactions.length === 0) {
        return <div className="py-8 text-muted-foreground text-center">Zatím nemáte žádné transakce.</div>;
    }

    return (
        <div className="space-y-4 w-full">
            
            {/* OVLÁDACÍ PANEL FILTRŮ */}
            <div className="flex sm:flex-row flex-col justify-between items-center gap-4 pb-2">
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

            {/* SAMOTNÁ TABULKA */}
            <div className="bg-card border rounded-md overflow-hidden">
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
                                const isCardPayment = (tx.description || "").startsWith('[KARTA]');
                                const cleanDescription = isCardPayment 
                                    ? tx.description.replace('[KARTA] ', '').replace('[KARTA]', '') 
                                    : (tx.description || "-");
                                
                                let targetAccount = 'Neznámý účet';
                                if (isOutgoing && tx.receiver) {
                                    targetAccount = Array.isArray(tx.receiver) ? tx.receiver[0]?.account_number : tx.receiver.account_number;
                                } else if (!isOutgoing && tx.sender) {
                                    targetAccount = Array.isArray(tx.sender) ? tx.sender[0]?.account_number : tx.sender.account_number;
                                }
                                if (isCardPayment && targetAccount !== 'Neznámý účet') {
                                    targetAccount = `Obchodník (ID: ${targetAccount})`;
                                }

                                const date = new Date(tx.created_at).toLocaleDateString("cs-CZ", {
                                    day: "2-digit", month: "2-digit", year: "numeric",
                                    hour: "2-digit", minute: "2-digit",
                                });

                                return (
                                    <TableRow key={tx.id} className="hover:bg-muted/30 transition-colors">
                                        {/* 1. Typ */}
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

                                        {/* 2. Protistrana */}
                                        <TableCell className="font-mono text-sm">
                                            {targetAccount || "Neznámý účet"}
                                        </TableCell>

                                        {/* 3. Datum */}
                                        <TableCell className="text-muted-foreground text-sm">
                                            {date}
                                        </TableCell>
                                        
                                        {/* 4. Popis */}
                                        <TableCell>{cleanDescription}</TableCell>
                                        
                                        {/* 5. Částka */}
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

            {/* STRÁNKOVÁNÍ NA MÍRU */}
            <div className="flex justify-between items-center px-2">
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
                        <ChevronLeft className="mr-1 w-4 h-4" /> Předchozí
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
                        Další <ChevronRight className="ml-1 w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
