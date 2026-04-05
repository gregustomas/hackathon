"use client";

import Image from "next/image";
import card from "@/public/card.png";
import { motion } from "framer-motion";
import { ShoppingCart, Send, CreditCard, TrendingUp, Globe, Lock } from "lucide-react";

const cardIcons = [
  { icon: <ShoppingCart size={16} />, x: -160, y: -110, delay: 0.1 },
  { icon: <Send size={16} />, x: 10, y: -155, delay: 0.2 },
  { icon: <CreditCard size={16} />, x: 160, y: -110, delay: 0.3 },
  { icon: <TrendingUp size={16} />, x: -160, y: 110, delay: 0.4 },
  { icon: <Globe size={16} />, x: 10, y: 155, delay: 0.5 },
  { icon: <Lock size={16} />, x: 160, y: 110, delay: 0.6 },
];

export function VirtualCardsCard() {
  return (
    <div className="bg-primary rounded-[2rem] col-span-1 md:col-span-4 flex flex-col overflow-hidden min-h-135">
      <div className="flex-1 relative flex items-center justify-center pt-12">
        {cardIcons.map((item, index) => (
          <motion.div
            key={index}
            initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
            whileInView={{ x: item.x, y: item.y, scale: 1, opacity: 1 }}
            viewport={{ amount: 0.4 }}
            transition={{ delay: item.delay, type: "spring", stiffness: 80, damping: 14 }}
            className="absolute z-0 w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white/60"
          >
            {item.icon}
          </motion.div>
        ))}
        <motion.div
          initial={{ rotate: 0 }}
          whileInView={{ rotate: -6 }}
          transition={{ type: "spring", stiffness: 50 }}
          className="relative z-10 drop-shadow-[0_24px_60px_rgba(0,0,0,0.5)]"
        >
          <Image src={card} alt="Card" width={300} className="rounded-2xl pointer-events-none" />
        </motion.div>
      </div>
      <div className="p-10 text-white">
        <h3 className="text-2xl font-medium tracking-tight mb-2">Virtual Cards & Tracking</h3>
        <p className="text-zinc-500 text-sm leading-relaxed">
          Issue virtual cards with custom daily limits. Track every expense and income with interactive charts and real-time history.
        </p>
      </div>
    </div>
  );
}
