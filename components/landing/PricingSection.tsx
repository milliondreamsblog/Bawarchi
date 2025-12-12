import { DollarSign, CheckCircle, Star } from "lucide-react";
import Link from "next/link";

export default function PricingSection() {
  return (
    <section id="pricing" className="relative py-24 overflow-hidden">
      <div className="container max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-6">
            <DollarSign className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-green-400">TRANSPARENT PRICING</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Simple, All-Inclusive Pricing</h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            No hidden charges. Everything you need to get started
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* One-Time Setup */}
          <div className="p-8 bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-3xl">
            <h3 className="text-lg text-gray-400 mb-2">One-Time Setup</h3>
            <div className="text-5xl font-bold mb-2">₹50<span className="text-lg text-gray-400">/QR</span></div>
            <p className="text-gray-500 mb-8">Basic QR menu only</p>
            
            <ul className="space-y-3 mb-8">
              {["QR Code Printing", "Menu Setup", "Basic Dashboard", "Staff Onboarding", "Table Setup"].map((item, index) => (
                <li key={index} className="flex items-center gap-3 text-gray-400">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Monthly without Payment Gateway - Featured */}
          <div className="p-8 bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-2 border-green-500/30 rounded-3xl relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-green-600 text-white text-xs font-bold rounded-full flex items-center gap-1">
              <Star className="w-3 h-3 fill-white" />
              MOST POPULAR
            </div>
            
            <h3 className="text-lg text-gray-400 mb-2">Digital Menu</h3>
            <div className="text-5xl font-bold mb-2">₹199<span className="text-lg text-gray-400">/month</span></div>
            <p className="text-gray-500 mb-8">Full menu + order management</p>
            
            <ul className="space-y-3 mb-8">
              {["Complete Menu System", "Order Management", "Real-time Dashboard", "Staff Management", "Analytics", "Customer Feedback"].map((item, index) => (
                <li key={index} className="flex items-center gap-3 text-gray-400">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Complete Solution with Payment Gateway */}
          <div className="p-8 bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-3xl">
            <h3 className="text-lg text-gray-400 mb-2">Complete Solution</h3>
            <div className="text-5xl font-bold mb-2">₹299<span className="text-lg text-gray-400">/month</span></div>
            <p className="text-gray-500 mb-8">Everything + payment gateway</p>
            
            <ul className="space-y-3 mb-8">
              {["Everything in Digital Menu", "Payment Gateway", "Auto Billing", "Digital Payments", "GST Calculation", "Priority Support"].map((item, index) => (
                <li key={index} className="flex items-center gap-3 text-gray-400">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Single CTA Button in Center */}
        <div className="text-center mt-12">
          <Link 
            href="https://cal.com/bawarchie"
            className="inline-flex items-center gap-2 px-8 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-500 transition-all text-lg"
          >
            I want this!
          </Link>
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-400">
            <span className="text-green-400 font-semibold">Special offer for first 20 restaurants</span> • Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
}