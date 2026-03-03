"use client";

import { useActionState } from "react";
import { verifyMfa } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MFAPage() {
    const [state, action, isPending] = useActionState(verifyMfa, {
        error: null,
    });

    return (
        <div className="flex justify-center items-center bg-slate-50 min-h-screen">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Dvoufázové ověření</CardTitle>
                </CardHeader>
                <CardContent>
                    {state?.error && (
                        <p className="mb-4 text-red-500 text-sm">
                            {state.error}
                        </p>
                    )}
                    <form action={action} className="space-y-4">
                        <div className="space-y-2">
                            <label>Zadejte 6místný kód z aplikace</label>
                            <Input
                                name="code"
                                maxLength={6}
                                required
                                placeholder="123456"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isPending}
                        >
                            {isPending ? "Ověřuji..." : "Ověřit"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
