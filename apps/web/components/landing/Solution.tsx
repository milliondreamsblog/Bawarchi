import { Sparkles, Scan, ShoppingCart, CheckCircle, CreditCard, Settings, BarChart3, TrendingUp } from "lucide-react";

export default function SolutionSection() {
    return (
        <section id="how-it-works" className="relative py-24 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-[#0A0F0D] to-black"></div>

            <div className="container max-w-7xl mx-auto px-6 relative">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-6">
                        <Sparkles className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-medium text-green-400">OUR SOLUTION</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">How Bawarchie Works</h2>
                    <p className="text-xl text-gray-400 max-w-3xl mx-auto">
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
                            color: "green"
                        },
                        {
                            step: "2",
                            title: "Browse & Add Items",
                            description: "Full digital menu with photos, prices. Add items with one tap",
                            icon: ShoppingCart,
                            color: "green"
                        },
                        {
                            step: "3",
                            title: "Place Order",
                            description: "Check quantities, confirm order directly from phone",
                            icon: CheckCircle,
                            color: "green"
                        },
                        {
                            step: "4",
                            title: "Pay Instantly",
                            description: "Payment via UPI/Card/Wallet. Order only sent after successful payment",
                            icon: CreditCard,
                            color: "green"
                        }
                    ].map((step, index) => (
                        <div key={index} className="relative">
                            <div className="p-6 bg-gradient-to-br from-green-500/5 to-transparent border border-green-500/20 rounded-2xl hover:border-green-500/40 transition-all backdrop-blur-sm h-full">
                                <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center mb-4">
                                    <step.icon className="w-7 h-7 text-green-400" />
                                </div>
                                <div className="text-sm text-gray-500 mb-2">Step {step.step}</div>
                                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">{step.description}</p>
                            </div>
                            {index < 3 && (
                                <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gradient-to-r from-green-500/30 to-transparent"></div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Restaurant Side */}
                <div className="mt-24">
                    <div className="text-center mb-12">
                        <h3 className="text-3xl font-bold mb-4">Restaurant Dashboard</h3>
                        <p className="text-gray-400 max-w-2xl mx-auto">
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
                            <div key={index} className="p-6 bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-2xl">
                                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
                                    <feature.icon className="w-6 h-6 text-green-400" />
                                </div>
                                <h4 className="text-xl font-bold mb-4">{feature.title}</h4>
                                <ul className="space-y-3">
                                    {feature.features.map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-gray-400 text-sm">
                                            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
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