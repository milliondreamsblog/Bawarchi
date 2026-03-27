"use client"

import { useState } from "react";
import { 
  ChevronDown, ChevronUp, HelpCircle
} from "lucide-react";

export default function FAQsection() {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const faqs = [
    {
      question: "What's included in the ₹79/QR setup?",
      answer: "The one-time ₹79 per QR code fee includes everything to get started: professional QR code printing for each table, complete menu setup in our system, basic dashboard configuration, and initial table setup. You pay only for the QR codes you need."
    },
    {
      question: "What's the difference between ₹299/month and ₹399/month plans?",
      answer: "The ₹199/month plan includes complete digital menu and order management with counter payments. The ₹399/month plan includes everything from ₹299 plan PLUS integrated payment gateway, digital payments, auto billing, and GST calculation."
    },
    {
      question: "Can I try Bawarchie before paying?",
      answer: "Yes! We offer a 7-day free trial for both monthly plans (₹299 and ₹399). No credit card required for the trial. You'll get full access to all features during the trial period."
    },
    {
      question: "How long does setup take?",
      answer: "Typically 24-48 hours for the one-time setup and 1-2 hours for monthly plans. Once you choose a plan, we'll configure your menu, provide QR codes (if applicable), and train your staff. Most restaurants are live within 2 days."
    },
    {
      question: "What happens if I want to cancel?",
      answer: "You can cancel your monthly subscription anytime with no penalties. We don't lock you into long-term contracts. Your data will be available for 30 days after cancellation. The ₹79/QR setup is non-refundable as it covers printing and setup costs."
    },
    {
      question: "Do I need special hardware for any plan?",
      answer: "No special hardware required! All plans work with any smartphone, tablet, or computer. We provide QR codes for the one-time setup plan, and you can use any device to access your dashboard for monthly plans."
    },
    {
      question: "Can I upgrade from ₹299/month to ₹299/month later?",
      answer: "Yes, you can upgrade anytime! Just contact our support team and we'll switch you to the Complete Solution plan. You'll get access to payment gateway and all premium features immediately."
    },
    {
      question: "What payment methods are supported in the ₹399 plan?",
      answer: "The Complete Solution plan (₹399/month) supports all major payment methods through Razorpay: UPI, Credit/Debit Cards, Net Banking, Wallets (Paytm, PhonePe, etc.), and EMI options. The ₹199 plan is designed for counter payments."
    },
    {
      question: "Is there a long-term contract?",
      answer: "No long-term contracts! All monthly plans are month-to-month. You can cancel anytime. We also offer special discounts for annual payments if you choose to commit longer."
    },
    {
      question: "How many QR codes can I get with the one-time setup?",
      answer: "You can order as many QR codes as you need at ₹79 each. Most restaurants order one per table."
    }
  ];

  return (
    <main className="bg-[#0A0F0D] text-white min-h-screen">
      <section id="faq" className="py-20 ">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Frequently Asked Questions</h2>
            <p className="text-gray-400 text-xl">
              Everything you need to know about our pricing plans
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-colors"
              >
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-black/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <HelpCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-lg font-medium text-left">{faq.question}</span>
                  </div>
                  {expandedFAQ === index ? (
                    <ChevronUp className="w-5 h-5 text-green-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                
                {expandedFAQ === index && (
                  <div className="px-6 pb-6 animate-fadeIn">
                    <div className="pl-9 border-l-2 border-green-500/30 ml-1">
                      <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-12 pt-8 border-t border-white/10">
            <p className="text-gray-400">
              Still have questions?{" "}
              <a 
                href="https://cal.com/bawarchie" 
                className="text-green-400 hover:text-green-300 font-medium underline underline-offset-2"
              >
                Schedule a demo
              </a>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}