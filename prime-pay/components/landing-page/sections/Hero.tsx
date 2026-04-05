"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import mockup from "@/public/mockup-primepay.png";
import { FaGithub } from "react-icons/fa";
import { Marquee } from "../Marquee";
import { motion, useSpring, useMotionValue } from "framer-motion";

export default function Hero() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;

    const x = (clientX / innerWidth - 0.5) * -80;
    const y = (clientY / innerHeight - 0.5) * -80;

    mouseX.set(x);
    mouseY.set(y);
  };

  return (
    <section className="grid gap-20" onMouseMove={handleMouseMove}>
      {/* top */}
      <div className="relative pt-24 flex justify-between">
        {/* left */}
        <div className="flex flex-col gap-16">
          <div className="text-7xl">
            <h1>Start Managing</h1>
            <h1>Your Finances</h1>
            <h1 className="text-primary/60">With PrimePay</h1>
          </div>

          <Button asChild size="lg" className="w-fit text-2xl px-12 py-8">
            <a href="/dashboard">Start now</a>
          </Button>
        </div>

        {/* right */}
        <div className="max-w-xs flex flex-col justify-between h-full">
          <p>
            PrimePay is a sophisticated banking platform built with Next.js and
            Supabase in just 48 hours. It features four specialized roles and
            secured 2nd place at our school hackathon.
          </p>

          <div className="text-md">
            <p className="font-medium mb-2">Created by</p>
            <div className="text-sm text-md"></div>
            <a href="https://github.com/Topeez">
              <span className="flex gap-2 items-center">
                <FaGithub />
                Ondřej Topínka
              </span>
            </a>
            <a href="https://github.com/gregustomas">
              <span className="flex gap-2 items-center">
                <FaGithub />
                Tomáš Greguš
              </span>
            </a>
          </div>
        </div>

        <motion.div
          style={{
            x: springX,
            y: springY,
          }}
          className="absolute left-1/4 top-5 z-2 pointer-events-none"
        >
          <Image src={mockup} alt="mockup" width={720} />
        </motion.div>
      </div>

      {/* bottom */}
      <div className="w-full overflow-hidden rounded-2xl bg-primary">
        <Marquee text="FINANCE MANAGEMENT SYSTEM" />
      </div>
    </section>
  );
}
