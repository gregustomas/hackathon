"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WalletCards, Menu, X } from "lucide-react";

const links = [
  { label: "Features", href: "#features" },
  { label: "Roles", href: "#roles" },
  { label: "Security", href: "#security" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50">
      <motion.div
        animate={{
          backgroundColor: scrolled || mobileOpen ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0)",
          borderColor: scrolled || mobileOpen ? "rgba(0,0,0,0.08)" : "rgba(0,0,0,0)",
          backdropFilter: scrolled || mobileOpen ? "blur(16px)" : "blur(0px)",
        }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="border-b"
      >
        {/* Main row */}
        <div className="flex items-center justify-between px-4 md:px-6 py-4">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5">
            <WalletCards size={20} />
            <span className="text-sm font-medium tracking-tight">PrimePay</span>
          </a>

          {/* Nav — desktop */}
          <nav className="hidden md:block">
            <ul className="flex items-center gap-8">
              {links.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm hover:text-foreground transition-colors duration-150 font-normal">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-3">
            {/* CTA */}
            <a
              href="/dashboard"
              className="text-sm font-medium bg-foreground text-background px-4 md:px-5 py-2 rounded-lg hover:opacity-90 transition-opacity"
            >
              Start Now
            </a>

            {/* Hamburger — mobile */}
            <button
              className="md:hidden p-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden md:hidden"
            >
              <ul className="flex flex-col px-4 pb-4 gap-1">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="block text-sm font-medium py-2.5 px-3 rounded-lg hover:bg-zinc-100 transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.nav>
          )}
        </AnimatePresence>
      </motion.div>
    </header>
  );
}
