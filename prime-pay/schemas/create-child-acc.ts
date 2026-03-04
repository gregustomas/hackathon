import { z } from "zod";

export const createChildAccountSchema = z.object({
    firstName: z.string().min(2, "Jméno musí mít alespoň 2 znaky"),
    lastName: z.string().min(2, "Příjmení musí mít alespoň 2 znaky"),
    email: z.email("Neplatný e-mailový formát"),
    phone: z.string().optional(),
    
    street: z.string().min(3, "Vyplňte název ulice a číslo popisné"),
    city: z.string().min(2, "Zadejte název města"),
    zipCode: z.string().regex(/^\d{3}\s?\d{2}$/, "PSČ musí být ve formátu 123 45 nebo 12345"),
    country: z.string().min(2, "Zadejte stát"),
    
    // OPRAVA: Preprocess bezpečně konvertuje string z inputu na číslo,
    // pro Typescript to po zpracování striktně vrací `number`, ne `unknown` nebo `coerce`.
    dailyLimit: z.preprocess(
        (val) => Number(val), 
        z.number().min(0).max(5000, "Maximální počáteční limit je 5000 Kč")
    ),
    
    // ZÁPIS, KTERÝ TI FUNGOVAL:
    consent: z.literal(true, {
        error: "Musíte souhlasit se založením účtu"
    }),
});

export type CreateChildAccountFormValues = z.infer<typeof createChildAccountSchema>;
