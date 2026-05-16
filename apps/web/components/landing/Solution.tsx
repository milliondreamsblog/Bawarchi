import { Sparkles, Scan, ShoppingCart, CheckCircle, CreditCard, Settings, BarChart3, TrendingUp, Bot, MessageSquareHeart } from "lucide-react";

export default function SolutionSection() {
    return (
        <section id="how-it-works" className="relative py-24 overflow-hidden bg-[var(--bg)] text-[var(--text)]">
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg)] to-[var(--bg-alt)]"></div>

            <div className="container max-w-7xl mx-auto px-6 relative">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-6">
                        <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                        <span className="text-sm font-medium text-[var(--accent)]">OUR SOLUTION</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">How Bawarchie Works</h2>
                    <p className="text-xl text-[var(--text-muted)] max-w-3xl mx-auto">
                        A full QR-based ordering, payment, and order management system
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        {
                            step: "1",
                            title: "Scan QR Code",
                            description: "Customers scan table QR with phone camera — no app, no login",
                            icon: Scan,
                        },
                        {
                            step: "2",
                            title: "Browse & Add Items",
                            description: "Full digital menu with photos, prices. Add items with one tap",
                            icon: ShoppingCart,
                        },
                        {
                            step: "3",
                            title: "Place Order",
                            description: "Check quantities, confirm order directly from phone",
                            icon: CheckCircle,
                        },
                        {
                            step: "4",
                            title: "Pay Instantly",
                            description: "Payment via UPI/Card/Wallet. Order only sent after successful payment",
                            icon: CreditCard,
                        }
                    ].map((step, index) => (
                        <div key={index} className="relative">
                            <div className="p-6 bg-gradient-to-br from-green-500/5 to-transparent border border-green-500/20 rounded-2xl hover:border-green-500/40 transition-all backdrop-blur-sm h-full">
                                <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center mb-4">
                                    <step.icon className="w-7 h-7 text-[var(--accent)]" />
                                </div>
                                <div className="text-sm text-[var(--text-faint)] mb-2">Step {step.step}</div>
                                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                                <p className="text-[var(--text-muted)] text-sm leading-relaxed">{step.description}</p>
                            </div>
                            {index < 3 && (
                                <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gradient-to-r from-green-500/30 to-transparent"></div>
                            )}
                        </div>
                    ))}
                </div>

                {/* AI Layer — thesis pillar: conversational ordering + sentiment feedback */}
                <div className="mt-24">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-4">
                            <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                            <span className="text-sm font-medium text-[var(--accent)]">POWERED BY AI</span>
                        </div>
                        <h3 className="text-3xl font-bold mb-4">The AI Layer Built In</h3>
                        <p className="text-[var(--text-muted)] max-w-2xl mx-auto">
                            More than a digital menu — a conversational waiter and a sentiment-aware feedback loop, included.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                        <div className="p-8 bg-gradient-to-br from-green-500/5 to-transparent border border-green-500/20 rounded-2xl hover:border-green-500/40 transition-all">
                            <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center mb-5">
                                <Bot className="w-7 h-7 text-[var(--accent)]" />
                            </div>
                            <h4 className="text-2xl font-bold mb-3">AI Waiter</h4>
                            <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-5">
                                A GPT-4o-mini waiter that knows the full menu. Customers ask in plain language — &quot;something spicy under ₹300, no paneer&quot; — and it suggests, pairs, and flags allergens in seconds.
                            </p>
                            <ul className="space-y-2">
                                {[
                                    "Allergy & diet-aware suggestions",
                                    "Pairing & combo recommendations",
                                    "Answers in English & Hinglish",
                                ].map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-[var(--text-muted)] text-sm">
                                        <CheckCircle className="w-4 h-4 text-[var(--accent)] flex-shrink-0 mt-0.5" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="p-8 bg-gradient-to-br from-green-500/5 to-transparent border border-green-500/20 rounded-2xl hover:border-green-500/40 transition-all">
                            <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center mb-5">
                                <MessageSquareHeart className="w-7 h-7 text-[var(--accent)]" />
                            </div>
                            <h4 className="text-2xl font-bold mb-3">Smart Feedback</h4>
                            <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-5">
                                Every review is scored for sentiment automatically. Spot unhappy diners before they walk out, and surface what your regulars actually love about your kitchen.
                            </p>
                            <ul className="space-y-2">
                                {[
                                    "Auto sentiment analysis on every review",
                                    "Trends by dish, day, and shift",
                                    "Alerts for negative spikes",
                                ].map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-[var(--text-muted)] text-sm">
                                        <CheckCircle className="w-4 h-4 text-[var(--accent)] flex-shrink-0 mt-0.5" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Restaurant Side */}
                <div className="mt-24">
                    <div className="text-center mb-12">
                        <h3 className="text-3xl font-bold mb-4">Restaurant Dashboard</h3>
                        <p className="text-[var(--text-muted)] max-w-2xl mx-auto">
                            Clean, powerful dashboard to manage everything — menu, orders, performance
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            {
                                title: "Manage Menu Easily",
                                features: [
                                    "Add new items instantly",
                                    "Update prices in seconds",
                                    "Mark items available/unavailable",
                                    "Changes appear immediately"
                                ],
                                icon: Settings
                            },
                            {
                                title: "Track Orders Real-Time",
                                features: [
                                    "Live order tracking",
                                    "Pending → Preparing → Served",
                                    "View daily & past orders",
                                    "Complete order history"
                                ],
                                icon: BarChart3
                            },
                            {
                                title: "Business Insights",
                                features: [
                                    "Today's total orders",
                                    "Manage tables efficiently",
                                    "Peak hour analytics",
                                    "Revenue tracking"
                                ],
                                icon: TrendingUp
                            }
                        ].map((feature, index) => (
                            <div key={index} className="p-6 bg-[var(--soft)] border border-[var(--border)] rounded-2xl">
                                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
                                    <feature.icon className="w-6 h-6 text-[var(--accent)]" />
                                </div>
                                <h4 className="text-xl font-bold mb-4">{feature.title}</h4>
                                <ul className="space-y-3">
                                    {feature.features.map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-[var(--text-muted)] text-sm">
                                            <CheckCircle className="w-4 h-4 text-[var(--accent)] flex-shrink-0 mt-0.5" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
