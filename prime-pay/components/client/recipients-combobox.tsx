"use client";

import { useState } from "react";
import { SavedRecipient } from "@/types/dashboard";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { BookUser, ChevronDown } from "lucide-react";

interface RecipientsComboboxProps {
  recipients: SavedRecipient[];
  onSelect: (accountNumber: string) => void;
}

export function RecipientsCombobox({ recipients, onSelect }: RecipientsComboboxProps) {
  const [search, setSearch] = useState("");

  if (recipients.length === 0) return null;

  const filtered = search.trim()
    ? recipients.filter(
        (r) =>
          r.label.toLowerCase().includes(search.toLowerCase()) ||
          r.account_number.includes(search)
      )
    : recipients;

  return (
    <DropdownMenu onOpenChange={(open) => { if (!open) setSearch(""); }}>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="w-full justify-between">
          <span className="flex items-center gap-2">
            <BookUser className="size-4 text-muted-foreground" />
            Vybrat z adresáře
          </span>
          <ChevronDown className="size-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72">
        <div className="px-2 py-1.5">
          <input
            autoFocus
            placeholder="Hledat příjemce..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-input bg-background focus-visible:ring-ring w-full rounded-md border px-2 py-1 text-sm outline-none focus-visible:ring-1"
          />
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-muted-foreground text-xs font-normal py-1">
          Uložení příjemci
        </DropdownMenuLabel>
        {filtered.length === 0 ? (
          <div className="px-2 py-3 text-center text-sm text-muted-foreground">
            Nic nenalezeno.
          </div>
        ) : (
          filtered.map((r) => (
            <DropdownMenuItem
              key={r.id}
              onSelect={() => onSelect(r.account_number)}
              className="flex flex-col items-start gap-0 cursor-pointer"
            >
              <span className="font-medium">{r.label}</span>
              <span className="text-xs text-muted-foreground font-mono">{r.account_number}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
