"use client";

import { useState } from "react";
import { login, signup } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// Hook Form + Zod
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { loginSchema, signupSchema } from "@/schemas/login-register";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import z from "zod";

// 1. ZOD SCHÉMATA PRO VALIDACI


export default function LoginPage() {
  const [isPending, setIsPending] = useState(false);

  // Inicializace formuláře pro PŘIHLÁŠENÍ
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  // Inicializace formuláře pro REGISTRACI
  const signupForm = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "", lastName: "", email: "", phone: "",
      street: "", city: "", zipCode: "", password: "", confirmPassword: ""
    },
  });

  // Handler pro Login
  async function onLoginSubmit(values: z.infer<typeof loginSchema>) {
    setIsPending(true);
    const formData = new FormData();
    formData.append('email', values.email);
    formData.append('password', values.password);

    const res = await login({ error: null }, formData);
    if (res?.error) toast.error(res.error);
    setIsPending(false);
  }

  // Handler pro Signup
  async function onSignupSubmit(values: z.infer<typeof signupSchema>) {
    setIsPending(true);
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => formData.append(key, value));

    const res = await signup({ error: null }, formData);
    if (res?.error) toast.error(res.error);
    setIsPending(false);
  }

  return (
    <div className="flex justify-center items-center bg-background p-4 py-12 min-h-screen">
      <Card className="shadow-lg border-0 w-full max-w-xl">
        <CardHeader className="text-center">
          <CardTitle className="font-bold text-foreground text-3xl tracking-tight">Prime Pay</CardTitle>
          <CardDescription className="text-muted-foreground">Moderní digitální bankovnictví</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid grid-cols-2 mb-6 w-full">
              <TabsTrigger value="login">Přihlášení</TabsTrigger>
              <TabsTrigger value="register">Založit účet</TabsTrigger>
            </TabsList>

            {/* ZÁLOŽKA: LOGIN */}
            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <FormField control={loginForm.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Emailová adresa</FormLabel><FormControl><Input placeholder="jan@novak.cz" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={loginForm.control} name="password" render={({ field }) => (
                    <FormItem><FormLabel>Heslo</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <Button type="submit" className="mt-4 w-full h-11" disabled={isPending}>
                    {isPending ? <Loader2 className="mr-2 w-4 h-4 animate-spin" /> : null}
                    Přihlásit se do bankovnictví
                  </Button>
                </form>
              </Form>
            </TabsContent>

            {/* ZÁLOŽKA: REGISTRACE */}
            <TabsContent value="register">
              <Form {...signupForm}>
                <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-4">
                  <div className="mb-2 pb-1 border-b font-medium text-muted-foreground text-sm">Osobní údaje</div>
                  <div className="gap-4 grid grid-cols-2">
                    <FormField control={signupForm.control} name="firstName" render={({ field }) => (
                      <FormItem><FormLabel>Jméno</FormLabel><FormControl><Input placeholder="Jan" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={signupForm.control} name="lastName" render={({ field }) => (
                      <FormItem><FormLabel>Příjmení</FormLabel><FormControl><Input placeholder="Novák" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  
                  <div className="gap-4 grid grid-cols-2">
                    <FormField control={signupForm.control} name="email" render={({ field }) => (
                      <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="jan@novak.cz" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={signupForm.control} name="phone" render={({ field }) => (
                      <FormItem><FormLabel>Telefon</FormLabel><FormControl><Input type="tel" placeholder="+420 123 456 789" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>

                  <div className="mt-6 mb-2 pb-1 border-b font-medium text-muted-foreground text-sm">Adresa trvalého bydliště</div>
                  <FormField control={signupForm.control} name="street" render={({ field }) => (
                    <FormItem><FormLabel>Ulice a číslo popisné</FormLabel><FormControl><Input placeholder="Václavské náměstí 1" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="gap-4 grid grid-cols-2">
                    <FormField control={signupForm.control} name="city" render={({ field }) => (
                      <FormItem><FormLabel>Město</FormLabel><FormControl><Input placeholder="Praha" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={signupForm.control} name="zipCode" render={({ field }) => (
                      <FormItem><FormLabel>PSČ</FormLabel><FormControl><Input placeholder="110 00" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>

                  <div className="mt-6 mb-2 pb-1 border-b font-medium text-muted-foreground text-sm">Zabezpečení účtu</div>
                  <div className="gap-4 grid grid-cols-2">
                    <FormField control={signupForm.control} name="password" render={({ field }) => (
                      <FormItem><FormLabel>Heslo</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={signupForm.control} name="confirmPassword" render={({ field }) => (
                      <FormItem><FormLabel>Potvrzení hesla</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>

                  <Button type="submit" className="mt-6 w-full h-11" disabled={isPending}>
                    {isPending ? <Loader2 className="mr-2 w-4 h-4 animate-spin" /> : null}
                    Otevřít účet zdarma
                  </Button>
                </form>
              </Form>
            </TabsContent>

          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}