import { Award, ArrowRight, Phone, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function FinalCTASection() {
  return (
    <section id="get-started" className="relative py-24 overflow-hidden bg-gradient-to-b from-[var(--bg)] to-[var(--bg-alt)] text-[var(--text)]">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--grid-line)_1px,transparent_1px),linear-gradient(to_bottom,var(--grid-line)_1px,transparent_1px)] bg-[size:24px_24px] opacity-50"></div>

      <div className="container max-w-4xl mx-auto px-6 relative">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-6">
            <Award className="w-4 h-4 text-[var(--accent)]" />
            <span className="text-sm font-medium text-[var(--accent)]">READY TO TRANSFORM?</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            Get Your Restaurant&apos;s <span className="text-[var(--accent)]">Free Demo</span>
          </h2>

          <p className="text-xl text-[var(--text-muted)] max-w-2xl mx-auto mb-10">
            See how Bawarchie can streamline your operations in a 15-minute personalized demo
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="https://cal.com/bawarchie"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-500 transition-all text-lg"
            >
              Book Free Demo
              <ArrowRight className="w-5 h-5" />
            </Link>

            <Link
              href="tel:+918318365594"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--soft)] rounded-xl border border-[var(--border)] transition-all text-lg"
            >
              <Phone className="w-5 h-5" />
              Call Now: +91 8318365594
            </Link>
          </div>

          <div className="max-w-2xl mx-auto p-6 bg-[var(--soft)] rounded-2xl border border-[var(--border)]">
            <h4 className="font-bold text-lg mb-4">What you&apos;ll see in the demo:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm text-[var(--text-muted)]">
              {[
                "Complete QR ordering flow",
                "Restaurant dashboard demo",
                "Menu management in action",
                "Live order tracking",
                "Payment processing",
                "Analytics & reporting"
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[var(--accent)]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
