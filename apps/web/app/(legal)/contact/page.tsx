import type { Metadata } from "next";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us · Bawarchie",
  description:
    "Get in touch with Bawarchie — phone, email, and registered business address for support, sales, and partnership.",
};

export default function ContactPage() {
  return (
    <article className="max-w-none">
      <header className="mb-10">
        <p className="text-[10px] tracking-[0.3em] text-[#86A6DE] uppercase mb-3">
          Contact
        </p>
        <h1 className="text-4xl md:text-5xl font-serif italic text-[#324F7B] leading-tight">
          We're listening.
        </h1>
        <p className="text-stone-600 mt-4 text-[15px] leading-relaxed">
          Whether you're a restaurant looking to onboard, a diner with a billing
          question, or a partner exploring an integration — these are the
          fastest ways to reach us.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-[#324F7B]/5 flex items-center justify-center">
              <Phone className="w-5 h-5 text-[#324F7B]" />
            </div>
            <p className="text-[10px] tracking-[0.3em] text-[#324F7B] uppercase">
              Phone
            </p>
          </div>
          <p className="text-stone-700 text-sm mb-1">Primary support</p>
          <a
            href="tel:+918318365594"
            className="text-lg font-medium text-[#324F7B] hover:text-[#5067AA] transition-colors tabular-nums"
          >
            +91 83183 65594
          </a>
          <p className="text-stone-700 text-sm mt-3 mb-1">Sales &amp; partnerships</p>
          <a
            href="tel:+919129601109"
            className="text-lg font-medium text-[#324F7B] hover:text-[#5067AA] transition-colors tabular-nums"
          >
            +91 91296 01109
          </a>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-[#324F7B]/5 flex items-center justify-center">
              <Mail className="w-5 h-5 text-[#324F7B]" />
            </div>
            <p className="text-[10px] tracking-[0.3em] text-[#324F7B] uppercase">
              Email
            </p>
          </div>
          <p className="text-stone-700 text-sm mb-1">General &amp; support</p>
          <a
            href="mailto:adityaproworks@gmail.com"
            className="text-base font-medium text-[#324F7B] hover:text-[#5067AA] transition-colors break-all"
          >
            adityaproworks@gmail.com
          </a>
          <p className="text-stone-500 text-xs mt-3 leading-relaxed">
            We typically reply within one working day. For order-specific
            queries, please include your Razorpay payment ID.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-[#324F7B]/5 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-[#324F7B]" />
            </div>
            <p className="text-[10px] tracking-[0.3em] text-[#324F7B] uppercase">
              Registered address
            </p>
          </div>
          <address className="not-italic text-stone-700 text-sm leading-relaxed">
            Bawarchie<br />
            Awas Vikas - 3, Kalyanpur<br />
            Kanpur Nagar - 208018<br />
            Uttar Pradesh, India
          </address>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-[#324F7B]/5 flex items-center justify-center">
              <Clock className="w-5 h-5 text-[#324F7B]" />
            </div>
            <p className="text-[10px] tracking-[0.3em] text-[#324F7B] uppercase">
              Hours
            </p>
          </div>
          <p className="text-stone-700 text-sm leading-relaxed">
            <strong>Monday – Saturday:</strong> 10:00 – 19:00 IST
            <br />
            <strong>Sunday:</strong> Closed for office support; live order
            issues handled 24/7 via email.
          </p>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-stone-200 p-6">
        <p className="text-[10px] tracking-[0.3em] text-[#324F7B] uppercase mb-3">
          For specific concerns
        </p>
        <ul className="space-y-3 text-sm text-stone-700">
          <li>
            <strong className="text-[#324F7B]">Order or refund issue:</strong>{" "}
            email{" "}
            <a
              href="mailto:adityaproworks@gmail.com"
              className="text-[#5067AA] hover:underline"
            >
              adityaproworks@gmail.com
            </a>{" "}
            with your Razorpay payment ID and the table QR URL.
          </li>
          <li>
            <strong className="text-[#324F7B]">Restaurant onboarding:</strong>{" "}
            call <span className="tabular-nums">+91 91296 01109</span> or email
            us with your restaurant name, city, and a contact number.
          </li>
          <li>
            <strong className="text-[#324F7B]">Privacy or data request:</strong>{" "}
            email us with subject line "Privacy Request" and we will respond
            within the timelines stated in our{" "}
            <a href="/privacy" className="text-[#5067AA] hover:underline">
              Privacy Policy
            </a>
            .
          </li>
          <li>
            <strong className="text-[#324F7B]">Grievance officer:</strong> for
            unresolved complaints, write to us at the registered address above,
            marking the envelope "Grievance Officer".
          </li>
        </ul>
      </section>
    </article>
  );
}
