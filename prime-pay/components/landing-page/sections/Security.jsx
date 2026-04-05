"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Lock, Smartphone, Database, CheckCircle2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const securityFeatures = [
  {
    title: "Two-Factor Authentication",
    desc: "An extra layer of security ensuring that only you can access your account, even if someone knows your password.",
    icon: <Smartphone className="w-5 h-5" />,
    className: "md:col-span-4",
  },
  {
    title: "Supabase Protection",
    desc: "Leveraging enterprise-grade PostgreSQL security and Row Level Security (RLS) to keep your data isolated.",
    icon: <Database className="w-5 h-5" />,
    className: "md:col-span-4",
  },
  {
    title: "Zod Data Validation",
    desc: "Strict schema validation on every request to prevent malicious data injection and ensure system integrity.",
    icon: <Search className="w-5 h-5" />,
    className: "md:col-span-3",
  },
  {
    title: "End-to-End Encryption",
    desc: "Sensitive information is encrypted using industry-standard protocols.",
    icon: <Lock className="w-5 h-5" />,
    className: "md:col-span-5",
  },
];

export default function SecuritySection() {
  return (
    <section className="py-24 px-6 max-w-7xl mx-auto border-t border-border/50">
      {/* --- HEADER --- */}
      <div className="flex flex-col gap-5 mb-16 max-w-3xl">
        <Badge variant="outline" className="w-fit rounded-md px-3 py-1 font-medium border-primary/20 text-primary">
          Security Architecture
        </Badge>
        <h2 className="text-6xl font-normal tracking-tighter text-zinc-950 dark:text-white leading-[1.05]">
          Bank-grade safety <br />
          <span className="text-zinc-500 font-light">for your peace of mind.</span>
        </h2>
        <p className="text-xl text-muted-foreground font-light leading-relaxed mt-2">
          We use a multi-layered security stack including **Supabase** infrastructure 
          and **Zod** validation to ensure your financial data remains uncompromised.
        </p>
      </div>

      {/* --- BENTO GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-8 gap-4">
        {securityFeatures.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
            className={`
              group relative overflow-hidden rounded-xl border border-border bg-white p-8 
              dark:bg-zinc-950 dark:border-zinc-800 transition-all duration-300 hover:border-primary/30
              ${item.className}
            `}
          >
            {/* Ikona - menší a decentnější */}
            <div className="mb-5 inline-flex p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-primary border border-border">
              {item.icon}
            </div>

            <h3 className="text-2xl font-medium mb-3 tracking-tight text-zinc-950 dark:text-white">
              {item.title}
            </h3>
            <p className="text-muted-foreground font-light leading-relaxed">
              {item.desc}
            </p>

            {/* Velmi jemný gradient v rohu pro hloubku */}
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        ))}
      </div>

      {/* --- TRUST FOOTNOTE --- */}
      <div className="mt-12 flex flex-wrap items-center gap-x-10 gap-y-4 pt-8 border-t border-border/50">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-400">
          <CheckCircle2 className="w-4 h-4 text-primary" />
          PCI DSS Compliant
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-400">
          <CheckCircle2 className="w-4 h-4 text-primary" />
          GDPR Ready
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-400">
          <CheckCircle2 className="w-4 h-4 text-primary" />
          AES-256 Encryption
        </div>
      </div>
    </section>
  );
}