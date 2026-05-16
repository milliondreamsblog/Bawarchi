"use client"

import { useState } from "react";
import {
  ChevronDown, ChevronUp, HelpCircle
} from "lucide-react";

export default function FAQsection() {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const faqs = [
    {
      question: "What's included in the ₹999 one-time setup?",
      answer:
        "The ₹999 one-time setup covers complete onboarding: QR code generation for tables, full menu setup in our system, table mapping, dashboard configuration, and staff onboarding. This is a one-time cost to get your restaurant live on Bawarchie."
    },
    {
      question: "What is the difference between ₹399/month and ₹499/month plans?",
      answer:
        "The ₹399/month Digital Menu plan includes digital menu, order management, real-time dashboard, staff management, and analytics. The ₹499/month Complete Solution includes everything in ₹399 PLUS integrated payment gateway, auto billing, digital payments, and GST calculation."
    },
    {
      question: "Is there a free trial available?",
      answer:
        "Yes. We offer a 7-day free trial on both monthly plans. You can explore all features before committing. No long-term contract required."
    },
    {
      question: "How long does the setup take?",
      answer:
        "Most restaurants are onboarded within 24–48 hours. This includes menu setup, QR configuration, and staff training. In many cases, outlets go live within the same day."
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer:
        "Yes. All monthly plans are month-to-month with no lock-in. You can cancel anytime. Your data remains accessible for a limited period after cancellation."
    },
    {
      question: "Do I need any special hardware?",
      answer:
        "No additional hardware is required. Bawarchie works on any smartphone, tablet, or computer. Customers only need their phone camera to scan the QR."
    },
    {
      question: "Can I upgrade from ₹399/month to ₹499/month later?",
      answer:
        "Yes. You can upgrade anytime. Once upgraded, payment gateway features, auto billing, and GST calculation are enabled immediately."
    },
    {
      question: "What payment methods are supported in the ₹499 plan?",
      answer:
        "The Complete Solution supports UPI, credit/debit cards, net banking, and wallets via Razorpay. All transactions are secure and verified."
    },
    {
      question: "Is there a long-term contract?",
      answer:
        "No. There are no long-term contracts. You pay monthly and stay only if the product delivers value."
    },
    {
      question: "How many QR codes do I get?",
      answer:
        "You can generate QR codes for all your tables as part of the setup. Typically, one QR per table is recommended."
    }
  ];

  return (
    <section id="faq" className="py-20 bg-[var(--bg)] text-[var(--text)]">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Frequently Asked Questions</h2>
          <p className="text-[var(--text-muted)] text-xl">
            Everything you need to know about our pricing plans
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-[var(--soft)] border border-[var(--border)] rounded-2xl overflow-hidden hover:border-[var(--border-strong)] transition-colors"
            >
              <button
                onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-[var(--soft)] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <HelpCircle className="w-5 h-5 text-[var(--accent)] flex-shrink-0" />
                  <span className="text-lg font-medium text-left">{faq.question}</span>
                </div>
                {expandedFAQ === index ? (
                  <ChevronUp className="w-5 h-5 text-[var(--accent)] flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-[var(--text-muted)] flex-shrink-0" />
                )}
              </button>

              {expandedFAQ === index && (
                <div className="px-6 pb-6 animate-fadeIn">
                  <div className="pl-9 border-l-2 border-green-500/30 ml-1">
                    <p className="text-[var(--text-muted)] leading-relaxed">{faq.answer}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-12 pt-8 border-t border-[var(--border)]">
          <p className="text-[var(--text-muted)]">
            Still have questions?{" "}
            <a
              href="https://cal.com/bawarchie"
              className="text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium underline underline-offset-2"
            >
              Schedule a demo
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
