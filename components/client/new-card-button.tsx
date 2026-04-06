"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { CreateCardDialog } from "@/components/client/new-card-dialog";

export function NewCardButton({ accountId }: { accountId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} className="w-auto">
        <PlusCircle className="md:mr-2 size-4" />
        <span className="hidden md:inline-block">Vytvořit novou kartu</span>
      </Button>

      <CreateCardDialog
        accountId={accountId}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
