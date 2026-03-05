// lib/cards/create-virtual-card.ts
import { randomInt } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

function genCardNumber(): string {
  const prefix = Math.random() > 0.5 ? "4" : "5";
  let rest = "";
  for (let i = 0; i < 15; i++) rest += String(randomInt(0, 10));
  return prefix + rest;
}

function genCvv(): string {
  return String(randomInt(0, 1000)).padStart(3, "0");
}

function genExpiryDate(): string {
  const today = new Date();
  const exp = new Date(today.getFullYear() + 3, today.getMonth(), 1);
  const mm = String(exp.getMonth() + 1).padStart(2, "0");
  const yy = String(exp.getFullYear()).slice(-2);
  return `${mm}/${yy}`;
}

export async function createVirtualCardForAccount(opts: {
  supabaseAdmin: SupabaseClient;
  accountId: string;
  cardName?: string;
  cardColor?: string;
  dailyLimit?: number;
  atmLimit?: number;
  pin?: string;
}) {
  const {
    supabaseAdmin,
    accountId,
    cardName = "Moje karta",
    cardColor = "slate",
    dailyLimit = 5000,
    atmLimit = 0,
    pin,
  } = opts;

  const payload = {
    account_id: accountId,
    card_number: genCardNumber(),
    expiry_date: genExpiryDate(),
    cvv: genCvv(),
    is_active: true,
    card_name: cardName,
    card_color: cardColor,
    daily_limit: dailyLimit,
    atm_limit: atmLimit,
    pin: pin ?? null,
  };

  const { error } = await supabaseAdmin.from("cards").insert([payload]);

  if (error) {
    console.error("Chyba při generování karty:", error);
    throw new Error("Nepodařilo se vygenerovat kartu: " + error.message);
  }
}
