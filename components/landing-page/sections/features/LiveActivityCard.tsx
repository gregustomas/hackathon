"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Send, Clock } from "lucide-react";

const notifications = [
  { id: 1, Icon: ArrowRight, title: "Payment received", subtitle: "From: Jan Novák", value: "+2 500 CZK", time: "just now", live: true },
  { id: 2, Icon: Send, title: "Transfer sent", subtitle: "To: Alza.cz", value: "−800 CZK", time: "2 min ago", live: false },
  { id: 3, Icon: Clock, title: "Approval request", subtitle: "Emma — MALL.cz", value: "350 CZK", time: "5 min ago", live: false },
];

function NotificationFeed() {
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.3 });

  return (
    <div ref={ref} className="flex flex-col gap-2 w-full">
      {notifications.map((n, i) => (
        <motion.div
          key={n.id}
          initial={{ opacity: 0, y: 8 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: i * 0.1 }}
          className="flex items-center gap-3 px-3 md:px-4 py-3 bg-muted/50 border border-border rounded-2xl"
        >
          <div className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center shrink-0 relative">
            <n.Icon size={13} className="text-muted-foreground" />
            {n.live && <span className="absolute top-0 right-0 h-2 w-2 bg-primary rounded-full border-2 border-card animate-pulse" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate leading-none mb-0.5">{n.title}</p>
            <p className="text-[11px] text-muted-foreground truncate">{n.subtitle}</p>
          </div>
          <div className="text-right shrink-0">
            <p className={`text-sm font-semibold tracking-tight ${n.value.startsWith("+") ? "text-foreground" : "text-muted-foreground"}`}>
              {n.value}
            </p>
            <p className="text-[10px] text-muted-foreground/60 uppercase font-medium">{n.time}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function LiveActivityCard() {
  return (
    <div className="bg-card border border-border rounded-[2rem] col-span-1 md:col-span-5 p-6 md:p-10 flex flex-col gap-6 md:gap-8 min-h-80 md:min-h-95">
      <div>
        <h3 className="text-xl md:text-2xl font-medium tracking-tight mb-2 text-foreground">Live Activity Feed</h3>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
          Instant alerts for every event across your financial ecosystem.
        </p>
      </div>
      <NotificationFeed />
    </div>
  );
}
