import Link from "next/link";
import Image from "next/image";
import Footer from "@/components/landing/Footer";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8F8F8] text-stone-800 font-sans antialiased">
      {/* Light branded header for legal docs — kept distinct from the
          landing header because readability of policy text matters more
          than marketing nav here. */}
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

      {/* Shared landing Footer — kept identical to the homepage so the
          site reads as one cohesive brand. */}
      <Footer />
    </div>
  );
}
