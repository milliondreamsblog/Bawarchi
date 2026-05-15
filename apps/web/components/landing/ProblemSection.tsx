import { AlertCircle, Clock, FileText, XCircle, CreditCard } from "lucide-react";

export default function ProblemSection() {
  return (
    <section id="problem" className="relative py-24 bg-gradient-to-b from-[#0A0F0D] to-black">
      <div className="container max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 mb-6">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-sm font-medium text-red-400">THE PROBLEM</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Running a Restaurant During Peak Hours is Stressful</h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Most delays, errors, and customer complaints happen because customers wait too long for service
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              number: "01",
              title: "Long Wait Times",
              description: "Waiters can't reach every table quickly during busy hours",
              icon: Clock,
              color: "red"
            },
            {
              number: "02",
              title: "Physical Menu Issues",
              description: "Menus get oily, torn, faded. Reprinting costs money",
              icon: FileText,
              color: "orange"
            },
            {
              number: "03",
              title: "Order Mistakes",
              description: "Verbal communication leads to wrong items & food waste",
              icon: XCircle,
              color: "red"
            },
            {
              number: "04",
              title: "Payment Delays",
              description: "UPI screenshots, busy cash counters, long waiting lines",
              icon: CreditCard,
              color: "red"
            }
          ].map((problem, index) => (
            <div key={index} className="group p-6 bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-2xl hover:border-red-500/30 transition-all">
              <div className="text-4xl font-bold text-gray-800 mb-4">{problem.number}</div>
              <div className={`w-12 h-12 rounded-xl bg-${problem.color}-500/10 flex items-center justify-center mb-4`}>
                <problem.icon className={`w-6 h-6 text-${problem.color}-400`} />
              </div>
              <h3 className="text-xl font-bold mb-3">{problem.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{problem.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}