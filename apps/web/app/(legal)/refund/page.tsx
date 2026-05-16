import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy · Bawarchie",
  description:
    "How cancellations and refunds work for orders placed through the Bawarchie platform.",
};

const EFFECTIVE_DATE = "16 May 2026";

export default function RefundPage() {
  return (
    <article className="max-w-none">
      <header className="mb-10">
        <p className="text-[10px] tracking-[0.3em] text-[#86A6DE] uppercase mb-3">
          Legal
        </p>
        <h1 className="text-4xl md:text-5xl font-serif italic text-[#324F7B] leading-tight">
          Refund &amp; Cancellation Policy
        </h1>
        <p className="text-stone-500 text-sm mt-4">Effective {EFFECTIVE_DATE}</p>
      </header>

      <div className="space-y-8 text-stone-700 leading-relaxed text-[15px]">
        <Section title="1. Order statuses">
          <p>
            An order placed on Bawarchie progresses through these statuses:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Pending</strong> — payment captured, kitchen not yet
              started.</li>
            <li><strong>Preparing</strong> — the Restaurant has accepted the
              order and the kitchen is preparing the food.</li>
            <li><strong>Served</strong> — the order has been served at the
              table.</li>
            <li><strong>Cancelled</strong> — the order was cancelled by the
              Diner, the Restaurant, or our support team.</li>
            <li><strong>Refunded</strong> — the order was refunded after
              capture.</li>
          </ul>
        </Section>

        <Section title="2. When can a Diner cancel?">
          <p>
            A Diner can request a free cancellation while the order status is
            still <strong>Pending</strong>. Once the Restaurant marks the order
            as <strong>Preparing</strong>, the food is on the stove and a
            cancellation is at the Restaurant's discretion (since ingredients
            and labour have already been committed).
          </p>
          <p>
            To cancel a Pending order, contact the Restaurant directly at the
            table or email{" "}
            <a
              href="mailto:adityaproworks@gmail.com"
              className="text-[#5067AA] hover:underline"
            >
              adityaproworks@gmail.com
            </a>{" "}
            with your Razorpay payment ID. A full refund is initiated within 24
            hours of cancellation.
          </p>
        </Section>

        <Section title="3. When does the Restaurant cancel?">
          <p>
            A Restaurant may cancel an order in good faith if:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>An item has just gone out of stock and a substitute cannot be
              offered.</li>
            <li>The kitchen is unable to prepare the order within a reasonable
              time.</li>
            <li>The Diner has indicated dietary requirements that the
              Restaurant cannot meet safely.</li>
          </ul>
          <p>
            When a Restaurant cancels, a full refund is automatically
            triggered to the Diner's original payment instrument via
            Razorpay's refund API.
          </p>
        </Section>

        <Section title="4. Refund timeline">
          <p>
            Once a refund is initiated, the funds are credited back to the
            original payment instrument:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>UPI</strong> — typically within 1–3 business days.</li>
            <li><strong>Credit / debit card</strong> — typically 5–7 business
              days, depending on the issuing bank.</li>
            <li><strong>Net banking / wallet</strong> — typically 3–5 business
              days.</li>
          </ul>
          <p>
            The exact timing is controlled by the Diner's bank or payment
            instrument and is not within Bawarchie's or Razorpay's control once
            the refund has been initiated.
          </p>
        </Section>

        <Section title="5. Partial refunds">
          <p>
            If a Restaurant is able to deliver part of the order but not the
            whole order (for example, a single item is out of stock after
            preparation has begun), the Restaurant can initiate a partial
            refund for the unfulfilled items via the management dashboard. The
            same refund timelines as above apply.
          </p>
        </Section>

        <Section title="6. Food-quality complaints">
          <p>
            Bawarchie facilitates the payment but does not prepare the food.
            Complaints about taste, temperature, ingredients, freshness, or
            presentation must be raised with the Restaurant directly while you
            are still at the table. If you would like Bawarchie to assist with
            a Restaurant that is unresponsive to a reasonable complaint, please
            email{" "}
            <a
              href="mailto:adityaproworks@gmail.com"
              className="text-[#5067AA] hover:underline"
            >
              adityaproworks@gmail.com
            </a>{" "}
            within 24 hours of the order with your Razorpay payment ID and a
            short description.
          </p>
        </Section>

        <Section title="7. Platform fee on refunds">
          <p>
            When an order is fully refunded, Bawarchie refunds its 2% platform
            fee along with the Restaurant's share of the order. Diners receive
            the full order amount they paid; no platform fee is retained on a
            refunded order.
          </p>
        </Section>

        <Section title="8. Chargebacks">
          <p>
            Diners are encouraged to contact us or the Restaurant before
            raising a chargeback with their bank. If we have not been given a
            reasonable chance to resolve a dispute, the Restaurant may dispute
            the chargeback through Razorpay's chargeback flow. Bawarchie
            cooperates fully with both parties in genuine cases.
          </p>
        </Section>

        <Section title="9. Contact for refund questions">
          <p>
            Email:{" "}
            <a
              href="mailto:adityaproworks@gmail.com"
              className="text-[#5067AA] hover:underline"
            >
              adityaproworks@gmail.com
            </a>
            <br />
            Phone:{" "}
            <span className="tabular-nums">+91 83183 65594</span> (Monday –
            Saturday, 10:00 – 19:00 IST).
          </p>
          <p className="text-sm text-stone-500">
            Please include your Razorpay payment ID, the order date and time,
            and the restaurant name when contacting us about a specific order.
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
