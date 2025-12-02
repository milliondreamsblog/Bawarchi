import { DollarSign, CheckCircle } from "lucide-react";
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
            <div className="text-5xl font-bold mb-2">₹1,299</div>
            <p className="text-gray-500 mb-8">Everything included</p>
            
            <ul className="space-y-3 mb-8">
              {["QR Code Printing", "Menu Setup", "Dashboard Setup", "Staff Onboarding", "Table Setup"].map((item, index) => (
                <li key={index} className="flex items-center gap-3 text-gray-400">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Monthly Maintenance - Featured */}
          <div className="p-8 bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-2 border-green-500/30 rounded-3xl relative">
            {/* <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-green-600 text-white text-xs font-bold rounded-full">
              MOST POPULAR
            </div> */}
            
            <h3 className="text-lg text-gray-400 mb-2">Monthly Subscription</h3>
            <div className="text-5xl font-bold mb-2">₹699<span className="text-lg text-gray-400">/month</span></div>
            <p className="text-gray-500 mb-8">All-inclusive service</p>
            
            <ul className="space-y-3 mb-8">
              {["Server Hosting", "Feature Updates", "Admin Dashboard", "Customer Support", "Menu & Table Management", "Real-time Order Dashboard"].map((item, index) => (
                <li key={index} className="flex items-center gap-3 text-gray-400">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            
            <Link 
              href="https://cal.com/aditya-yadav"
              className="block w-full text-center py-3.5 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-500 transition-all"
            >
              Get Started
            </Link>
          </div>

          {/* Transaction Fees */}
          <div className="p-8 bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-3xl">
            <h3 className="text-lg text-gray-400 mb-2">Transaction Processing</h3>
            <div className="text-5xl font-bold mb-2">1.5 - 2.5%</div>
            <p className="text-gray-500 mb-8">per transaction</p>
            
            <ul className="space-y-3">
              {["Razorpay MDR Included", "Automation Charges", "Payment Verification", "Fraud Protection"].map((item, index) => (
                <li key={index} className="flex items-center gap-3 text-gray-400">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-400">
            <span className="text-green-400 font-semibold">7-day free trial</span> • No setup fee for first 20 restaurants • Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
}