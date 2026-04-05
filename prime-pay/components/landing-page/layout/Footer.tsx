import { WalletCards } from "lucide-react";
import Link from "next/link";
import { FaGithub, FaTwitter, FaLinkedin } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card/30 backdrop-blur-sm px-6 py-12 md:py-20 mt-20">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          
          {/* Brand Column */}
          <div className="flex flex-col gap-6 col-span-1 md:col-span-1">
            <div className="flex items-center gap-2">
              <WalletCards />
              <span className="text-2xl font-bold">PrimePay</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Award-winning banking platform recognized for innovation in school hackathons. Managing finances has never been easier.
            </p>
            <div className="flex gap-4 text-xl text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors"><FaTwitter /></a>
              <a href="#" className="hover:text-primary transition-colors"><FaLinkedin /></a>
              <a href="#" className="hover:text-primary transition-colors"><FaGithub /></a>
            </div>
          </div>

          {/* Links Columns */}
          <div className="grid grid-cols-2 md:grid-cols-3 col-span-1 md:col-span-3 gap-8">
            <div className="flex flex-col gap-4">
              <h4 className="font-bold uppercase tracking-widest text-xs text-primary">Platform</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="#features" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="#roles" className="hover:text-foreground transition-colors">Roles</Link></li>
                <li><Link href="#security" className="hover:text-foreground transition-colors">Security</Link></li>
              </ul>
            </div>

            <div className="flex flex-col gap-4">
              <h4 className="font-bold uppercase tracking-widest text-xs text-primary">Resources</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">Documentation</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">API Status</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Community</Link></li>
              </ul>
            </div>

            <div className="flex flex-col gap-4">
              <h4 className="font-bold uppercase tracking-widest text-xs text-primary">Legal</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-muted-foreground">
          <p>© 2026 PrimePay. All rights reserved.</p>
          
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase font-bold tracking-widest text-primary/50">Developed by</span>
              <div className="flex gap-4">
                 <a href="https://github.com/Topeez" className="hover:text-primary transition-colors">Ondřej Topínka</a>
                 <a href="https://github.com/gregustomas" className="hover:text-primary transition-colors">Tomáš Greguš</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}