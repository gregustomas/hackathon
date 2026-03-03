"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { toast } from "sonner";
import Image from "next/image";
export function EnrollMfaClient() {
    const [qrSvg, setQrSvg] = useState<string | null>(null); // Přejmenoval jsem z qrUrl na qrSvg
    const [factorId, setFactorId] = useState<string | null>(null);
    const [code, setCode] = useState("");
    const [isEnrolled, setIsEnrolled] = useState(false);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    useEffect(() => {
        supabase.auth.mfa.listFactors().then(({ data }) => {
            // Vrací true, i když je faktor "verified"
            if (
                data?.totp &&
                data.totp.length > 0 &&
                data.totp[0].status === "verified"
            ) {
                setIsEnrolled(true);
            }
        });
    }, [supabase]);

    const startEnrollment = async () => {
        // 1. Zrušení starých nepotvrzených pokusů
        const { data: factors } = await supabase.auth.mfa.listFactors();
        if (factors?.totp && factors.totp.length > 0) {
            for (const factor of factors.totp) {
                if (factor.status !== "verified") {
                    await supabase.auth.mfa.unenroll({ factorId: factor.id });
                }
            }
        }

        // 2. Vygenerování nového kódu
        const { data, error } = await supabase.auth.mfa.enroll({
            factorType: "totp",
            friendlyName: "PrimePay Authenticator",
        });

        if (error) {
            return toast.error(`Chyba generování MFA: ${error.message}`);
        }

        setFactorId(data.id);

        setQrSvg(data.totp.qr_code);
    };

    const verifyAndEnable = async () => {
        const { data: challengeData, error: challengeError } =
            await supabase.auth.mfa.challenge({ factorId: factorId! });
        if (challengeError) return toast.error("Chyba inicializace ověření");

        const { error: verifyError } = await supabase.auth.mfa.verify({
            factorId: factorId!,
            challengeId: challengeData.id,
            code,
        });

        if (verifyError) {
            toast.error("Špatný kód! Zkuste to znovu.");
        } else {
            toast.success("2FA úspěšně aktivováno!");
            setIsEnrolled(true);
            setQrSvg(null);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Dvoufázové ověření (2FA)</CardTitle>
                <CardDescription>
                    Zvyšte zabezpečení svého účtu pomocí Authenticatoru
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isEnrolled ? (
                    <div className="bg-green-50/10 p-4 border border-green-200 rounded-md font-medium text-green-600">
                        Vaše dvoufázové ověření je aktuálně aktivní. Vaše
                        prostředky jsou v bezpečí.
                    </div>
                ) : !qrSvg ? (
                    <Button onClick={startEnrollment}>
                        Vygenerovat QR kód
                    </Button>
                ) : (
                    <div className="space-y-4">
                        {" "}
                        <div className="flex justify-center bg-white shadow-md mx-auto p-4 rounded-lg w-fit">
                            <Image
                                width={48}
                                height={48}
                                src={qrSvg.trimEnd()}
                                alt="QR kód pro Google Authenticator"
                                className="size-48"
                            />
                        </div>
                        <p className="text-muted-foreground text-sm text-center">
                            Naskenujte QR kód v Google Authenticator a zadejte
                            6místný kód.
                        </p>
                        <div className="flex gap-2 mx-auto max-w-xs">
                            <Input
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="123456"
                                maxLength={6}
                            />
                            <Button onClick={verifyAndEnable}>Ověřit</Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
