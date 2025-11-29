import Link from "next/link";

export default function HeroSection() {
    const stats = [
        {
            value: "60%",
            label: "Faster Ordering",
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            )
        },
        {
            value: "40%",
            label: "Cost Reduction",
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        {
            value: "95%",
            label: "Customer Satisfaction",
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
            )
        },
    ];

    const restaurantTypes = [
        {
            name: "Fine Dining",
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
            )
        },
        {
            name: "Hotels",
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            )
        },
        {
            name: "Cafes",
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M5 6h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2zm0 0l1-4h12l1 4M7 14v4m10-4v4" />
                </svg>
            )
        },
        {
            name: "Fast Food",
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
            )
        },
        {
            name: "Bakeries",
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0A2.704 2.704 0 013 15.546M21 12V9a2 2 0 00-2-2h-1.5M3 12V9a2 2 0 012-2h1.5m13.5 0V6a2 2 0 00-2-2h-9a2 2 0 00-2 2v1.5" />
                </svg>
            )
        }
    ];

    return (
        <section className="relative bg-gradient-to-br from-green-50 via-white to-emerald-50/70 py-16 md:py-24 px-4 overflow-hidden">
            {/* Premium Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-green-200/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-emerald-300/20 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-72 bg-gradient-to-r from-transparent via-green-100/30 to-transparent"></div>
            </div>

            <div className="container max-w-6xl mx-auto text-center relative z-10">
                <div className="max-w-4xl mx-auto">
                    {/* Premium Badge */}
                    <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-green-200 rounded-full px-4 py-2 mb-8 shadow-sm">
                        <span className="text-sm font-medium text-green-700">Trusted by 500+ restaurants worldwide</span>
                    </div>

                    {/* Enhanced Heading */}
                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                        Revolutionize Your
                        <span className="text-transparent bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text block mt-2">
                            Dining Experience
                        </span>
                    </h1>

                    {/* Refined Subtitle */}
                    <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-10 leading-relaxed max-w-3xl mx-auto font-light">
                        Streamline restaurant operations with our AI-powered QR ordering system.
                        <span className="block mt-2 text-green-700 font-medium">
                            Reduce wait times by 60% • Increase table turnover • Boost customer satisfaction
                        </span>
                    </p>

                    {/* Enhanced CTA Buttons */}
                    {/* <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
                        <Link
                            href="https://cal.com/aditya-yadav"
                            className="group relative px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 min-w-[200px] text-center"
                        >
                            <span className="relative z-10">I want this!</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-green-700 to-emerald-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </Link>
                        <Link
                            href="#features"
                            className="group px-8 py-4 border-2 border-gray-300 rounded-xl text-gray-700 hover:border-green-500 hover:text-green-600 transition-all duration-300 font-semibold bg-white/80 backdrop-blur-sm hover:shadow-lg min-w-[200px] text-center flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Know More
                        </Link>
                    </div> */}
                    
                    {/* Premium Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 max-w-3xl mx-auto">
                        {stats.map((stat, index) => (
                            <div
                                key={index}
                                className="group bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-green-100/50 hover:border-green-200 hover:-translate-y-2"
                            >
                                <div className="text-green-600 mb-3 opacity-80 group-hover:scale-110 transition-transform flex justify-center">
                                    {stat.icon}
                                </div>
                                <div className="text-3xl md:text-4xl font-bold text-transparent bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text mb-2">
                                    {stat.value}
                                </div>
                                <div className="text-sm md:text-base text-gray-600 font-medium tracking-wide">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}