import { ArrowUpRight, CirclePlay } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <div className="flex flex-col justify-center items-center gap-16 px-6 py-16 w-full min-h-screen">
      <div className="max-w-3xl text-center">
        <Badge
          asChild
          className="py-1 border-border rounded-full"
          variant="secondary"
        >
          <Link href="#">
            Just released v1.0.0 <ArrowUpRight className="ml-1 size-4" />
          </Link>
        </Badge>
        <h1 className="mt-6 font-semibold text-4xl sm:text-5xl md:text-6xl lg:text-7xl md:leading-[1.2] tracking-tighter">
          Prime Pay - Moderní bankovní aplikace
        </h1>
        <p className="mt-6 text-foreground/80 md:text-lg">
          Explore a collection of Shadcn UI blocks and components, ready to
          preview and copy. Streamline your development workflow with
          easy-to-implement examples.
        </p>
        <div className="flex justify-center items-center gap-4 mt-10">
          <Button className="rounded-full text-base" size="lg">
            Get Started <ArrowUpRight className="w-5! h-5!" />
          </Button>
          <Button
            className="shadow-none rounded-full text-base"
            size="lg"
            variant="outline"
          >
            <CirclePlay className="w-5! h-5!" /> Watch Demo
          </Button>
        </div>
      </div>
      <div className="mx-auto aspect-video w-full max-w-(--breakpoint-xl) rounded-xl bg-accent" />
    </div>
  );
}
