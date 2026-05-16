import { ThumbsUp, Star } from "lucide-react";

export default function TestimonialsSection() {
    return (
        <section id="testimonials" className="relative py-24 bg-gradient-to-b from-[var(--bg)] to-[var(--bg-alt)] text-[var(--text)]">
            <div className="container max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-6">
                        <ThumbsUp className="w-4 h-4 text-[var(--accent)]" />
                        <span className="text-sm font-medium text-[var(--accent)]">TRUSTED BY RESTAURANTS</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">What Restaurant Owners Say</h2>
                    <p className="text-xl text-[var(--text-muted)] max-w-2xl mx-auto">
                        Join 50+ restaurants already transforming their business
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                        {
                            name: "Rajesh Kumar",
                            role: "Owner, Spice Garden",
                            text: "Our table turnover increased by 40% in the first month. Customers love the speed!",
                            rating: 5,
                            improvement: "40% faster turnover"
                        },
                        {
                            name: "Kuldeep Yadav",
                            role: "Manager, Urban Cafe",
                            text: "Zero order mistakes now! The direct-to-kitchen system eliminated all confusion.",
                            rating: 5,
                            improvement: "100% order accuracy"
                        },
                        {
                            name: "Amit Patel",
                            role: "Owner, Quick Bites",
                            text: "Saved ₹2,000 monthly on menu printing alone. Updating prices is now instant.",
                            rating: 5,
                            improvement: "₹2,000 monthly savings"
                        }
                    ].map((testimonial, index) => (
                        <div key={index} className="p-6 bg-[var(--soft)] border border-[var(--border)] rounded-2xl">
                            <div className="flex items-center gap-2 mb-4">
                                {[...Array(testimonial.rating)].map((_, i) => (
                                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                ))}
                            </div>
                            <p className="text-[var(--text-muted)] italic mb-6">&quot;{testimonial.text}&quot;</p>
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-bold">{testimonial.name}</div>
                                    <div className="text-sm text-[var(--text-faint)]">{testimonial.role}</div>
                                </div>
                                <div className="text-sm font-semibold text-[var(--accent)]">{testimonial.improvement}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Stats Bar */}
                <div className="mt-16 p-8 bg-gradient-to-r from-green-500/10 to-emerald-500/5 border border-green-500/20 rounded-3xl">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {[
                            { value: "50+", label: "Restaurants" },
                            { value: "40%", label: "Avg. Revenue Increase" },
                            { value: "100%", label: "Order Accuracy" },
                            { value: "24h", label: "Average Setup" }
                        ].map((stat, index) => (
                            <div key={index} className="text-center">
                                <div className="text-4xl font-bold text-[var(--text)] mb-2">{stat.value}</div>
                                <div className="text-[var(--text-muted)] text-sm">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
