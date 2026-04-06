"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const rates = [
  { pair: "EUR/CZK", value: "25.14", change: "+0.08", up: true },
  { pair: "USD/CZK", value: "23.41", change: "+0.21", up: true },
  { pair: "GBP/CZK", value: "29.87", change: "−0.13", up: false },
  { pair: "CHF/CZK", value: "26.02", change: "+0.04", up: true },
];

function RatesList() {
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.4 });

  return (
    <div ref={ref} className="flex flex-col gap-2 w-full">
      {rates.map((r, i) => (
        <motion.div
          key={r.pair}
          initial={{ opacity: 0, x: -8 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: i * 0.08 }}
          className="flex items-center justify-between px-4 py-3 bg-white/5 border border-white/10 rounded-2xl"
        >
          <span className="text-sm font-medium text-white/80 font-mono">{r.pair}</span>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-medium ${r.up ? "text-white/60" : "text-white/30"}`}>{r.change}</span>
            <span className="text-sm font-semibold text-white tabular-nums">{r.value}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function ExchangeRatesCard() {
  return (
    <div className="bg-primary rounded-[2rem] col-span-1 md:col-span-4 p-6 md:p-10 flex flex-col gap-6 md:gap-8">
      <div>
        <h3 className="text-xl md:text-2xl font-medium tracking-tight mb-2 text-white">Live Exchange Rates</h3>
        <p className="text-white/40 text-sm leading-relaxed">
          Real-time currency rates updated throughout the day. Convert before you send.
        </p>
      </div>
      <RatesList />
    </div>
  );
}
