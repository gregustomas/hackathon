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
    <div ref={ref} className="bg-card border border-border rounded-[2rem] col-span-1 md:col-span-3 p-6 md:p-10 flex flex-col justify-between gap-6 min-h-80 md:min-h-95">
      <div className="flex flex-col gap-1">
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">This week</p>
        <p className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">4 820 CZK</p>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <TrendingUp size={12} /> +12% vs last week
        </p>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-1.5 md:gap-2" style={{ height: 80 }}>
        {weekBars.map((b, i) => (
          <div key={b.day} className="flex-1 flex flex-col items-center gap-1.5">
            <div className="w-full flex items-end" style={{ height: 64 }}>
              <motion.div
                initial={{ height: 0 }}
                animate={inView ? { height: `${b.h}%` } : {}}
                transition={{ duration: 0.6, delay: i * 0.06, ease: "easeOut" }}
                className={`w-full rounded-md ${i === 3 ? "bg-zinc-900 dark:bg-zinc-100" : "bg-muted"}`}
              />
            </div>
            <span className={`text-[9px] md:text-[10px] font-medium ${i === 3 ? "text-foreground" : "text-muted-foreground"}`}>{b.day}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-border pt-4 md:pt-6">
        <div>
          <p className="text-[11px] text-muted-foreground">Transactions</p>
          <p className="text-sm font-semibold text-foreground">34 this week</p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">Largest expense</p>
          <p className="text-sm font-semibold text-foreground">1 200 CZK</p>
        </div>
      </div>
    </div>
  );
}
