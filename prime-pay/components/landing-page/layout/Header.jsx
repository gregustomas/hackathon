"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { WalletCards } from "lucide-react";

const links = [
  { label: "Features", href: "#features" },
  { label: "Roles", href: "#roles" },
  { label: "Security", href: "#security" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 px-0 py-0">
      <motion.div
        animate={{
          backgroundColor: scrolled ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0)",
          borderColor: scrolled ? "rgba(0,0,0,0.08)" : "rgba(0,0,0,0)",
          backdropFilter: scrolled ? "blur(16px)" : "blur(0px)",
        }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="flex items-center justify-between px-6 py-4 border-b"
      >
        {/* Logo */}
        <a href="#" className="flex items-center gap-2.5 group">
          <WalletCards/>
          <span className="text-sm font-medium tracking-tight">PrimePay</span>
        </a>

        {/* Nav */}
        <nav>
          <ul className="flex items-center gap-8">
            {links.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="text-sm hover:text-foreground transition-colors duration-150 font-normal"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* CTA */}
        <a
          href="/dashboard"
          className="text-sm font-medium bg-foreground text-background px-5 py-2 rounded-lg hover:opacity-90 transition-opacity"
        >
          Start Now
        </a>
      </motion.div>
    </header>
  );
}
