"use client";

import { useActionState, useEffect } from "react";
import { login, signup, type ActionState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const initialState: ActionState = { error: null };

export default function LoginPage() {
    const [loginState, loginAction, isLoginPending] = useActionState(
        login,
        initialState,
    );
    const [signupState, signupAction, isSignupPending] = useActionState(
        signup,
        initialState,
    );

    useEffect(() => {
        if (loginState.error) {
            toast.error("Chyba přihlášení", {
                description: loginState.error,
            });
        }
    }, [loginState.error]);

    useEffect(() => {
        if (signupState.error) {
            toast.error("Chyba registrace", {
                description: signupState.error,
            });
        }
    }, [signupState.error]);

    return (
        <div className="flex justify-center items-center bg-background p-4 min-h-screen">
            <Card className="shadow-lg border-0 w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="font-bold text-foreground text-3xl tracking-tight">
                        NexoPay
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Moderní digitální bankovnictví
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="login" className="w-full">
                        <TabsList className="grid grid-cols-2 mb-6 w-full">
                            <TabsTrigger value="login">Přihlášení</TabsTrigger>
                            <TabsTrigger value="register">
                                Registrace
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="login">
                            <form action={loginAction} className="space-y-4">
                                <div className="space-y-2">
                                    <label
                                        htmlFor="login-email"
                                        className="font-medium text-muted-foreground text-sm"
                                    >
                                        Email
                                    </label>
                                    <Input
                                        id="login-email"
                                        name="email"
                                        type="email"
                                        required
                                        placeholder="jan@novak.cz"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label
                                        htmlFor="login-password"
                                        className="font-medium text-muted-foreground text-sm"
                                    >
                                        Heslo
                                    </label>
                                    <Input
                                        id="login-password"
                                        name="password"
                                        type="password"
                                        required
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    className="mt-2 w-full"
                                    disabled={isLoginPending}
                                >
                                    {isLoginPending
                                        ? "Přihlašuji..."
                                        : "Přihlásit se"}
                                </Button>
                            </form>
                        </TabsContent>

                        <TabsContent value="register">
                            <form action={signupAction} className="space-y-4">
                                <div className="gap-4 grid grid-cols-2">
                                    <div className="space-y-2">
                                        <label
                                            htmlFor="firstName"
                                            className="font-medium text-muted-foreground text-sm"
                                        >
                                            Jméno
                                        </label>
                                        <Input
                                            id="firstName"
                                            name="firstName"
                                            required
                                            placeholder="Jan"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label
                                            htmlFor="lastName"
                                            className="font-medium text-muted-foreground text-sm"
                                        >
                                            Příjmení
                                        </label>
                                        <Input
                                            id="lastName"
                                            name="lastName"
                                            required
                                            placeholder="Novák"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label
                                        htmlFor="reg-email"
                                        className="font-medium text-muted-foreground text-sm"
                                    >
                                        Email
                                    </label>
                                    <Input
                                        id="reg-email"
                                        name="email"
                                        type="email"
                                        required
                                        placeholder="jan@novak.cz"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label
                                        htmlFor="reg-password"
                                        className="font-medium text-muted-foreground text-sm"
                                    >
                                        Heslo
                                    </label>
                                    <Input
                                        id="reg-password"
                                        name="password"
                                        type="password"
                                        required
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    className="mt-2 w-full"
                                    disabled={isSignupPending}
                                >
                                    {isSignupPending
                                        ? "Vytvářím účet..."
                                        : "Vytvořit účet"}
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
