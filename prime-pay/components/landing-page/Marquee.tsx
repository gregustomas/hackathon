"use client";

import { motion } from "framer-motion";

interface MarqueeProps {
  text: string;
  speed?: number;
}

export const Marquee = ({ text, speed = 30 }: MarqueeProps) => {
  return (
    <div className="relative flex w-full overflow-hidden py-10 select-none">
      {/* Container pro animaci */}
      <motion.div
        className="flex whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }} // Posun o polovinu celkové šířky (obsah + kopie)
        transition={{
          duration: speed,
          ease: "linear",
          repeat: Infinity,
        }}
      >
        {/* První sada textu */}
        <span className="text-[12vw] font-black uppercase text-secondary/10 px-4">
          {text}
        </span>
        {/* Druhá sada textu (kopie pro plynulý přechod) */}
        <span className="text-[12vw] font-black uppercase text-secondary/10 px-4">
          {text}
        </span>
      </motion.div>
    </div>
  );
};