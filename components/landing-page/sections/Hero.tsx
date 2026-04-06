"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import mockup from "@/public/mockup-primepay.png";
import { FaGithub } from "react-icons/fa";
import { Marquee } from "../Marquee";
import { motion, useSpring, useMotionValue, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);

  // Desktop — mouse parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    mouseX.set((clientX / innerWidth - 0.5) * -80);
    mouseY.set((clientY / innerHeight - 0.5) * -80);
  };

  // Mobile — scroll parallax
  const { scrollY } = useScroll();
  const mobileParallaxY = useTransform(scrollY, [0, 500], [0, -80]);
  const mobileScale = useTransform(scrollY, [0, 400], [1, 0.92]);

  return (
    <section ref={sectionRef} className="grid gap-12 md:gap-20" onMouseMove={handleMouseMove}>

      {/* top */}
      <div className="relative pt-12 md:pt-24 flex flex-col md:flex-row md:justify-between gap-8 md:gap-0">

        {/* left — heading + button */}
        <div className="flex flex-col gap-8 md:gap-16 z-10">
          <div className="text-4xl sm:text-5xl md:text-7xl leading-tight tracking-tight">
            <h1>Start Managing</h1>
            <h1>Your Finances</h1>
            <h1 className="text-primary/60">With PrimePay</h1>
          </div>

          <Button asChild size="lg" className="w-fit text-lg md:text-2xl px-8 md:px-12 py-6 md:py-8">
            <a href="/dashboard">Start now</a>
          </Button>
        </div>

        {/* right — description + authors (desktop only) */}
        <div className="hidden md:flex max-w-xs flex-col justify-between h-full">
          <p className="text-sm leading-relaxed text-muted-foreground">
            PrimePay is a sophisticated banking platform built with Next.js and
            Supabase in just 48 hours. It features four specialized roles and
            secured 2nd place at our school hackathon.
          </p>
          <div className="text-sm">
            <p className="font-medium mb-2">Created by</p>
            <a href="https://github.com/Topeez" className="flex gap-2 items-center hover:text-muted-foreground transition-colors">
              <FaGithub /> Ondřej Topínka
            </a>
            <a href="https://github.com/gregustomas" className="flex gap-2 items-center hover:text-muted-foreground transition-colors">
              <FaGithub /> Tomáš Greguš
            </a>
          </div>
        </div>

        {/* mockup — desktop absolute with mouse parallax */}
        <motion.div
          style={{ x: springX, y: springY }}
          className="hidden md:block absolute left-1/4 top-5 z-[2] pointer-events-none"
        >
          <Image src={mockup} alt="mockup" width={720} priority />
        </motion.div>

        {/* mockup — mobile with scroll parallax */}
        <motion.div
          style={{ y: mobileParallaxY, scale: mobileScale }}
          className="md:hidden flex justify-center mt-2"
        >
          <Image
            src={mockup}
            alt="mockup"
            width={460}
            priority
            className="w-full max-w-sm drop-shadow-xl"
          />
        </motion.div>

        {/* authors — mobile only */}
        <div className="md:hidden text-sm text-muted-foreground flex flex-col gap-1">
          <a href="https://github.com/Topeez" className="flex gap-2 items-center">
            <FaGithub /> Ondřej Topínka
          </a>
          <a href="https://github.com/gregustomas" className="flex gap-2 items-center">
            <FaGithub /> Tomáš Greguš
          </a>
        </div>
      </div>

      {/* bottom — marquee */}
      <div className="w-full overflow-hidden rounded-2xl bg-primary">
        <Marquee text="FINANCE MANAGEMENT SYSTEM" />
      </div>
    </section>
  );
}
