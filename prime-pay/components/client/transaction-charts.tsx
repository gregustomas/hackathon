"use client";

import { useMemo } from "react";
import { Transaction } from "./history-table"; // Importuj si typ Transaction z tvé history-table
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, Pie, PieChart, Cell } from "recharts";

export function TransactionsCharts({ transactions, currentAccountId }: { transactions: Transaction[], currentAccountId: string }) {
    
    // Zpracování dat pro grafy
    const { monthlyData, pieData } = useMemo(() => {
        // Objekty pro agregaci
        const monthsMap: Record<string, { month: string, in: number, out: number }> = {};
        let totalCardPayments = 0;
        let totalTransfers = 0;

        // Projdeme všechny transakce
        transactions.forEach((tx) => {
            const isOutgoing = tx.from_account_id === currentAccountId;
            const amount = Number(tx.amount);
            
            // 1. Zpracování pro sloupcový graf (Příjmy/Výdaje po měsících)
            const date = new Date(tx.created_at);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const displayMonth = date.toLocaleDateString('cs-CZ', { month: 'short', year: 'numeric' });

            if (!monthsMap[monthKey]) {
                monthsMap[monthKey] = { month: displayMonth, in: 0, out: 0 };
            }

            if (isOutgoing) {
                monthsMap[monthKey].out += amount;
            } else {
                monthsMap[monthKey].in += amount;
            }

            // 2. Zpracování pro koláčový graf (Kategorie Výdajů)
            if (isOutgoing) {
                const isCardPayment = tx.description?.startsWith('[KARTA]');
                if (isCardPayment) {
                    totalCardPayments += amount;
                } else {
                    totalTransfers += amount;
                }
            }
        });

        // Převod z mapy do seřazeného pole pro grafy
        const sortedMonthlyData = Object.keys(monthsMap)
            .sort() // seřadit od nejstaršího
            .map(key => monthsMap[key])
            .slice(-6); // ukážeme max 6 posledních měsíců

        const pieDataArray = [
            { name: "Karetní platby", value: totalCardPayments, fill: "var(--chart-1)" },
            { name: "Převody na účet", value: totalTransfers, fill: "var(--chart-2)" }
        ].filter(item => item.value > 0); // Vykreslit jen ty, kde něco je

        return { monthlyData: sortedMonthlyData, pieData: pieDataArray };
    }, [transactions, currentAccountId]);

    // Konfigurace barev a labels pro Shadcn Chart
    const barChartConfig = {
        in: { label: "Příjmy", color: "var(--chart-2)" }, // zelená (shadcn chart-2 je typicky teal/green)
        out: { label: "Výdaje", color: "var(--destructive)" }, // červená
    };

    const pieChartConfig = {
        value: { label: "Suma" }
    };

    if (transactions.length === 0) return null;

    return (
        <div className="gap-6 grid grid-cols-1 lg:grid-cols-3 mb-8">
            
            {/* Sloupcový Graf: Příjmy a Výdaje */}
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Cashflow (poslední měsíce)</CardTitle>
                    <CardDescription>Srovnání vašich příjmů a výdajů</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={barChartConfig} className="w-full h-62.5">
                        <BarChart data={monthlyData} accessibilityLayer>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" className="hover:bg-muted/10 stroke-muted" />
                            <XAxis 
                                dataKey="month" 
                                tickLine={false} 
                                tickMargin={10} 
                                axisLine={false} 
                            />
                            <ChartTooltip content={<ChartTooltipContent formatter={(val) => `${Number(val).toLocaleString('cs-CZ')} Kč`} />} />
                            <ChartLegend content={<ChartLegendContent />} />
                            <Bar dataKey="in" fill="var(--color-in)" radius={[4, 4, 0, 0]} maxBarSize={50} />
                            <Bar dataKey="out" fill="var(--color-out)" radius={[4, 4, 0, 0]} maxBarSize={50} />
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>

            {/* Koláčový Graf: Struktura Výdajů */}
            <Card>
                <CardHeader>
                    <CardTitle>Struktura výdajů</CardTitle>
                    <CardDescription>Za celé období</CardDescription>
                </CardHeader>
                <CardContent>
                    {pieData.length === 0 ? (
                        <div className="flex justify-center items-center h-62.5 text-muted-foreground text-sm">
                            Zatím nemáte žádné výdaje.
                        </div>
                    ) : (
                        <ChartContainer config={pieChartConfig} className="w-full h-62.5">
                            <PieChart>
                                <ChartTooltip content={<ChartTooltipContent formatter={(val) => `${Number(val).toLocaleString('cs-CZ')} Kč`} />} />
                                <Pie 
                                    data={pieData} 
                                    dataKey="value" 
                                    nameKey="name" 
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={2}
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <ChartLegend content={<ChartLegendContent />} className="mt-4" />
                            </PieChart>
                        </ChartContainer>
                    )}
                </CardContent>
            </Card>

        </div>
    );
}
