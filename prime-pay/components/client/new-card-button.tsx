"use client";

import {  useTransition } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { generateVirtualCard } from "@/app/dashboard/cards/actions";

export function NewCardButton({ accountId }: { accountId: string }) {
    const [isPending, startTransition] = useTransition();

    const handleGenerate = () => {
        startTransition(async () => {
            const result = await generateVirtualCard(accountId);
            
            if (result?.error) {
                toast.error(result.error);
            } else {
                toast.success("Nová virtuální karta byla úspěšně vytvořena!");
            }
        });
    };

    return (
        <Button 
            onClick={handleGenerate} 
            disabled={isPending}
            className="w-auto"
        >
            {isPending ? (
                <Loader2 className="md:mr-2 size-4 animate-spin" />
            ) : (
                <PlusCircle className="md:mr-2 size-4" />
            )}
            <span className="hidden md:inline-block">Vytvořit novou kartu</span>
        </Button>
    );
}
