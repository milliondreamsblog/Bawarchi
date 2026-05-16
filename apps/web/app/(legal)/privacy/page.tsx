import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy · Bawarchie",
  description:
    "How Bawarchie collects, uses, stores, and protects your personal data, in line with the Digital Personal Data Protection Act, 2023.",
};

const EFFECTIVE_DATE = "16 May 2026";

export default function PrivacyPage() {
  return (
    <article className="max-w-none">
      <header className="mb-10">
        <p className="text-[10px] tracking-[0.3em] text-[#86A6DE] uppercase mb-3">
          Legal
        </p>
        <h1 className="text-4xl md:text-5xl font-serif italic text-[#324F7B] leading-tight">
          Privacy Policy
        </h1>
        <p className="text-stone-500 text-sm mt-4">Effective {EFFECTIVE_DATE}</p>
      </header>

      <div className="space-y-8 text-stone-700 leading-relaxed text-[15px]">
        <Section title="1. Who we are">
          <p>
            Bawarchie ("we", "us", "our") is a QR-based dine-in ordering
            platform operated from Kanpur, Uttar Pradesh, India. This policy
            explains how we handle personal data of Diners (customers using a
            restaurant's QR code to order) and Restaurants (businesses
            registered on the platform).
          </p>
          <p>
            This policy is published in line with the Digital Personal Data
            Protection Act, 2023 ("DPDP Act") and the Information Technology
            (Reasonable Security Practices and Procedures and Sensitive
            Personal Data or Information) Rules, 2011.
          </p>
        </Section>

        <Section title="2. Data we collect">
          <p>
            <strong>From Diners:</strong>
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>An anonymous device-side identifier (a UUID stored in your
              browser's localStorage) issued the first time you scan a table
              QR. This identifier is used to remember your cart and dietary
              preferences across visits.</li>
            <li>Order history at any Restaurant you have placed an order with
              through Bawarchie (item, quantity, price, timestamp, table).</li>
            <li>Dietary preferences you set explicitly (vegetarian, vegan,
              gluten-free, items to avoid).</li>
            <li>Phone number, returned to us by Razorpay after a successful
              payment. We store a SHA-256 hash of this number, not the number
              itself, to link successive orders from the same person without
              storing their phone in plaintext.</li>
            <li>A derived "taste vector" — a 768-dimensional numerical
              representation of your taste profile, computed from your order
              history. It does not contain item names or restaurant names.</li>
          </ul>
          <p>
            <strong>From Restaurants:</strong>
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Account information: business name, owner name, contact phone,
              email, address.</li>
            <li>Operational data: menus, items, prices, tables, orders,
              inventory, and customer feedback received through the platform.</li>
            <li>Payment routing information (the bank account configured at
              Razorpay for settlement). We do not store bank account numbers on
              our servers; this lives with Razorpay.</li>
          </ul>
          <p>
            <strong>Automatically:</strong> standard server logs (IP address,
            user-agent, request timestamps) for security, abuse-prevention, and
            debugging.
          </p>
        </Section>

        <Section title="3. How we use your data">
          <ul className="list-disc pl-5 space-y-1">
            <li>To display the right menu, accept your order, and route the
              payment.</li>
            <li>To compute and display dietary-appropriate recommendations,
              including the cross-restaurant taste graph (you can switch this
              off in your dietary preferences).</li>
            <li>To help Restaurants understand their own customer feedback
              (sentiment analysis is performed on feedback text).</li>
            <li>To prevent fraud, debug issues, and comply with legal
              obligations.</li>
          </ul>
          <p>
            We do not sell your personal data. We do not share your data with
            advertisers.
          </p>
        </Section>

        <Section title="4. Service providers">
          <p>
            We rely on the following third parties, each of which receives only
            the minimum data needed to perform their role:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Razorpay</strong> — payment processing and settlement.
              Razorpay receives the order amount and the Diner's payment
              instrument; their{" "}
              <a
                href="https://razorpay.com/privacy/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#5067AA] hover:underline"
              >
                privacy policy
              </a>{" "}
              applies.</li>
            <li><strong>MongoDB Atlas</strong> — database hosting in the India
              region.</li>
            <li><strong>Cloudinary</strong> — image hosting for restaurant
              item photos and table QR codes.</li>
            <li><strong>Google Gemini and OpenAI</strong> — used to power the
              AI ordering assistant and the sentiment-analysis feature.
              Restaurant feedback text and diner queries are sent to these
              providers; we do not include phone numbers, email addresses, or
              the diner's UUID in those calls.</li>
            <li><strong>Vercel</strong> — hosting for the web application.</li>
          </ul>
        </Section>

        <Section title="5. Where we store your data">
          <p>
            Data is stored on MongoDB Atlas in the India region. Backups are
            taken by Atlas as per their standard schedule. Order history and
            taste-graph data is retained for as long as your account remains
            active (Restaurants) or until you request deletion (Diners).
            Anonymous device-side identifiers can be cleared at any time by
            clearing your browser's localStorage for our site.
          </p>
        </Section>

        <Section title="6. Your rights">
          <p>
            Under the DPDP Act and applicable law, you have the right to:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Access the personal data we hold about you.</li>
            <li>Correct inaccurate personal data.</li>
            <li>Erase your personal data, subject to our legal obligations to
              retain certain transaction records.</li>
            <li>Withdraw consent for the taste-graph feature or for any other
              optional processing.</li>
            <li>File a grievance with our Grievance Officer (contact details
              below).</li>
          </ul>
          <p>
            To exercise any of these rights, email{" "}
            <a
              href="mailto:adityaproworks@gmail.com"
              className="text-[#5067AA] hover:underline"
            >
              adityaproworks@gmail.com
            </a>{" "}
            with the subject line "Privacy Request" and the action you would
            like us to take. We respond to requests within thirty (30) days of
            receipt.
          </p>
        </Section>

        <Section title="7. Cookies and local storage">
          <p>
            We use first-party browser localStorage to store an anonymous
            device identifier and your cart. We do not use third-party
            advertising cookies. NextAuth, the framework that powers
            Restaurant logins, sets a session cookie when a Restaurant signs
            in; this cookie is required for the Service to function.
          </p>
        </Section>

        <Section title="8. Security">
          <p>
            We use industry-standard security practices: HTTPS everywhere,
            hashed passwords (bcrypt), hashed phone numbers (SHA-256),
            HMAC-SHA256 signature verification for Razorpay webhooks, and
            principle-of-least-privilege access to the database. No system is
            perfectly secure; if you believe an account has been compromised,
            please email us immediately.
          </p>
        </Section>

        <Section title="9. Children">
          <p>
            The Service is not directed at children under 18. We do not
            knowingly collect personal data from children. If you are a parent
            and believe your child has provided us with personal data, please
            contact us and we will delete it.
          </p>
        </Section>

        <Section title="10. Changes to this policy">
          <p>
            We may update this policy from time to time. The latest version is
            always at this URL with an updated effective date. We will not
            materially reduce your rights without prior notice.
          </p>
        </Section>

        <Section title="11. Grievance Officer">
          <p>
            In compliance with Section 10 of the DPDP Act and Rule 5(9) of the
            Information Technology Rules, 2011, the Grievance Officer is
            reachable at:
          </p>
          <address className="not-italic bg-white rounded-2xl border border-stone-200 p-4">
            Grievance Officer<br />
            Bawarchie<br />
            Awas Vikas - 3, Kalyanpur<br />
            Kanpur Nagar - 208018, Uttar Pradesh, India<br />
            Email:{" "}
            <a
              href="mailto:adityaproworks@gmail.com"
              className="text-[#5067AA] hover:underline"
            >
              adityaproworks@gmail.com
            </a>
            <br />
            Phone:{" "}
            <span className="tabular-nums">+91 83183 65594</span>
          </address>
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
