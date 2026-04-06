"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { unenrollMyMfa } from "@/app/dashboard/settings/actions";
import { toast } from "sonner"; 

export function SelfMfaResetButton() {
    const [loading, setLoading] = useState(false);

    async function handleReset() {
        if (!confirm("Opravdu chcete vypnout 2FA zabezpečení?")) return;
        
        setLoading(true);
        const res = await unenrollMyMfa();
        
        if (res.success) {
            toast.success(res.message);
        } else {
            toast.error(res.message);
        }
        setLoading(false);
    }

    return (
        <Button 
            variant="destructive" 
            onClick={handleReset} 
            disabled={loading}
            className="w-full sm:w-auto"
        >
            {loading ? "Vypínám..." : "Vypnout 2FA"}
        </Button>
    );
}
