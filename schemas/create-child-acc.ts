import { z } from "zod";

export const createChildAccountSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  street: z.string().min(1),
  city: z.string().min(1),
  zipCode: z.string().min(1),
  country: z.string().min(1),
  dailyLimit: z
      .string()
      .min(1, "Zadejte denní limit."),
  consent: z
    .boolean()
    .refine((value) => value === true, {
      message: "Musíte souhlasit s právní doložkou.",
  }),
});

export type CreateChildAccountFormValues = z.infer<typeof createChildAccountSchema>;