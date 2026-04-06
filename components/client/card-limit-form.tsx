"use client";

import { useState, useTransition } from "react";
import { updateCardLimits } from "@/app/dashboard/cards/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, CreditCard, Save, Landmark, ShoppingBag } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface CardLimitFormProps {
  cardId: string;
  cardNumber: string;
  currentPaymentLimit: number;
  currentAtmLimit: number;
}

export function CardLimitForm({
  cardId,
  cardNumber,
  currentPaymentLimit,
  currentAtmLimit,
}: CardLimitFormProps) {
  const [paymentLimit, setPaymentLimit] = useState<number>(currentPaymentLimit || 5000);
  const [atmLimit, setAtmLimit] = useState<number>(currentAtmLimit || 2000);
  const [isPending, startTransition] = useTransition();

  const maskedCard = `**** **** **** ${cardNumber.slice(-4)}`;

  const hasChanges =
    paymentLimit !== currentPaymentLimit || atmLimit !== currentAtmLimit;

  const handleSave = () => {
    const optimisticPayment = paymentLimit;
    const optimisticAtm = atmLimit;

    startTransition(async () => {
      const result = await updateCardLimits(cardId, optimisticPayment, optimisticAtm);

      if (result.error) {
        // revert na původní hodnoty, pokud nechceš nechat optimistic
        setPaymentLimit(currentPaymentLimit);
        setAtmLimit(currentAtmLimit);
        toast.error(result.error);
      } else {
        toast.success(
          `Limity pro kartu ${maskedCard} byly úspěšně aktualizovány.`,
        );
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 bg-card/50 shadow-sm hover:shadow-md p-5 border rounded-xl transition-all">
      {/* Hlavička karty */}
      <div className="flex items-center gap-3 pb-4 border-b">
        <div className="bg-primary/10 p-2 rounded-lg text-primary">
          <CreditCard className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-semibold text-base">Karta {maskedCard}</h4>
          <p className="text-muted-foreground text-xs">Správa denních limitů</p>
        </div>
      </div>

      {/* Limit pro platby */}
      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-muted-foreground" />
            <label className="font-medium text-sm">
              Platby v obchodech a na internetu
            </label>
          </div>
          <div className="relative w-28">
            <Input
              type="number"
              min={0}
              max={100000}
              step={1000}
              value={paymentLimit}
              onChange={(e) => setPaymentLimit(Number(e.target.value))}
              className="pr-10 h-8 font-mono text-right"
              disabled={isPending}
            />
            <span className="top-1/2 right-3 absolute text-muted-foreground text-xs -translate-y-1/2 pointer-events-none">
              CZK
            </span>
          </div>
        </div>
        <Slider
          value={[paymentLimit]}
          max={100000}
          step={1000}
          onValueChange={(vals) => setPaymentLimit(vals[0])}
          className="py-2"
          disabled={isPending}
        />
      </div>

      {/* Limit pro výběry */}
      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <div className="flex items-center gap-2">
            <Landmark className="w-4 h-4 text-muted-foreground" />
            <label className="font-medium text-sm">Výběry z bankomatů (ATM)</label>
          </div>
          <div className="relative w-28">
            <Input
              type="number"
              min={0}
              max={50000}
              step={1000}
              value={atmLimit}
              onChange={(e) => setAtmLimit(Number(e.target.value))}
              className="pr-10 h-8 font-mono text-right"
              disabled={isPending}
            />
            <span className="top-1/2 right-3 absolute text-muted-foreground text-xs -translate-y-1/2 pointer-events-none">
              CZK
            </span>
          </div>
        </div>
        <Slider
          value={[atmLimit]}
          max={50000}
          step={1000}
          onValueChange={(vals) => setAtmLimit(vals[0])}
          className="py-2"
          disabled={isPending}
        />
      </div>

      {/* Uložit */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={handleSave}
          disabled={isPending || !hasChanges}
          className="w-full sm:w-auto"
        >
          {isPending ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Save className="mr-2 size-4" />
          )}
          {isPending ? "Ukládám..." : "Uložit změny limitů"}
        </Button>
      </div>
    </div>
  );
}
