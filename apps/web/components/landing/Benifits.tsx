import { Target, TrendingUp, Users, Shield, Smartphone, CreditCard, BarChart } from "lucide-react";

export default function BenefitsSection() {
  return (
    <section id="benefits" className="relative py-24 bg-gradient-to-b from-[var(--bg-alt)] to-[var(--bg)] text-[var(--text)]">
      <div className="container max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-6">
            <Target className="w-4 h-4 text-[var(--accent)]" />
            <span className="text-sm font-medium text-[var(--accent)]">BENEFITS FOR RESTAURANTS</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Run Your Restaurant Faster & Smarter</h2>
          <p className="text-xl text-[var(--text-muted)] max-w-3xl mx-auto">
            Boost customer satisfaction and increase revenue without extra staff
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: "Faster Table Turnover",
              description: "Customers order quicker → kitchen starts earlier → tables free up sooner",
              icon: TrendingUp,
              stat: "40% faster"
            },
            {
              title: "Reduce Staff Load",
              description: "No waiter needed for orders or payments. Focus on quality service",
              icon: Users,
              stat: "60% less work"
            },
            {
              title: "Zero Order Mistakes",
              description: "Orders go directly from customer's phone to dashboard",
              icon: Shield,
              stat: "100% accuracy"
            },
            {
              title: "Modern Dining Experience",
              description: "Digital menus → no dirty or outdated printed menus",
              icon: Smartphone,
              stat: "5-star reviews"
            },
            {
              title: "Smooth & Verified Payments",
              description: "All payments online and auto-verified. No cash handling",
              icon: CreditCard,
              stat: "Instant"
            },
            {
              title: "Insights & Data",
              description: "Track daily orders, top-selling items, peak hours, and revenue",
              icon: BarChart,
              stat: "Smart decisions"
            }
          ].map((benefit, index) => (
            <div key={index} className="group p-6 bg-[var(--soft)] border border-[var(--border)] rounded-2xl hover:border-green-500/30 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <benefit.icon className="w-6 h-6 text-[var(--accent)]" />
                </div>
                <span className="text-sm font-semibold text-[var(--accent)]">{benefit.stat}</span>
              </div>
              <h3 className="text-xl font-bold mb-3">{benefit.title}</h3>
              <p className="text-[var(--text-muted)] text-sm leading-relaxed">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
