"use client";

import { motion } from "framer-motion";
import { ShieldCheck, BarChart2, RefreshCw, Zap, Globe, Lock } from "lucide-react";

const smallFeatures = [
  { icon: ShieldCheck, label: "2FA Authentication" },
  { icon: BarChart2, label: "Spending analytics" },
  { icon: RefreshCw, label: "Auto-recurring payments" },
  { icon: Zap, label: "Instant notifications" },
  { icon: Globe, label: "Multi-currency support" },
  { icon: Lock, label: "Card freeze / unfreeze" },
];

export function MoreFeaturesCard() {
  return (
    <div className="bg-white border border-zinc-200 rounded-[2rem] col-span-1 md:col-span-4 p-6 md:p-10 flex flex-col justify-between gap-6">
      <div>
        <h3 className="text-xl md:text-2xl font-medium tracking-tight mb-2 text-zinc-950">And much more</h3>
        <p className="text-zinc-400 text-sm leading-relaxed">
          Every detail of a modern banking platform, thoughtfully built.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 md:gap-3">
        {smallFeatures.map((f, i) => (
          <motion.div
            key={f.label}
            initial={{ opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.3 }}
            transition={{ delay: i * 0.07 }}
            className="flex items-center gap-2 md:gap-2.5 bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5"
          >
            <f.icon size={13} className="text-zinc-500 shrink-0" />
            <span className="text-xs font-medium text-zinc-700 leading-tight">{f.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
