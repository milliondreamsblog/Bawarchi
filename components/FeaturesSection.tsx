export default function FeaturesSection() {
    const features = [
        {
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
            ),
            title: "QR Code Ordering",
            desc: "Unique QR codes for each table enable instant menu access and ordering"
        },
        {
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
            ),
            title: "Secure Payments",
            desc: "Integrated Razorpay payments with multiple payment options"
        },
        {
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            ),
            title: "AI Recommendations",
            desc: "Smart menu suggestions based on customer preferences and trends"
        },
        {
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
            title: "Live Dashboard",
            desc: "Real-time order tracking and comprehensive analytics"
        },
        {
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
            title: "Smart Cart System",
            desc: "Advanced cart management with real-time updates and modifications"
        },
        {
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
            ),
            title: "Performance Analytics",
            desc: "Detailed insights into sales, customer behavior, and menu performance"
        }
    ];

    return (
        <section id="features" className="relative py-16 md:py-24 bg-gradient-to-b from-white to-gray-50/30 overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-50 rounded-full blur-3xl opacity-50"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-50 rounded-full blur-3xl opacity-50"></div>
            </div>

            <div className="container max-w-6xl mx-auto px-4 relative z-10">
                {/* Enhanced Section Header */}
                <div className="text-center mb-16 md:mb-20">
                    <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full px-4 py-2 mb-6 shadow-sm">
                        <span className="text-sm font-medium text-gray-700">Why Choose Bawarchie</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Powerful <span className="text-transparent bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text">Features</span>
                    </h2>
                    <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                        Everything you need to transform your restaurant operations and delight your customers
                    </p>
                </div>

                {/* Enhanced Features Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="group relative bg-white/80 backdrop-blur-sm p-6 md:p-8 rounded-2xl border border-gray-100 hover:border-green-200/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
                        >
                            {/* Gradient Border Effect */}
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-500/0 to-emerald-500/0 group-hover:from-green-500/10 group-hover:to-emerald-500/10 transition-all duration-500 -z-10"></div>
                            
                            {/* Icon Container */}
                            <div className="w-14 h-14 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl flex items-center justify-center text-green-600 group-hover:from-green-100 group-hover:to-emerald-100 group-hover:scale-110 transition-all duration-300 mb-6 border border-green-100/50">
                                {feature.icon}
                            </div>
                            
                            {/* Content */}
                            <h3 className="text-xl font-semibold text-gray-900 mb-4 group-hover:text-green-700 transition-colors">
                                {feature.title}
                            </h3>
                            <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                                {feature.desc}
                            </p>
                            
                            {/* Hover Indicator */}
                            <div className="absolute bottom-6 left-8 right-8 h-0.5 bg-gradient-to-r from-transparent via-green-200 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}