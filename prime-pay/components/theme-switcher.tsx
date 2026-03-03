"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { useEffect, useCallback } from "react";

interface ThemeToggleProps {
    className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
    const { resolvedTheme, setTheme } = useTheme();

    const isDark = resolvedTheme === "dark";

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (
                target.tagName === "INPUT" ||
                target.tagName === "TEXTAREA" ||
                target.isContentEditable
            ) {
                return;
            }

            if (e.shiftKey && e.key === "D") {
                setTheme(isDark ? "light" : "dark");
            }
        },
        [isDark, setTheme],
    );

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    return (
        <div
            className={cn(
                "flex bg-accent hover:bg-accent shadow-md backdrop-blur-lg p-1.5 border border-muted hover:border-muted-foreground/15 rounded-full w-16 h-8 transition-all duration-300 cursor-pointer",
                className,
            )}
            onClick={() => setTheme(isDark ? "light" : "dark")}
            role="button"
            aria-label="Toggle theme"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    setTheme(isDark ? "light" : "dark");
                }
            }}
            suppressHydrationWarning
        >
            {/* Kontejner s plynulou animací translate */}
            <div className="relative flex justify-between items-center w-full h-full">
                
                {/* Posuvná kolečka, která se pohybují ze strany na stranu */}
                <div
                    suppressHydrationWarning
                    className={cn(
                        "left-0 absolute flex justify-center items-center rounded-full w-5 h-5 transition-all duration-300",
                        isDark
                            ? "translate-x-0 bg-muted-foreground/15"
                            : "translate-x-8 bg-muted-foreground/15",
                    )}
                >
                    {/* Tmavý režim ikona (Měsíc) - plynule zmizí/objeví se */}
                    <Moon
                        suppressHydrationWarning
                        className={cn(
                            "absolute size-3.5 transition-opacity duration-300",
                            isDark ? "opacity-100 text-foreground" : "opacity-0 text-muted-foreground"
                        )}
                        strokeWidth={1.5}
                    />
                    
                    {/* Světlý režim ikona (Slunce) - plynule zmizí/objeví se */}
                    <Sun
                        suppressHydrationWarning
                        className={cn(
                            "absolute size-3.5 transition-opacity duration-300",
                            isDark ? "opacity-0 text-foreground" : "opacity-100 text-muted-foreground"
                        )}
                        strokeWidth={1.5}
                    />
                </div>

                {/* Sekundární prázdné posuvné místo (kvůli vizuálu a zarovnání) */}
                <div
                    suppressHydrationWarning
                    className={cn(
                        "left-8 absolute flex justify-center items-center rounded-full w-5 h-5 transition-all duration-300",
                        isDark ? "translate-x-0 bg-transparent" : "-translate-x-8 bg-transparent",
                    )}
                >
                    <Sun
                        suppressHydrationWarning
                        className={cn(
                            "absolute size-3.5 transition-opacity duration-300",
                            isDark ? "opacity-100 text-foreground" : "opacity-0"
                        )}
                        strokeWidth={1.5}
                    />
                    <Moon
                        suppressHydrationWarning
                        className={cn(
                            "absolute size-3.5 transition-opacity duration-300",
                            isDark ? "opacity-0" : "opacity-100 text-foreground"
                        )}
                        strokeWidth={1.5}
                    />
                </div>
            </div>
        </div>
    );
}
