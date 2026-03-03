import * as z from "zod";

export const loginSchema = z.object({
  email: z.email("Neplatný formát emailu."),
  password: z.string().min(1, "Heslo je povinné."),
});

export const signupSchema = z.object({
  firstName: z.string().min(2, "Jméno musí mít alespoň 2 znaky."),
  lastName: z.string().min(2, "Příjmení musí mít alespoň 2 znaky."),
  email: z.email("Neplatný formát emailu."),
  phone: z.string().min(9, "Neplatné telefonní číslo."),
  street: z.string().min(3, "Vyplňte název ulice a číslo."),
  city: z.string().min(2, "Vyplňte město."),
  zipCode: z.string().min(5, "PSČ musí mít 5 znaků."),
  password: z.string().min(8, "Heslo musí mít alespoň 8 znaků."),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Hesla se neshodují",
  path: ["confirmPassword"],
});