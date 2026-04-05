"use client";

import { motion, AnimatePresence, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Clock, Users, CheckCircle } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 14 } },
};

const spentPct = 64;

function FamilyApprovalDemo() {
  const [approved, setApproved] = useState(false);
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.4 });

  return (
    <motion.div
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className="flex flex-col gap-3 w-full max-w-[320px]"
    >
      {/* Parent */}
      <motion.div variants={itemVariants} className="flex items-center gap-3 bg-white border border-zinc-200 rounded-2xl px-4 py-3">
        <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0">
          <Users size={14} className="text-zinc-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-zinc-900">Jan Novák</p>
          <p className="text-[11px] text-zinc-400">Parent · Account Manager</p>
        </div>
        <span className="text-[9px] font-bold uppercase tracking-widest border border-zinc-300 rounded px-1.5 py-0.5 text-zinc-500">
          Admin
        </span>
      </motion.div>

      {/* Pending approval */}
      <motion.div variants={itemVariants} className="bg-primary rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400 uppercase tracking-tight">
            <Clock size={11} /> Pending
          </span>
          <span className="text-lg font-semibold tracking-tight text-white">350 CZK</span>
        </div>
        <p className="text-xs text-zinc-500 mb-4">
          Emma requested to purchase at <span className="font-medium text-zinc-300">MALL.cz</span>
        </p>

        <AnimatePresence mode="wait">
          {!approved ? (
            <motion.button
              key="btn"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setApproved(true)}
              className="w-full bg-white text-zinc-950 text-xs font-semibold py-2.5 rounded-xl hover:bg-zinc-100 transition-colors"
            >
              Confirm Transaction
            </motion.button>
          ) : (
            <motion.div
              key="ok"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full flex items-center justify-center gap-2 bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-medium py-2.5 rounded-xl"
            >
              <CheckCircle size={13} /> Payment Approved
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Child card — detailed */}
      <motion.div variants={itemVariants} className="bg-white border border-zinc-200 rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center shrink-0 text-xs font-bold text-zinc-600">E</div>
          <div className="flex-1">
            <p className="text-sm font-medium text-zinc-900">Emma Nováková</p>
            <p className="text-[11px] text-zinc-400">Child account</p>
          </div>
          <span className="text-[9px] font-bold uppercase tracking-widest border border-zinc-200 rounded px-1.5 py-0.5 text-zinc-400">Child</span>
        </div>

        {/* Daily limit bar */}
        <div>
          <div className="flex justify-between text-[11px] text-zinc-400 mb-1.5">
            <span>Daily limit used</span>
            <span className="text-zinc-700 font-medium">320 / 500 CZK</span>
          </div>
          <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={inView ? { width: `${spentPct}%` } : {}}
              transition={{ duration: 0.9, delay: 0.5, ease: "easeOut" }}
              className="h-full bg-primary rounded-full"
            />
          </div>
        </div>

        {/* Recent transactions */}
        <div className="flex flex-col gap-1.5 border-t border-zinc-100 pt-3">
          <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-medium mb-0.5">Recent</p>
          {[
            { label: "Rohlík.cz", value: "−120 CZK" },
            { label: "McDonald's", value: "−200 CZK" },
          ].map((t) => (
            <div key={t.label} className="flex items-center justify-between">
              <span className="text-xs text-zinc-600">{t.label}</span>
              <span className="text-xs font-medium text-zinc-500">{t.value}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

export function FamilyAccountsCard() {
  return (
    <div className="bg-white border border-zinc-200 rounded-[2rem] col-span-1 md:col-span-4 flex flex-col min-h-135 overflow-hidden">
      <div className="flex-1 flex items-center justify-center px-10 pt-10">
        <FamilyApprovalDemo />
      </div>
      <div className="p-10">
        <h3 className="text-2xl font-medium tracking-tight mb-2 text-zinc-950">Family Sub-accounts</h3>
        <p className="text-zinc-400 text-sm leading-relaxed">
          Empower your children with financial literacy. Set limits and approve transactions directly from your device in real-time.
        </p>
      </div>
    </div>
  );
}
