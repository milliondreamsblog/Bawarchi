"use client"

import { useState } from "react";
import { 
  ChevronDown, ChevronUp, HelpCircle
} from "lucide-react";

export default function FAQsection() {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const faqs = [
    {
      question: "What's included in the ₹1,299 setup fee?",
      answer: "Everything you need to get started: QR code printing for all tables, complete menu setup in our system, dashboard configuration, staff training, and table management setup. No hidden charges."
    },
    {
      question: "Can I try Bawarchie before paying?",
      answer: "Yes! We offer a 7-day free trial of our monthly plan. No credit card required for the trial. You'll get full access to all features during the trial period."
    },
    {
      question: "How long does setup take?",
      answer: "Typically 24-48 hours. Once you sign up, we'll schedule a setup call, configure your menu, print and ship QR codes, and train your staff. Most restaurants are live within 2 days."
    },
    {
      question: "What happens if I want to cancel?",
      answer: "You can cancel your monthly subscription anytime. We don't lock you into long-term contracts. Your data will be available for 30 days after cancellation."
    },
    {
      question: "Do you provide hardware or just software?",
      answer: "We provide QR codes (printed on durable material) and the complete software platform. You can use any tablet or computer for your dashboard - no special hardware required."
    },
    {
      question: "What payment methods do you support?",
      answer: "We support all major payment methods through Razorpay: UPI, Credit/Debit Cards, Net Banking, Wallets (Paytm, PhonePe, etc.), and EMI options."
    }
  ];

  return (
    <main className="bg-[#0A0F0D] text-white min-h-screen">
      <section id="faq" className="py-20 ">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Frequently Asked Questions</h2>
            <p className="text-gray-400 text-xl">
              Everything you need to know about our pricing
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <div className="flex items-center gap-4">
                    <HelpCircle className="w-5 h-5 text-green-400" />
                    <span className="text-lg font-medium">{faq.question}</span>
                  </div>
                  {expandedFAQ === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                
                {expandedFAQ === index && (
                  <div className="px-6 pb-6">
                    <div className="pl-9">
                      <p className="text-gray-400">{faq.answer}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}