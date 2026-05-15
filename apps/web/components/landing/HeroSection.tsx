"use client"

import Link from "next/link";
import { useState, useEffect } from "react";
import { ArrowRight, CheckCircle, TrendingUp, Clock } from "lucide-react";
import Image from "next/image";

export default function HeroSection() {
  const [isVisible, setIsVisible] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setIsVisible(true), []);

  return (
    <section className="relative pt-28 min-h-screen flex items-center overflow-hidden bg-[#0A0F0D] text-white">

      {/* Premium Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-green-500/10 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-emerald-800/10 rounded-full blur-[120px]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      </div>

      <style jsx global>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.3; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 6s infinite ease-in-out;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 6s infinite ease-in-out;
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-25px); }
        }
        .animate-float-delayed {
          animation: float-delayed 6s infinite ease-in-out 1s;
        }
      `}</style>

      <div className="relative z-10 container max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">

        {/* Left Content */}
        <div className={`space-y-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>

          {/* Badges */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Restaurant Count Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-xs font-bold text-green-400 tracking-wider uppercase">50+ Restaurant Alreday Using it</span>
            </div>

            {/* Orynth Badge */}
            <a href="https://orynth.dev/projects/bawarchie" target="_blank" rel="noopener" className="inline-flex">
              <img
                src="https://orynth.dev/api/badge/bawarchie?theme=dark&style=minimal"
                alt="Featured on Orynth"
                className="h-8 w-auto"
              />
            </a>
          </div>

          {/* Headline */}
          <h1 className="text-5xl lg:text-7xl font-bold leading-[1.05] tracking-tight">
            Stop Losing Money on{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-red-500">
              Slow Service
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-gray-400 leading-relaxed max-w-xl">
            Customers order in <span className="text-white font-semibold">30 seconds</span>.
            Payments verified instantly. Zero order mistakes.
            <span className="text-green-400 font-semibold"> All from their phone.</span>
          </p>

          {/* Key Benefits - Clean Cards */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="group p-5 bg-gradient-to-br from-green-500/5 to-transparent border border-green-500/20 rounded-2xl hover:border-green-500/40 transition-all backdrop-blur-sm">
              <TrendingUp className="w-8 h-8 text-green-400 mb-3" />
              <h3 className="text-2xl font-bold text-white mb-1">3x Faster</h3>
              <p className="text-sm text-gray-500">Table Turnover</p>
            </div>

            <div className="group p-5 bg-gradient-to-br from-green-500/5 to-transparent border border-green-500/20 rounded-2xl hover:border-green-500/40 transition-all backdrop-blur-sm">
              <CheckCircle className="w-8 h-8 text-green-400 mb-3" />
              <h3 className="text-2xl font-bold text-white mb-1">100%</h3>
              <p className="text-sm text-gray-500">Order Accuracy</p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Link
              href="https://cal.com/bawarchie"
              className="group relative inline-flex items-center justify-center px-8 py-4 bg-green-600 text-white font-semibold rounded-2xl overflow-hidden transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-green-900/40"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <span className="relative flex items-center gap-2">
                Book Free Demo
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>

            <Link
              href="#pricing"
              className="inline-flex items-center justify-center px-8 py-4 text-gray-300 hover:text-white hover:bg-white/5 rounded-2xl border border-white/10 transition-all font-medium"
            >
              View Pricing
            </Link>
          </div>

          {/* Trust Bar */}
          <div className="flex flex-wrap gap-6 pt-2 text-sm">
            <div className="flex items-center gap-2 text-gray-400">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Setup in 24 hours</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>No app download</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>50+ restaurants</span>
            </div>
          </div>
        </div>

        {/* Right Content - Phone Scene */}
        <div className={`relative md:-right-10 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>

          <div className="relative w-full max-w-[550px] mx-auto h-[600px]">

            {/* Main Phone Mockup */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[560px] bg-[#0F1612] rounded-[3rem] border-8 border-gray-900 shadow-2xl overflow-hidden z-20">

              {/* Phone Screen */}
              <div className="w-full h-full bg-gradient-to-b from-[#0A0F0D] to-[#0F1612] p-6 overflow-hidden">

                {/* Header */}
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 mb-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-green-400 font-semibold">Table 7</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white">Menu</h3>
                </div>

                {/* Menu Items */}
                <div className="space-y-3">
                  {/* Item 1 */}
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-all">
                    <div className="w-14 h-14 rounded-lg flex-shrink-0">
                      <Image
                        src="/paneer-tikka.png"
                        height={200}
                        width={200}
                        alt={"Paneer Tikka"} />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-white">Paneer Tikka</h4>
                      <p className="text-xs text-gray-500">Spicy & Delicious</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-400">₹280</p>
                    </div>
                  </div>

                  {/* Item 2 - Selected */}
                  <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-xl border-2 border-green-500/40 shadow-lg shadow-green-900/20">
                    <div className="w-14 h-14 rounded-lg flex-shrink-0">
                      <Image
                        src="/dal-makhani.png"
                        height={200}
                        width={200}
                        alt={"Dal Makhani"} />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-white">Dal Makhani</h4>
                      <p className="text-xs text-green-400 font-medium">✓ Added to cart</p>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>

                  {/* Item 3 */}
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                    <div className="w-14 h-14 rounded-lg flex-shrink-0">
                      <Image
                        src="/naan.png"
                        height={200}
                        width={200}
                        alt={"naan"} /></div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-white">Garlic Naan</h4>
                      <p className="text-xs text-gray-500">Fresh & Hot</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-400">₹60</p>
                    </div>
                  </div>
                </div>

                {/* Bottom CTA */}
                <div className="absolute bottom-6 left-6 right-6">
                  <button className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl shadow-xl shadow-green-900/30">
                    Place Order!
                  </button>
                </div>
              </div>
            </div>

            {/* Floating Card 3 - Live Stats */}
            <div className="absolute left-4 bottom-12 bg-[#0F1612]/95 backdrop-blur-xl border border-blue-500/40 p-5 rounded-2xl shadow-2xl shadow-blue-900/20 w-48 z-10">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    <p className="text-xs text-gray-500">Avg Order Time</p>
                  </div>
                  <p className="text-3xl font-bold text-blue-400">28s</p>
                </div>
                <div className="pt-3 border-t border-white/10">
                  <p className="text-xs text-gray-500 mb-1">Today&apos;s Orders</p>
                  <p className="text-2xl font-bold text-green-400">47</p>
                </div>
              </div>
            </div>

            {/* Glow Effects */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-green-500/20 via-transparent to-orange-500/10 rounded-full blur-3xl -z-10"></div>
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      {/* <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 20L60 25C120 30 240 40 360 43C480 46 600 42 720 35C840 28 960 18 1080 15C1200 12 1320 16 1380 18L1440 20V60H1380C1320 60 1200 60 1080 60C960 60 840 60 720 60C600 60 480 60 360 60C240 60 120 60 60 60H0V20Z" 
                fill="#111827" 
                fillOpacity="0.5"/>
        </svg>
      </div> */}
    </section>
  );
}