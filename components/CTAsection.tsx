import Link from "next/link";

export default function CTASection() {
    const restaurantTypes = [
        { 
            name: "Fine Dining", 
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
            )
        },
        { 
            name: "Hotels", 
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            )
        },
        { 
            name: "Cafes", 
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M5 6h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2zm0 0l1-4h12l1 4M7 14v4m10-4v4" />
                </svg>
            )
        },
        { 
            name: "Fast Food", 
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
            )
        },
        { 
            name: "Bakeries", 
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0A2.704 2.704 0 013 15.546M21 12V9a2 2 0 00-2-2h-1.5M3 12V9a2 2 0 012-2h1.5m13.5 0V6a2 2 0 00-2-2h-9a2 2 0 00-2 2v1.5" />
                </svg>
            )
        }
    ];

    return (
        <section className="relative py-20 md:py-28 lg:py-32 overflow-hidden bg-gradient-to-br from-green-50 via-white to-emerald-50/30">
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-green-200/30 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-emerald-300/20 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-72 bg-gradient-to-r from-transparent via-green-100/40 to-transparent"></div>
            </div>

            {/* Content Container */}
            <div className="relative container max-w-6xl mx-auto px-4 text-center">


                {/* Main Heading */}
                <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                    Ready to Transform Your
                    <span className="block mt-4 text-transparent bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text">
                        Restaurant?
                    </span>
                </h2>

                {/* Subheading */}
                <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed font-light">
                    Join <span className="font-semibold text-green-600">500+ restaurants</span> already using Bawarchie to streamline operations, 
                    boost revenue, and deliver exceptional dining experiences.
                </p>

                {/* Enhanced CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-5 justify-center items-center mb-12">
                    <Link
                        href="https://cal.com/aditya-yadav"
                        className="group relative px-12 py-5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl hover:from-green-700 hover:to-emerald-700 transition-all duration-500 font-bold text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-2 hover:scale-105 flex items-center space-x-3 overflow-hidden"
                    >
                        {/* Shine Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                        
                        <span className="relative z-10">I want this!</span>
                        <svg className="w-6 h-6 relative z-10 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </Link>
                    
                    {/* <Link
                        href="/demo"
                        className="group px-12 py-5 border-2 border-gray-300 text-gray-700 rounded-2xl hover:border-green-500 hover:text-green-600 transition-all duration-500 font-semibold text-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transform hover:-translate-y-1 flex items-center space-x-3"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Watch Live Demo</span>
                    </Link> */}
                </div>

            </div>
        </section>
    );
}