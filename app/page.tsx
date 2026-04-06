import Hero from "@/components/landing-page/sections/Hero";
import Header from "@/components/landing-page/layout/Header";
import Footer from "@/components/landing-page/layout/Footer";
import Features from "@/components/landing-page/sections/Features";
import Roles from "@/components/landing-page/sections/Roles";
import Security from "@/components/landing-page/sections/Security";

export default function Home() {
  return (
    <main className="w-full max-w-7xl mx-auto">
      <Header />
      <div className="px-4">
        <Hero />
        <section id="features"><Features /></section>
        <section id="roles"><Roles /></section>
        <section id="security"><Security /></section>
      </div>
      <Footer />
    </main>
  );
}
