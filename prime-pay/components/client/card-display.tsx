"use client";

import { useState, useTransition } from "react";
import { ShieldAlert, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  blockCard,
  requestCardUnblock,
  deleteCard,
} from "@/app/dashboard/cards/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CardProps {
  id: string;
  card_number: string;
  expiry_date: string;
  cvv: string;
  is_active: boolean;
  daily_limit: number;
}

interface CardDisplayProps {
  card: CardProps;
  profileId: string;
  accountId: string;
}

export function CardDisplay({ card, profileId, accountId }: CardDisplayProps) {
  const [isPending, startTransition] = useTransition();
  const [hasRequestedUnblock, setHasRequestedUnblock] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!card) return null;

  const formatCardNumber = (num?: string | null) => {
    if (!num || typeof num !== "string") return "**** **** **** ****";
    return num.match(/.{1,4}/g)?.join(" ") || num;
  };

  const maskedCard = `**** **** **** ${card.card_number.slice(-4)}`;

  const handleBlock = async () => {
    const result = await blockCard(card.id);
    if ((result as { error?: string }).error) {
      toast.error((result as { error?: string }).error);
    } else {
      toast.success("Karta byla úspěšně zablokována.");
    }
  };

  const handleDeleteConfirm = () => {
    startTransition(async () => {
      const result = await deleteCard(card.id);
      if ((result as { error?: string }).error) {
        toast.error((result as { error?: string }).error);
      } else {
        toast.success("Karta byla trvale odstraněna.");
      }
      setDeleteOpen(false);
    });
  };

  const handleUnblockRequest = () => {
    if (hasRequestedUnblock) return;

    startTransition(async () => {
      const result = await requestCardUnblock({
        profileId,
        accountId,
        cardId: card.id,
      });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      setHasRequestedUnblock(true);
      toast.success("Žádost o odblokování byla odeslána bankéřovi.");
    });
  };

  return (
    <>
      <div
        className={`relative p-6 rounded-xl shadow-lg border w-full max-w-90 overflow-hidden transition-opacity ${
          !card.is_active
            ? "opacity-70 grayscale"
            : "bg-linear-to-tr from-slate-900 to-slate-700 text-white"
        }`}
      >
        <div className="flex justify-between items-center mb-8">
          <div className="flex justify-center items-center bg-amber-200/80 opacity-80 border border-amber-400/50 rounded w-12 h-8">
            <div className="border border-amber-600/30 rounded-sm w-6 h-4" />
          </div>
          <div className="font-bold text-slate-300 italic">Prime Pay</div>
        </div>

        <div className="mb-4 font-mono text-xl tracking-widest">
          {formatCardNumber(card.card_number)}
        </div>

        <div className="flex justify-between font-mono text-slate-300 text-sm">
          <div>
            <span className="block mb-1 text-[10px] uppercase">Valid Thru</span>
            {card.expiry_date || "**/**"}
          </div>
          <div>
            <span className="block mb-1 text-[10px] uppercase">CVV</span>
            {card.cvv || "***"}
          </div>
        </div>

        {/* Ovládání pro aktivní kartu */}
        {card.is_active && (
          <div className="absolute inset-0 flex justify-center items-center gap-2 bg-black/60 opacity-0 hover:opacity-100 backdrop-blur-sm transition-opacity">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBlock}
              className="cursor-pointer"
              disabled={isPending}
            >
              <ShieldAlert className="mr-2 size-4" />
              Zablokovat
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteOpen(true)}
              className="bg-white/10 hover:bg-red-600 border-white/20 text-white cursor-pointer"
              disabled={isPending}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        )}

        {/* Overlay pro zablokovanou kartu */}
        {!card.is_active && (
          <div className="absolute inset-0 flex flex-col justify-center items-center space-y-3 bg-black/70 backdrop-blur-sm px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-red-600/90 px-3 py-1 rounded-full font-semibold text-xs uppercase tracking-wide">
              <ShieldAlert className="size-4" />
              <span>Zablokovaná karta</span>
            </div>
            <div className="flex flex-col items-center gap-2 w-full">
              <Button
                size="sm"
                variant="outline"
                onClick={handleUnblockRequest}
                disabled={isPending || hasRequestedUnblock}
                className="bg-white/10 hover:bg-white/20 border-white/30 min-w-55 text-white"
              >
                {isPending
                  ? "Odesílám žádost..."
                  : hasRequestedUnblock
                    ? "Žádost byla odeslána"
                    : "Odeslat žádost o odblokování"}
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDeleteOpen(true)}
                className="hover:bg-white/5 text-red-400 hover:text-red-300 text-xs"
                disabled={isPending}
              >
                <Trash2 className="mr-1 size-3" /> Odstranit kartu trvale
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Dialog pro trvalé odstranění */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Odstranit kartu trvale?</AlertDialogTitle>
            <AlertDialogDescription>
              Karta {maskedCard} bude nenávratně odstraněna. Nebude ji možné
              znovu použít ani obnovit. Chcete pokračovat?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Zrušit</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
              disabled={isPending}
            >
              {isPending && <ShieldAlert className="mr-2 size-4 animate-pulse" />}
              Ano, odstranit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
