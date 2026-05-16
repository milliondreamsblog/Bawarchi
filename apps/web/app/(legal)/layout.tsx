import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin } from "lucide-react";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8F8F8] text-stone-800 font-sans antialiased">
      {/* Header */}
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/logoBawa.png"
              alt="Bawarchie"
              width={120}
              height={36}
              className="h-9 w-auto object-contain"
              priority
            />
          </Link>
          <Link
            href="/"
            className="text-sm text-stone-600 hover:text-[#324F7B] transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 md:py-16">{children}</main>

      {/* Footer */}
      <footer className="bg-[#324F7B] text-white">
        <div className="max-w-4xl mx-auto px-6 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <p className="text-[10px] tracking-[0.3em] text-[#86A6DE] uppercase mb-3">
                Policies
              </p>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/terms" className="hover:text-[#86A6DE] transition-colors">
                    Terms &amp; Conditions
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-[#86A6DE] transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/refund" className="hover:text-[#86A6DE] transition-colors">
                    Refund &amp; Cancellation
                  </Link>
                </li>
                <li>
                  <Link href="/shipping" className="hover:text-[#86A6DE] transition-colors">
                    Delivery Policy
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.3em] text-[#86A6DE] uppercase mb-3">
                Company
              </p>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/about" className="hover:text-[#86A6DE] transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-[#86A6DE] transition-colors">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.3em] text-[#86A6DE] uppercase mb-3">
                Reach us
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Phone className="w-4 h-4 text-[#86A6DE] flex-shrink-0 mt-0.5" />
                  <a href="tel:+918318365594" className="hover:text-[#86A6DE] transition-colors">
                    +91 83183 65594
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <Mail className="w-4 h-4 text-[#86A6DE] flex-shrink-0 mt-0.5" />
                  <a
                    href="mailto:adityaproworks@gmail.com"
                    className="hover:text-[#86A6DE] transition-colors"
                  >
                    adityaproworks@gmail.com
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#86A6DE] flex-shrink-0 mt-0.5" />
                  <span className="text-white/80">Kalyanpur, Kanpur, UP 208018, India</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 text-xs text-white/60">
            © {new Date().getFullYear()} Bawarchie. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
