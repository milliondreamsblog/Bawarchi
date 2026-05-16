import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us · Bawarchie",
  description:
    "Bawarchie is a QR-based dine-in ordering platform for restaurants. Customers scan, order, and pay from their table.",
};

export default function AboutPage() {
  return (
    <article className="prose prose-stone max-w-none">
      <header className="mb-10">
        <p className="text-[10px] tracking-[0.3em] text-[#86A6DE] uppercase mb-3">
          About
        </p>
        <h1 className="text-4xl md:text-5xl font-serif italic text-[#324F7B] leading-tight">
          A simpler way to dine in.
        </h1>
      </header>

      <section className="space-y-6 text-stone-700 leading-relaxed text-[15px]">
        <p>
          <strong>Bawarchie</strong> is a QR-based dine-in ordering platform built
          for Indian restaurants and their guests. Customers seated at a
          restaurant table scan a unique QR code, browse the menu on their own
          phone, place their order, and pay — all without flagging down a server
          or waiting for the bill.
        </p>
        <p>
          Behind the scenes, restaurants get a full management dashboard: menu
          and item editor, table QR generator, a live kitchen order queue,
          inventory tracking, customer feedback collection with AI-based
          sentiment analysis, and analytics. A companion mobile app for staff
          pings the kitchen the moment a new order arrives, so service runs even
          when the floor is busy.
        </p>
        <p>
          We started Bawarchie with a simple observation: most Indian
          dine-in restaurants still hand-write orders, lose tickets, and run
          payment through a single shared device at the counter. There is no
          good reason for that in 2026. A QR code at every table, a phone in
          every customer's hand, and software that does the rest — that's the
          whole product.
        </p>
        <p>
          The company is based in Kanpur, Uttar Pradesh, and operates entirely
          online. We do not own or operate any physical restaurant; we provide
          software and payment infrastructure to restaurants that do.
        </p>
      </section>

      <section className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <p className="text-[10px] tracking-[0.3em] text-[#324F7B] uppercase mb-2">
            For diners
          </p>
          <p className="text-stone-700 text-sm leading-relaxed">
            Scan the QR at your table. Browse, order, pay. No app to install, no
            account to create.
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <p className="text-[10px] tracking-[0.3em] text-[#324F7B] uppercase mb-2">
            For restaurants
          </p>
          <p className="text-stone-700 text-sm leading-relaxed">
            Menu management, live order queue, inventory, feedback with AI
            sentiment, analytics — and a staff mobile app with push.
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <p className="text-[10px] tracking-[0.3em] text-[#324F7B] uppercase mb-2">
            Pricing
          </p>
          <p className="text-stone-700 text-sm leading-relaxed">
            A 2% platform fee on every successful order. No setup cost, no
            monthly minimum, no per-table fee.
          </p>
        </div>
      </section>
    </article>
  );
}
