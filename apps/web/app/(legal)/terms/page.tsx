import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions · Bawarchie",
  description:
    "Terms and conditions for using the Bawarchie QR-based dine-in ordering platform.",
};

const EFFECTIVE_DATE = "16 May 2026";

export default function TermsPage() {
  return (
    <article className="max-w-none">
      <header className="mb-10">
        <p className="text-[10px] tracking-[0.3em] text-[#86A6DE] uppercase mb-3">
          Legal
        </p>
        <h1 className="text-4xl md:text-5xl font-serif italic text-[#324F7B] leading-tight">
          Terms &amp; Conditions
        </h1>
        <p className="text-stone-500 text-sm mt-4">Effective {EFFECTIVE_DATE}</p>
      </header>

      <div className="space-y-8 text-stone-700 leading-relaxed text-[15px]">
        <Section title="1. Acceptance of these terms">
          <p>
            These Terms and Conditions ("Terms") govern your access to and use
            of the Bawarchie platform, including the website, the customer
            ordering interface accessed via a restaurant's table QR code, the
            restaurant management dashboard, and the staff mobile applications
            (together, the "Service"). By accessing the Service, you agree to
            be bound by these Terms. If you do not agree, you must not use the
            Service.
          </p>
        </Section>

        <Section title="2. What Bawarchie is">
          <p>
            Bawarchie is a software-as-a-service platform operated from Kanpur,
            Uttar Pradesh, India. The Service enables restaurants
            ("Restaurants") to accept dine-in orders from customers ("Diners")
            via a QR code placed at the customer's table. Bawarchie facilitates
            the order, the menu display, and the payment collection on behalf
            of the Restaurant; the food itself is prepared and served by the
            Restaurant. Bawarchie does not own, operate, or take responsibility
            for the kitchen, the food, or the service quality of any
            Restaurant.
          </p>
        </Section>

        <Section title="3. Roles">
          <p>
            <strong>Diners</strong> use the Service to view a Restaurant's menu,
            place orders, and pay. Diners do not require an account; an
            anonymous device identifier is stored locally on the Diner's device
            to remember their cart and dietary preferences.
          </p>
          <p>
            <strong>Restaurants</strong> register for an account, list their
            menu and tables on the Service, and use the dashboard to manage
            orders, inventory, feedback, and analytics. Restaurants are the
            merchant of record for every order placed through the Service and
            are responsible for fulfilling the order.
          </p>
        </Section>

        <Section title="4. Payments">
          <p>
            All payments are processed through Razorpay. When a Diner pays for
            an order:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>98% of the order amount (after applicable taxes) settles to
              the Restaurant's bank account registered with Razorpay.</li>
            <li>2% of the order amount is retained by Bawarchie as a platform
              fee.</li>
            <li>Bawarchie does not at any point hold or pool Diner funds.
              Settlement is governed by Razorpay's settlement schedule.</li>
          </ul>
          <p>
            GST and any other statutory taxes are calculated and displayed at
            the time of order on the basis of the Restaurant's configuration.
            The Restaurant is responsible for the correctness of the GST rate,
            HSN code, and tax filings for orders placed through the Service.
          </p>
        </Section>

        <Section title="5. Cancellations and refunds">
          <p>
            Cancellations and refunds are governed by Bawarchie's{" "}
            <a href="/refund" className="text-[#5067AA] hover:underline">
              Refund &amp; Cancellation Policy
            </a>
            , which forms part of these Terms.
          </p>
        </Section>

        <Section title="6. No delivery">
          <p>
            The Service is exclusively for in-restaurant dine-in ordering. The
            Service does not handle delivery, takeaway, or any logistics
            between the Restaurant and the Diner. See our{" "}
            <a href="/shipping" className="text-[#5067AA] hover:underline">
              Delivery Policy
            </a>{" "}
            for details.
          </p>
        </Section>

        <Section title="7. Diner obligations">
          <ul className="list-disc pl-5 space-y-1">
            <li>You must provide accurate information when prompted (for
              example, your phone number at payment, if requested).</li>
            <li>You must not abuse the Service to place fraudulent orders or
              to disrupt a Restaurant's operations.</li>
            <li>You acknowledge that the food is prepared by the Restaurant
              and that Bawarchie does not warrant any specific aspect of food
              quality, ingredients, or preparation timing.</li>
          </ul>
        </Section>

        <Section title="8. Restaurant obligations">
          <ul className="list-disc pl-5 space-y-1">
            <li>Restaurants must hold a valid FSSAI license and all other
              registrations and permissions required to operate as a food
              business in their jurisdiction.</li>
            <li>Restaurants must keep their menu, prices, dietary tags, and
              availability information accurate and up to date.</li>
            <li>Restaurants must fulfill paid orders in good faith. Where an
              order cannot be fulfilled, the Restaurant must mark the order as
              cancelled in the dashboard so that an automatic refund is
              triggered.</li>
            <li>Restaurants must respond to grievances raised by Diners within
              a reasonable time.</li>
          </ul>
        </Section>

        <Section title="9. Intellectual property">
          <p>
            All intellectual property in the Service — including the brand
            "Bawarchie", the platform's source code, the user interface, and
            any documentation — is owned by Bawarchie. Restaurants retain
            ownership of their menu content, item images, and brand assets, and
            grant Bawarchie a non-exclusive licence to display those on the
            Service for the purpose of operating the order flow.
          </p>
        </Section>

        <Section title="10. Acceptable use">
          <p>
            You agree not to: reverse-engineer the Service; circumvent its
            access controls; submit malicious code or attempt unauthorised
            access to other accounts; scrape the Service in violation of
            applicable law; or use the Service to engage in any illegal
            activity.
          </p>
        </Section>

        <Section title="11. Limitation of liability">
          <p>
            To the maximum extent permitted by law, Bawarchie is not liable for
            any indirect, incidental, consequential, special, or punitive
            damages arising from your use of the Service. Bawarchie's total
            liability to any user for any claim arising out of or relating to
            these Terms is limited to the platform fees retained by Bawarchie
            from that user's transactions in the three (3) months preceding the
            claim.
          </p>
          <p>
            In particular, Bawarchie is not liable for: the quality, taste,
            ingredients, preparation, or service of food prepared by a
            Restaurant; delays in food preparation; allergic reactions or
            adverse effects from consumed food; or disputes between a Diner and
            a Restaurant regarding the order. Such claims must be addressed
            directly with the Restaurant.
          </p>
        </Section>

        <Section title="12. Indemnification">
          <p>
            You agree to indemnify and hold Bawarchie harmless from any claims,
            losses, or expenses arising from your breach of these Terms, your
            misuse of the Service, or your violation of any law.
          </p>
        </Section>

        <Section title="13. Termination">
          <p>
            Bawarchie may suspend or terminate access to the Service at its
            discretion for breach of these Terms, suspected fraud, or as
            required by law. Restaurants may close their account at any time
            via the dashboard or by writing to{" "}
            <a
              href="mailto:adityaproworks@gmail.com"
              className="text-[#5067AA] hover:underline"
            >
              adityaproworks@gmail.com
            </a>
            .
          </p>
        </Section>

        <Section title="14. Changes to these terms">
          <p>
            Bawarchie may update these Terms from time to time. The latest
            version is always available at this URL with an updated effective
            date. Continued use of the Service after a change constitutes
            acceptance of the revised Terms.
          </p>
        </Section>

        <Section title="15. Governing law and jurisdiction">
          <p>
            These Terms are governed by the laws of India. Any dispute arising
            out of or in connection with these Terms is subject to the
            exclusive jurisdiction of the courts at Kanpur, Uttar Pradesh.
          </p>
        </Section>

        <Section title="16. Contact">
          <p>
            For any questions about these Terms, please email{" "}
            <a
              href="mailto:adityaproworks@gmail.com"
              className="text-[#5067AA] hover:underline"
            >
              adityaproworks@gmail.com
            </a>{" "}
            or write to the registered address listed on our{" "}
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
