"use client";

import { motion, AnimatePresence, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Send, CheckCircle } from "lucide-react";

function InstantTransferDemo() {
  const [sent, setSent] = useState(false);
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
      {/* Recipient */}
      <div className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3">
        <div className="w-9 h-9 rounded-full bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900 text-sm font-bold shrink-0">P</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">Pavel Kratochvíl</p>
          <p className="text-[11px] text-muted-foreground font-mono">9004·5318·0001</p>
        </div>
        <CheckCircle size={14} className="text-muted-foreground/50 shrink-0" />
      </div>

      {/* Amount */}
      <div className="bg-card border border-border rounded-2xl px-4 py-4 flex items-center justify-between">
        <span className="text-3xl font-semibold tracking-tight text-foreground">1 200</span>
        <span className="text-sm font-medium text-muted-foreground">CZK</span>
      </div>

      {/* Send button */}
      <AnimatePresence mode="wait">
        {!sent ? (
          <motion.button
            key="send"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setSent(true)}
            className="w-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-semibold py-3 rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Send size={14} /> Send now
          </motion.button>
        ) : (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.93 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full flex items-center justify-center gap-2 bg-muted/50 border border-border text-muted-foreground text-sm font-medium py-3 rounded-2xl"
          >
            <CheckCircle size={14} /> Sent successfully
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function InstantTransfersCard() {
  return (
    <div className="bg-card border border-border rounded-[2rem] col-span-1 md:col-span-4 flex flex-col min-h-80 md:min-h-95 overflow-hidden">
      <div className="flex-1 flex items-center justify-center px-6 md:px-10 pt-6 md:pt-10">
        <InstantTransferDemo />
      </div>
      <div className="p-6 md:p-10">
        <h3 className="text-xl md:text-2xl font-medium tracking-tight mb-2 text-foreground">Instant Transfers</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Send money to anyone instantly. Save recipients to your address book for one-tap payments.
        </p>
      </div>
    </div>
  );
}
