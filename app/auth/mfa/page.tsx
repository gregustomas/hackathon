"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { createBrowserClient } from '@supabase/ssr'

export default function MFAPage() {
    const [code, setCode] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isPending, setIsPending] = useState(false);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setIsPending(true);

        try {
            // 1. Zjistíme faktory (Z frontend klienta)
            const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
            
            if (factorsError || !factors || !factors.totp || factors.totp.length === 0) {
                throw new Error('Ověření není nastaveno.');
            }

            const verifiedFactor = factors.totp.find(f => f.status === 'verified');
            if (!verifiedFactor) {
                throw new Error('Nenalezen žádný aktivní faktor.');
            }

            // 2. Připravíme výzvu (Challenge)
            const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
                factorId: verifiedFactor.id,
            });

            if (challengeError) {
                throw new Error('Nepodařilo se komunikovat se serverem.');
            }

            // 3. Ověříme kód
            const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
                factorId: verifiedFactor.id,
                challengeId: challengeData.id,
                code
            });

            if (verifyError) {
                throw new Error('Neplatný kód!');
            }

            window.location.href = '/dashboard/client';

        } catch  {
            setError('Došlo k neznámé chybě.');
            setIsPending(false);
        }
    };

    return (
        <div className="flex justify-center items-center bg-slate-50 dark:bg-background p-4 min-h-screen">
            <Card className="shadow-lg border-0 w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="font-bold text-2xl tracking-tight">Zadejte kód</CardTitle>
                    <CardDescription>
                        Zadejte 6místný kód z vašeho Google Authenticatoru
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="bg-red-100/50 mb-4 p-3 border border-red-200 rounded-md text-red-600 text-sm text-center">
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                maxLength={6}
                                required
                                placeholder="000000"
                                className="h-14 font-mono text-2xl text-center tracking-widest"
                                autoFocus
                                autoComplete="one-time-code"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full h-12"
                            disabled={isPending || code.length !== 6}
                        >
                            {isPending ? (
                                <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                            ) : (
                                "Ověřit a pokračovat"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}