"use client";

import { useState } from "react";
import { changePassword } from "@/app/dashboard/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";

export function ChangePasswordForm() {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        const form = e.currentTarget;
        const currentPassword = (form.elements.namedItem("currentPassword") as HTMLInputElement).value;
        const newPassword = (form.elements.namedItem("newPassword") as HTMLInputElement).value;
        const confirmPassword = (form.elements.namedItem("confirmPassword") as HTMLInputElement).value;

        if (newPassword.length < 8) {
            setError("Nové heslo musí mít alespoň 8 znaků.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("Nové heslo a potvrzení se neshodují.");
            return;
        }

        setIsPending(true);
        const result = await changePassword(currentPassword, newPassword);
        setIsPending(false);

        if (result.error) {
            setError(result.error);
        } else {
            toast.success("Heslo bylo úspěšně změněno.");
            form.reset();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <label className="text-sm font-medium">Současné heslo</label>
                <div className="relative">
                    <Input
                        name="currentPassword"
                        type={showCurrent ? "text" : "password"}
                        required
                        autoComplete="current-password"
                        className="pr-10"
                    />
                    <button
                        type="button"
                        onClick={() => setShowCurrent((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                    >
                        {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Nové heslo</label>
                <div className="relative">
                    <Input
                        name="newPassword"
                        type={showNew ? "text" : "password"}
                        required
                        autoComplete="new-password"
                        className="pr-10"
                    />
                    <button
                        type="button"
                        onClick={() => setShowNew((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                    >
                        {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                </div>
                <p className="text-xs text-muted-foreground">Minimálně 8 znaků.</p>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Potvrzení nového hesla</label>
                <div className="relative">
                    <Input
                        name="confirmPassword"
                        type={showConfirm ? "text" : "password"}
                        required
                        autoComplete="new-password"
                        className="pr-10"
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                    >
                        {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                </div>
            </div>

            {error && (
                <p className="text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? (
                    <><Loader2 className="mr-2 size-4 animate-spin" /> Měním heslo...</>
                ) : (
                    "Změnit heslo"
                )}
            </Button>
        </form>
    );
}
