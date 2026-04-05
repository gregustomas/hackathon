"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { TrendingUp } from "lucide-react";

const weekBars = [
  { day: "Mo", h: 40 }, { day: "Tu", h: 65 }, { day: "We", h: 30 },
  { day: "Th", h: 80 }, { day: "Fr", h: 55 }, { day: "Sa", h: 20 }, { day: "Su", h: 45 },
];

export function SpendingOverviewCard() {
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.4 });

  return (
    <div ref={ref} className="bg-white border border-zinc-200 rounded-[2rem] col-span-1 md:col-span-3 p-10 flex flex-col justify-between min-h-95">
      <div className="flex flex-col gap-1">
        <p className="text-xs text-zinc-400 uppercase tracking-widest font-medium">This week</p>
        <p className="text-3xl font-semibold tracking-tight text-zinc-950">4 820 CZK</p>
        <p className="text-xs text-zinc-400 flex items-center gap-1">
          <TrendingUp size={12} className="text-zinc-400" /> +12% vs last week
        </p>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-2 h-24">
        {weekBars.map((b, i) => (
          <div key={b.day} className="flex-1 flex flex-col items-center gap-1.5">
            <div className="w-full flex items-end" style={{ height: 80 }}>
              <motion.div
                initial={{ height: 0 }}
                animate={inView ? { height: `${b.h}%` } : {}}
                transition={{ duration: 0.6, delay: i * 0.06, ease: "easeOut" }}
                className={`w-full rounded-md ${i === 3 ? "bg-primary" : "bg-zinc-200"}`}
              />
            </div>
            <span className={`text-[10px] font-medium ${i === 3 ? "text-zinc-950" : "text-zinc-400"}`}>{b.day}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-zinc-100 pt-6">
        <div>
          <p className="text-[11px] text-zinc-400">Transactions</p>
          <p className="text-sm font-semibold text-zinc-950">34 this week</p>
        </div>
        <div>
          <p className="text-[11px] text-zinc-400">Largest expense</p>
          <p className="text-sm font-semibold text-zinc-950">1 200 CZK</p>
        </div>
      </div>
    </div>
  );
}
