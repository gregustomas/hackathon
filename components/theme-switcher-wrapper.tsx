"use client"; // Důležité!

import dynamic from "next/dynamic";

// Tady to definujeme - uvnitř "use client" souboru to Next.js dovolí
const ThemeToggleNoSSR = dynamic(
    () => import("@/components/theme-switcher").then((mod) => mod.ThemeToggle),
    {
        ssr: false,
        loading: () => (
            <div className="bg-muted/20 border border-muted rounded-full w-16 h-8" />
        ),
    },
);

export function ThemeToggleWrapper() {
    return <ThemeToggleNoSSR />;
}
