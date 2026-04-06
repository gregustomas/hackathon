"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { createBrowserClient } from "@supabase/ssr";
import { PendingLoan } from "@/interfaces/banker"; // Tvůj exportovaný interface

export function LoanRequestForm({ 
    profileId, 
    accountId,
    currentBalance 
}: { 
    profileId: string; 
    accountId: string;
    currentBalance: number;
}) {
    const [amount, setAmount] = useState<number>(50000);
    const [months, setMonths] = useState<number>(24);
    const [firstPaymentDate, setFirstPaymentDate] = useState<string>("");
    const [purpose, setPurpose] = useState("");
    
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    
    const [activeLoan, setActiveLoan] = useState<Partial<PendingLoan> | null>(null);

    const ANNUAL_INTEREST_RATE = 3.9;

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        const fetchData = async () => {
            const nextMonth = new Date();
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            setFirstPaymentDate(nextMonth.toISOString().split('T')[0]);
        };
        fetchData();
    }, []);

    useEffect(() => {
        async function checkExistingLoan() {
            const { data } = await supabase
                .from("loans")
                .select("*")
                .eq("account_id", accountId)
                .in("status", ["PENDING", "APPROVED"])
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();
                
            if (data) {
                // Přetypujeme výsledek z DB na náš interface
                setActiveLoan(data as unknown as PendingLoan);
            }
        }
        checkExistingLoan();
    }, [accountId, supabase]);

    const calculateMonthlyPayment = () => {
        const principal = amount;
        const monthlyRate = (ANNUAL_INTEREST_RATE / 100) / 12;
        const totalMonths = months;
        const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / 
                   (Math.pow(1 + monthlyRate, totalMonths) - 1);
        return isNaN(emi) ? 0 : Math.round(emi);
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        if (currentBalance < 1000) {
            setMessage("Zamítnuto systémem: Váš zůstatek musí být alespoň 1 000 CZK.");
            setLoading(false); return;
        }

        const monthlyPayment = calculateMonthlyPayment();

        const { error } = await supabase.from("loans").insert({
            profile_id: profileId,
            account_id: accountId,
            amount: amount,
            purpose: purpose,
            status: "PENDING",
            months_to_pay: months,
            interest_rate: ANNUAL_INTEREST_RATE,
            monthly_payment: monthlyPayment,
            next_payment_date: firstPaymentDate,
            remaining_amount: amount 
        });

        if (error) {
            setMessage("Chyba: " + error.message);
        } else {
            setActiveLoan({ 
                status: "PENDING", 
                amount: amount, 
                monthly_payment: monthlyPayment, 
                next_payment_date: firstPaymentDate 
            });
        }
        setLoading(false);
    }

    if (activeLoan) {
        return (
            <div className="space-y-4 bg-foreground p-6 border rounded-xl">
                <div className="flex justify-between items-center pb-4 border-b">
                    <p className="text-muted-foreground text-sm">Stav žádosti</p>
                    {activeLoan.status === "PENDING" ? (
                        <span className="bg-orange-100 px-3 py-1 rounded-full font-bold text-orange-500 text-sm">Zpracovává se</span>
                    ) : (
                        <span className="bg-green-100 px-3 py-1 rounded-full font-bold text-green-600 text-sm">Aktivní úvěr</span>
                    )}
                </div>
                
                <div className="gap-4 grid grid-cols-2 pt-2">
                    <div>
                        <p className="text-muted text-xs">Celková částka</p>
                        <p className="font-bold text-background text-lg">{Number(activeLoan.amount).toLocaleString("cs-CZ")} Kč</p>
                    </div>
                    <div>
                        <p className="text-background text-xs">Měsíční splátka</p>
                        <p className="font-bold text-background text-lg">{Number(activeLoan.monthly_payment).toLocaleString("cs-CZ")} Kč</p> 
                    </div>
                    {activeLoan.status === "APPROVED" && activeLoan.next_payment_date && (
                        <div className="col-span-2 bg-foreground mt-2 p-3 border rounded-lg">
                            <p className="text-muted text-xs">Datum další splátky</p>
                            <p className="font-medium text-background">{new Date(activeLoan.next_payment_date).toLocaleDateString("cs-CZ")}</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    const currentEmi = calculateMonthlyPayment();
    const totalToPay = currentEmi * months;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <div className="flex justify-between items-end">
                    <Label>Částka půjčky</Label>
                    <span className="font-bold text-primary text-xl">{amount.toLocaleString("cs-CZ")} Kč</span>
                </div>
                <Slider 
                    min={5000} max={10000000} step={10000} 
                    value={[amount]} 
                    onValueChange={(val) => setAmount(val[0])} 
                />
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-end">
                    <Label>Doba splácení (měsíce)</Label>
                    <span className="font-medium">{months} měsíců</span>
                </div>
                <Slider 
                    min={6} max={300} step={12} 
                    value={[months]} 
                    onValueChange={(val) => setMonths(val[0])} 
                />
            </div>

            <div className="gap-4 grid grid-cols-2">
                <div className="space-y-2">
                    <Label>První splátka</Label>
                    <Input 
                        type="date" 
                        required 
                        value={firstPaymentDate} 
                        onChange={(e) => setFirstPaymentDate(e.target.value)} 
                        min={new Date().toISOString().split('T')[0]}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Účel</Label>
                    <Input 
                        required 
                        value={purpose} 
                        onChange={(e) => setPurpose(e.target.value)} 
                        placeholder="Nové auto..."
                    />
                </div>
            </div>

            <div className="flex justify-between items-center bg-muted p-4 rounded-lg">
                <div>
                    <p className="text-muted-foreground text-sm">Úrok (p.a.)</p>
                    <p className="font-medium">{ANNUAL_INTEREST_RATE}%</p>
                </div>
                <div className="text-right">
                    <p className="text-muted-foreground text-sm">Měsíční splátka</p>
                    <p className="font-bold text-primary text-2xl">{currentEmi.toLocaleString("cs-CZ")} Kč</p>
                    <p className="text-muted-foreground text-xs">Celkem zaplatíte: {totalToPay.toLocaleString("cs-CZ")} Kč</p>
                </div>
            </div>

            <Button type="submit" disabled={loading || currentBalance < 1000} className="w-full h-12 text-lg">
                {loading ? "Odesílám..." : "Podat žádost o půjčku"}
            </Button>
            
            {message && <p className={`text-sm text-center font-medium ${message.includes("Zamítnuto") ? "text-red-500" : "text-primary"}`}>{message}</p>}
        </form>
    );
}
