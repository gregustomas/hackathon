"use client";

import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "framer-motion";
import Image from "next/image";
import { useRef, useState } from "react";
import {
  ShieldCheck,
  User,
  Users,
  FileText,
  Settings,
  CreditCard,
  Send,
  TrendingUp,
  Clock,
  Lock,
} from "lucide-react";

const roles = [
  {
    title: "Administrator",
    subtitle: "Full infrastructure control.",
    desc: "Manage users, review audit logs, configure system-wide settings, and promote bankers across the entire platform.",
    features: [
      { label: "User lifecycle management", icon: Users },
      { label: "Audit log access", icon: FileText },
      { label: "Global configuration", icon: Settings },
    ],
    image: "/admin-dash.png",
  },
  {
    title: "Banker",
    subtitle: "Client relationship management.",
    desc: "Review and approve loan applications, adjust credit limits, manage card unblock requests, and oversee client portfolios.",
    features: [
      { label: "Loan approval workflow", icon: FileText },
      { label: "Card unblock requests", icon: CreditCard },
      { label: "Client overview", icon: User },
    ],
    image: "/banker-dash.png",
  },
  {
    title: "Client",
    subtitle: "A full-featured banking dashboard.",
    desc: "Issue virtual cards, send instant payments, track live market rates, and manage linked family accounts.",
    features: [
      { label: "Virtual card management", icon: CreditCard },
      { label: "Instant transfers", icon: Send },
      { label: "Live market rates", icon: TrendingUp },
    ],
    image: "/client-dash.png",
  },
  {
    title: "Child",
    subtitle: "Safe, supervised spending.",
    desc: "A controlled environment where payments above the daily limit are routed to the parent for approval before processing.",
    features: [
      { label: "Parental approval flow", icon: Clock },
      { label: "Daily spending limit", icon: Lock },
      { label: "Restricted access", icon: ShieldCheck },
    ],
    image: "/child-dash.png",
  },
];

export default function RolesSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const [index, setIndex] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (v < 0.25) setIndex(0);
    else if (v < 0.5) setIndex(1);
    else if (v < 0.75) setIndex(2);
    else setIndex(3);
  });

  const active = roles[index];

  return (
    <div ref={containerRef} className="relative h-[400vh]">
      <section className="sticky top-0 h-screen overflow-hidden flex flex-col">

        {/* Scroll progress bar */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-px bg-foreground/20 origin-left z-50"
          style={{ scaleX: scrollYProgress }}
        />

        {/* Main 3-column layout */}
        <div className="flex-1 grid grid-cols-12 gap-8 items-center px-8 max-w-360 mx-auto w-full">

          {/* LEFT — role identity + features */}
          <div className="col-span-3 flex flex-col gap-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="flex flex-col divide-y divide-border"
              >
                {/* Role identity block */}
                <div className="pb-6 flex flex-col gap-1">
                  <p className="text-xs text-muted-foreground font-normal">
                    System Roles
                  </p>
                  <p className="text-2xl font-semibold tracking-tight">
                    {active.title}
                  </p>
                  {/* Step indicators */}
                  <div className="flex items-center gap-1.5 mt-2">
                    {roles.map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{ width: i === index ? 18 : 5, opacity: i === index ? 1 : 0.2 }}
                        transition={{ duration: 0.35, ease: "easeInOut" }}
                        className="h-0.5 bg-foreground rounded-full"
                      />
                    ))}
                  </div>
                </div>

                <p className="text-sm font-semibold py-4">
                  Capabilities
                </p>
                {active.features.map((feat, i) => (
                  <motion.div
                    key={feat.label}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.09 }}
                    className="py-4 flex items-center gap-3 text-sm font-normal text-foreground/80"
                  >
                    <feat.icon size={15} className="text-muted-foreground shrink-0" />
                    {feat.label}
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* CENTER — mockup */}
          <div className="col-span-6 flex justify-center">
            <div className="w-full max-w-2xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 1.02, y: 14 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: -14 }}
                  transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  <Image
                    src={active.image}
                    alt={`${active.title} dashboard`}
                    width={960}
                    height={600}
                    className="w-full h-auto drop-shadow-2xl"
                    priority
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* RIGHT — subtitle + description */}
          <div className="col-span-3 flex flex-col gap-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="flex flex-col gap-3"
              >
                <p className="text-sm font-medium text-foreground">
                  {active.subtitle}
                </p>
                <p className="text-sm font-normal text-muted-foreground leading-relaxed">
                  {active.desc}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

        </div>
      </section>
    </div>
  );
}
