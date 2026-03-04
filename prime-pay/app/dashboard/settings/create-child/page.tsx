/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createChildAccountSchema, CreateChildAccountFormValues } from "@/schemas/create-child-acc";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Check, Loader2, ShieldCheck, User, Home, Wallet } from "lucide-react";

import { createChildAccountAction } from "@/app/dashboard/settings/create-child/action";

export default function CreateChildAccountPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [successData, setSuccessData] = useState<{ email: string; pass: string } | null>(null);

    const form = useForm<CreateChildAccountFormValues>({
        resolver: zodResolver(createChildAccountSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            street: "",
            city: "",
            zipCode: "",
            country: "Česká republika",
            dailyLimit: 500,
            consent: undefined as any, 
        },
        mode: "onTouched",
    });

    const { register, trigger, handleSubmit, formState: { errors }, setValue, watch } = form;

    const handleNextStep = async () => {
        let fieldsToValidate: (keyof CreateChildAccountFormValues)[] = [];

        if (step === 1) fieldsToValidate = ["firstName", "lastName", "email", "phone"];
        if (step === 2) fieldsToValidate = ["street", "city", "zipCode", "country"];
        if (step === 3) fieldsToValidate = ["dailyLimit"];

        const isStepValid = await trigger(fieldsToValidate);

        if (isStepValid) {
            setStep((prev) => prev + 1);
        }
    };

    const handleBackStep = () => setStep((prev) => prev - 1);

    const onSubmit: SubmitHandler<CreateChildAccountFormValues> = async (data) => {
        setIsLoading(true);
        try {
            const formDataObj = new FormData();

            Object.entries(data).forEach(([key, value]) => {
                if (value !== undefined) {
                    formDataObj.append(key, String(value));
                }
            });

            const result = await createChildAccountAction(formDataObj);

            if (result.success) {
                setSuccessData({ email: result.email, pass: result.temporaryPassword });
                setStep(5);
            }
        } catch (error: any) {
            console.error(error);
            alert(error.message || "Došlo k chybě při zakládání účtu.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center py-12 cs-container">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <div className="flex justify-between items-center mb-2">
                        <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/settings")} type="button">
                            <ArrowLeft className="mr-2 size-4" /> Zpět
                        </Button>
                        {step < 5 && <span className="font-medium text-muted-foreground text-sm">Krok {step} ze 4</span>}
                    </div>
                    <CardTitle className="text-2xl">Založení dětského účtu</CardTitle>
                    <CardDescription>Kompletní bankovní registrace pro nezletilého člena rodiny.</CardDescription>
                </CardHeader>

                <CardContent>
                    <form id="child-account-form" onSubmit={handleSubmit(onSubmit)}>
                        
                        {/* KROK 1: ZÁKLADNÍ ÚDAJE */}
                        {step === 1 && (
                            <div className="space-y-4 animate-in fade-in">
                                <h3 className="flex items-center font-semibold text-lg"><User className="mr-2 size-5" /> Osobní údaje a kontakt</h3>
                                
                                <div className="gap-4 grid grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Jméno</Label>
                                        <Input {...register("firstName")} />
                                        {errors.firstName && <p className="text-destructive text-xs">{errors.firstName.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Příjmení</Label>
                                        <Input {...register("lastName")} />
                                        {errors.lastName && <p className="text-destructive text-xs">{errors.lastName.message}</p>}
                                    </div>
                                </div>
                                <div className="gap-4 grid grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>E-mail dítěte (Login)</Label>
                                        <Input type="email" {...register("email")} />
                                        {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Telefon</Label>
                                        <Input type="tel" {...register("phone")} />
                                        {errors.phone && <p className="text-destructive text-xs">{errors.phone.message}</p>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* KROK 2: ADRESA */}
                        {step === 2 && (
                            <div className="space-y-4 animate-in fade-in">
                                <h3 className="flex items-center font-semibold text-lg"><Home className="mr-2 size-5" /> Adresa bydliště</h3>
                                
                                <div className="space-y-2">
                                    <Label>Ulice a číslo popisné</Label>
                                    <Input {...register("street")} />
                                    {errors.street && <p className="text-destructive text-xs">{errors.street.message}</p>}
                                </div>
                                <div className="gap-4 grid grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Město</Label>
                                        <Input {...register("city")} />
                                        {errors.city && <p className="text-destructive text-xs">{errors.city.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>PSČ</Label>
                                        <Input {...register("zipCode")} />
                                        {errors.zipCode && <p className="text-destructive text-xs">{errors.zipCode.message}</p>}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Stát</Label>
                                    <Input {...register("country")} />
                                    {errors.country && <p className="text-destructive text-xs">{errors.country.message}</p>}
                                </div>
                            </div>
                        )}

                        {/* KROK 3: NASTAVENÍ ÚČTU */}
                        {step === 3 && (
                            <div className="space-y-4 animate-in fade-in">
                                <h3 className="flex items-center font-semibold text-lg"><Wallet className="mr-2 size-5" /> Parametry účtu</h3>
                                
                                <div className="space-y-2">
                                    <Label>Počáteční denní limit účtu (CZK)</Label>
                                    {/* Už bez valueAsNumber */}
                                    <Input type="number" {...register("dailyLimit")} />
                                    {errors.dailyLimit && <p className="text-destructive text-xs">{errors.dailyLimit.message}</p>}
                                    <p className="text-muted-foreground text-xs">Limit odchozích plateb. Lze kdykoliv později změnit v nastavení karet a účtů.</p>
                                </div>
                            </div>
                        )}

                        {/* KROK 4: PRÁVNÍ DOLOŽKA */}
                        {step === 4 && (
                            <div className="space-y-6 animate-in fade-in">
                                <h3 className="flex items-center font-semibold text-lg"><ShieldCheck className="mr-2 size-5" /> Právní doložka</h3>
                                <div className="bg-muted p-4 rounded-lg text-sm">
                                    Jako zákonný zástupce nesete plnou odpovědnost za tento dětský účet. Tento proces vytvoří plnohodnotný oddělený účet v českých korunách.
                                </div>
                                
                                <div className="flex items-start space-x-3 p-4 border rounded-md">
                                    <Checkbox 
                                        id="consent" 
                                        checked={watch("consent") === true}
                                        onCheckedChange={(c) => setValue("consent", c as true, { shouldValidate: true })} 
                                        className="mt-1" 
                                    />
                                    <div className="space-y-1 leading-none">
                                        <Label htmlFor="consent" className="leading-snug cursor-pointer">
                                            Prohlašuji, že jsem jedním z rodičů/zákonných zástupců, a souhlasím se založením podřízeného dětského účtu.
                                        </Label>
                                        {errors.consent && <p className="mt-1 text-destructive text-xs">{errors.consent.message}</p>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* KROK 5: HOTOVO */}
                        {step === 5 && successData && (
                            <div className="py-8 text-center animate-in zoom-in-95">
                                <div className="bg-green-100 mx-auto mb-4 p-3 rounded-full w-fit"><Check className="size-8 text-green-600" /></div>
                                <h3 className="mb-2 font-bold text-2xl">Účet úspěšně založen!</h3>
                                <p className="mb-6 text-muted-foreground">Účet byl provázán s vaším účtem.</p>
                                <div className="bg-muted mx-auto p-4 rounded-lg max-w-sm font-mono text-sm text-left">
                                    <p><strong>Login:</strong> {successData.email}</p>
                                    <p><strong>Heslo:</strong> {successData.pass}</p>
                                </div>
                            </div>
                        )}
                    </form>
                </CardContent>

                {step < 5 && (
                    <CardFooter className="flex justify-between pt-6 border-t">
                        <Button variant="outline" onClick={handleBackStep} disabled={step === 1 || isLoading} type="button">Předchozí</Button>
                        
                        {step < 4 ? (
                            <Button onClick={handleNextStep} type="button" disabled={isLoading}>Další krok <ArrowRight className="ml-2 size-4" /></Button>
                        ) : (
                            <Button type="submit" form="child-account-form" disabled={isLoading || watch("consent") !== true}>
                                {isLoading ? <><Loader2 className="mr-2 size-4 animate-spin" /> Vytvářím...</> : "Založit účet"}
                            </Button>
                        )}
                    </CardFooter>
                )}
                
                {step === 5 && (
                    <CardFooter className="justify-center pt-6 border-t">
                        <Button onClick={() => router.push("/dashboard/settings")} type="button">Zpět na nastavení rodiny</Button>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}
