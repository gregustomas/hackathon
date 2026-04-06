"use client";

import { useState, useTransition } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { generateVirtualCard } from "@/app/dashboard/cards/actions";
import { CARD_COLORS, getCardGradient } from "@/lib/cards/card-colors";

interface Props {
  accountId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCardDialog({ accountId, open, onOpenChange }: Props) {
  const [isPending, startTransition] = useTransition(); 
  const [cardName, setCardName] = useState("Moje karta");
  const [selectedColor, setSelectedColor] = useState("slate");
  const [dailyLimit, setDailyLimit] = useState("5000");
  const [atmLimit, setAtmLimit] = useState("2000");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);

  const resetForm = () => {
    setCardName("Moje karta");
    setSelectedColor(CARD_COLORS[0].value);
    setDailyLimit("5000");
    setAtmLimit("2000");
    setPin("");
    setShowPin(false);
  };

  const handleClose = (val: boolean) => {
    if (!val) resetForm();
    onOpenChange(val);
  };

  const handleSubmit = () => {
    if (!/^\d{4}$/.test(pin)) {
      toast.error("PIN musí být přesně 4 číslice.");
      return;
    }
    const dl = parseFloat(dailyLimit);
    const al = parseFloat(atmLimit);
    if (isNaN(dl) || isNaN(al) || dl < 0 || al < 0) {
      toast.error("Zadej platné hodnoty limitů.");
      return;
    }

    startTransition(async () => {
      const result = await generateVirtualCard({
        accountId,
        cardName: cardName.trim() || "Moje karta",
        cardColor: selectedColor,
        dailyLimit: dl,
        atmLimit: al,
        pin,
      });

      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Karta byla úspěšně vytvořena!");
        handleClose(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Vytvořit virtuální kartu</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Náhled karty */}
          <div
            style={{ background: getCardGradient(selectedColor) }}
            className="flex flex-col justify-between shadow-lg p-5 rounded-2xl h-44 text-white select-none"
          >
            <div className="flex justify-between items-start">
              <span className="max-w-[70%] font-semibold text-sm truncate">
                {cardName || "Moje karta"}
              </span>
              <span className="opacity-60 text-xs uppercase tracking-wider">Virtual</span>
            </div>
            <div>
              <p className="font-mono text-lg tracking-[0.3em]">•••• •••• •••• ••••</p>
              <div className="flex justify-between opacity-60 mt-2 text-xs">
                <span>MM/YY</span>
                <span>CVV •••</span>
              </div>
            </div>
          </div>

          {/* Název karty */}
          <div className="space-y-1.5">
            <Label htmlFor="card-name">Název karty</Label>
            <Input
              id="card-name"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              placeholder="Moje karta"
              maxLength={30}
            />
          </div>

          {/* Výběr barvy */}
          <div className="space-y-1.5">
            <Label>Barva karty</Label>
            <div className="flex flex-wrap gap-2">
              {CARD_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  title={color.label}
                  onClick={() => setSelectedColor(color.value)}
                  style={{ background: color.style }}
                  className={`size-8 rounded-full ring-offset-background ring-offset-2 transition-transform ${
                    selectedColor === color.value
                      ? "ring-2 ring-primary scale-110"
                      : "hover:scale-105"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Limity */}
          <div className="gap-3 grid grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="daily-limit">Denní limit plateb (Kč)</Label>
              <Input
                id="daily-limit"
                type="number"
                min={0}
                max={1000000}
                value={dailyLimit}
                onChange={(e) => setDailyLimit(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="atm-limit">Limit ATM (Kč)</Label>
              <Input
                id="atm-limit"
                type="number"
                min={0}
                max={1000000}
                value={atmLimit}
                onChange={(e) => setAtmLimit(e.target.value)}
              />
            </div>
          </div>

          {/* PIN */}
          <div className="space-y-1.5">
            <Label htmlFor="pin">PIN kód (4 číslice)</Label>
            <div className="relative">
              <Input
                id="pin"
                type={showPin ? "text" : "password"}
                inputMode="numeric"
                value={pin}
                onChange={(e) =>
                  setPin(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                placeholder="••••"
                maxLength={4}
                className="pr-10 tracking-widest"
              />
              <button
                type="button"
                onClick={() => setShowPin((v) => !v)}
                className="top-1/2 right-3 absolute text-muted-foreground hover:text-foreground -translate-y-1/2"
              >
                {showPin ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={isPending}>
            Zrušit
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || pin.length !== 4}>
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Vytvořit kartu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}