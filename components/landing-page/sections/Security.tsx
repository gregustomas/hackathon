"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  ShieldCheck,
  KeyRound,
  MonitorSmartphone,
  LockKeyhole,
  CreditCard,
  Database,
  LogOut,
} from "lucide-react";

const layers = [
  { icon: ShieldCheck, label: "Two-Factor Authentication", tag: "TOTP / MFA" },
  { icon: KeyRound, label: "Password Management", tag: "Auth" },
  { icon: LogOut, label: "Automatic Session Logout", tag: "Inactivity" },
  { icon: MonitorSmartphone, label: "Session & Device Control", tag: "Sessions" },
  { icon: LockKeyhole, label: "Role-Based Access Control", tag: "Middleware" },
  { icon: CreditCard, label: "Card Security Controls", tag: "Cards" },
  { icon: Database, label: "Row Level Security", tag: "Supabase RLS" },
];

export default function Security() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });

  return (
    <section className="py-16 md:py-24 max-w-7xl mx-auto px-4 md:px-6">
      <div className="grid grid-cols-1 md:grid-cols-8 gap-3 md:gap-4">

        {/* Left — header */}
        <div className="md:col-span-3 bg-zinc-900 rounded-[2rem] p-6 md:p-10 flex flex-col justify-between gap-6 min-h-48 md:min-h-72">
          <div className="flex flex-col gap-3">
            <p className="text-sm text-white/40 uppercase tracking-widest font-medium">Security</p>
            <h2 className="text-3xl md:text-4xl font-normal tracking-tighter leading-tight text-white">
              Built secure <br />
              <span className="text-white/30">from day one.</span>
            </h2>
          </div>
          <p className="text-sm text-white/40 leading-relaxed">
            Every layer of PrimePay — from the database up to the browser — is protected by industry-standard security practices.
          </p>
        </div>

        {/* Right — list */}
        <div ref={ref} className="md:col-span-5 bg-card border border-border rounded-[2rem] p-6 md:p-10 flex flex-col justify-center">
          {layers.map((layer, i) => (
            <motion.div
              key={layer.label}
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.06, duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="group flex items-center gap-4 py-3.5 border-b border-border last:border-0"
            >
              <div className="w-8 h-8 rounded-xl bg-muted border border-border flex items-center justify-center shrink-0 group-hover:bg-zinc-900 group-hover:border-zinc-900 transition-colors duration-200">
                <layer.icon size={14} className="text-muted-foreground group-hover:text-white transition-colors duration-200" />
              </div>
              <p className="text-sm font-medium text-foreground flex-1">{layer.label}</p>
              <span className="font-mono text-[10px] text-muted-foreground hidden sm:block">
                {layer.tag}
              </span>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
