"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Banknote } from "lucide-react";

function LoanStatusDemo() {
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.4 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      className="w-full max-w-75 flex flex-col gap-3"
    >
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">Active loan</span>
          <span className="text-[10px] font-bold uppercase tracking-wider border border-zinc-200 rounded px-2 py-0.5 text-zinc-500">Approved</span>
        </div>
        <p className="text-2xl font-semibold tracking-tight text-zinc-950">5 000 CZK</p>

        <div>
          <div className="flex justify-between text-[11px] text-zinc-400 mb-1.5">
            <span>Repaid</span>
            <span>3 / 12 months</span>
          </div>
          <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={inView ? { width: "25%" } : {}}
              transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
              className="h-full bg-primary rounded-full"
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-zinc-100 pt-3">
          <div>
            <p className="text-[11px] text-zinc-400">Monthly payment</p>
            <p className="text-sm font-semibold text-zinc-950">217 CZK</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-zinc-400">Next due</p>
            <p className="text-sm font-semibold text-zinc-950">3. 5. 2026</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3">
        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
          <Banknote size={13} className="text-white" />
        </div>
        <p className="text-xs text-zinc-500">
          Approved by <span className="font-medium text-zinc-900">banker</span> in under 2 min
        </p>
      </div>
    </motion.div>
  );
}

export function LoansCard() {
  return (
    <div className="bg-zinc-50 border border-zinc-200 rounded-[2rem] col-span-1 md:col-span-4 flex flex-col min-h-95 overflow-hidden">
      <div className="flex-1 flex items-center justify-center px-10 pt-10">
        <LoanStatusDemo />
      </div>
      <div className="p-10">
        <h3 className="text-2xl font-medium tracking-tight mb-2 text-zinc-950">Loans & Credit</h3>
        <p className="text-zinc-400 text-sm leading-relaxed">
          Apply for a loan in minutes. Bankers review and approve requests — track your repayment progress in real-time.
        </p>
      </div>
    </div>
  );
}
