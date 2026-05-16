import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Delivery Policy · Bawarchie",
  description:
    "How orders placed through Bawarchie reach the customer — all dine-in, no delivery.",
};

const EFFECTIVE_DATE = "16 May 2026";

export default function ShippingPage() {
  return (
    <article className="max-w-none">
      <header className="mb-10">
        <p className="text-[10px] tracking-[0.3em] text-[#86A6DE] uppercase mb-3">
          Legal
        </p>
        <h1 className="text-4xl md:text-5xl font-serif italic text-[#324F7B] leading-tight">
          Delivery Policy
        </h1>
        <p className="text-stone-500 text-sm mt-4">Effective {EFFECTIVE_DATE}</p>
      </header>

      <div className="space-y-8 text-stone-700 leading-relaxed text-[15px]">
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <p className="text-[10px] tracking-[0.3em] text-[#324F7B] uppercase mb-2">
            Summary
          </p>
          <p className="text-stone-800 font-medium">
            Bawarchie is exclusively a dine-in ordering platform. We do not
            handle any form of delivery, takeaway, or shipping.
          </p>
        </div>

        <Section title="1. How orders reach you">
          <p>
            Every order placed through Bawarchie is placed by a Diner who is
            already seated at a partner Restaurant's table. The flow is:
          </p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>The Diner scans the QR code printed on the table.</li>
            <li>The Diner views the menu, places an order, and pays through
              Razorpay.</li>
            <li>The Restaurant's kitchen prepares the food.</li>
            <li>The Restaurant's staff serves the food at the Diner's table.</li>
          </ol>
          <p>
            There is no logistics step, no third-party delivery partner, and no
            address involved at any point.
          </p>
        </Section>

        <Section title="2. Estimated preparation time">
          <p>
            Preparation time varies by Restaurant and by the items ordered.
            Most orders are served within 15 to 30 minutes of being marked
            "Preparing" by the kitchen. Bawarchie displays a live order status
            on the Diner's phone so you know when your food is on its way.
          </p>
        </Section>

        <Section title="3. If your food is delayed">
          <p>
            If a meaningful delay occurs, please raise it with the Restaurant's
            staff at the table — they are the only people who can hurry the
            kitchen. If the Restaurant is unresponsive or refuses to fulfill
            your order after a reasonable wait, please refer to our{" "}
            <a href="/refund" className="text-[#5067AA] hover:underline">
              Refund &amp; Cancellation Policy
            </a>
            .
          </p>
        </Section>

        <Section title="4. No takeaway through this platform">
          <p>
            Some Restaurants may offer takeaway as part of their own
            operations, but takeaway orders are not processed through the
            Bawarchie platform. Any takeaway arrangement is a separate
            transaction directly between the Diner and the Restaurant, and
            Bawarchie is not a party to it.
          </p>
        </Section>

        <Section title="5. No delivery through this platform">
          <p>
            Bawarchie does not offer, arrange, or facilitate home delivery,
            office delivery, or any other delivery service. We do not contract
            with Zomato, Swiggy, Dunzo, Porter, or any other delivery partner.
            If you are looking for food delivery, please use a dedicated
            delivery aggregator.
          </p>
        </Section>

        <Section title="6. Contact">
          <p>
            For any questions about the dine-in flow or your order, please
            visit our{" "}
            <a href="/contact" className="text-[#5067AA] hover:underline">
              Contact
            </a>{" "}
            page.
          </p>
        </Section>
      </div>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-[#324F7B] mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
