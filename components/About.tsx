export default function AboutSection() {
  const stats = [
    { value: "500+", label: "Restaurants Partnered" },
    { value: "50K+", label: "Daily Orders Processed" },
    { value: "99.8%", label: "System Uptime" },
    { value: "24/7", label: "Customer Support" },
  ];

  const benefits = [
    "Reduce ordering time by up to 60%",
    "Cut operational costs by 40%",
    "Increase table turnover rate significantly",
    "Real-time order tracking and management",
    "Comprehensive analytics dashboard",
    "Multi-language menu support",
    "Customizable menu management system",
    "Integrated secure payment solutions"
  ];

  return (
    <section id="about" className="relative py-16 md:py-24 bg-gradient-to-br from-white to-green-50/50 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-72 h-72 bg-green-100/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-100/20 rounded-full blur-3xl"></div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            {/* Section Header */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-green-200 rounded-full px-4 py-2 shadow-sm">
                <span className="text-sm font-medium text-green-700">Our Story</span>
              </div>
              
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900">
                About <span className="text-transparent bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text">Bawarchie</span>
              </h2>
              
              <div className="space-y-4">
                <p className="text-lg text-gray-600 leading-relaxed">
                  We're revolutionizing the restaurant industry by providing cutting-edge QR-based ordering solutions that bridge the gap between traditional dining experiences and modern technology.
                </p>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Founded with a vision to transform dining experiences, our mission is to help restaurants streamline operations, reduce costs, and provide exceptional customer experiences through innovative technology.
                </p>
              </div>
            </div>
            
            {/* Enhanced Stats Grid */}
            <div className="grid grid-cols-2 gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="group text-center sm:text-left p-4 rounded-xl hover:bg-white/50 transition-all duration-300">
                  <div className="text-2xl sm:text-3xl font-bold text-transparent bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Content - Enhanced Benefits Card */}
          <div className="relative">
            <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-green-100/50 hover:shadow-2xl transition-all duration-500">
              <div className="space-y-2 mb-8">
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Why Choose Us?
                </h3>
                <p className="text-gray-600 text-sm">Experience the difference with our comprehensive solution</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3 group">
                    <div className="w-6 h-6 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-300 border border-green-200">
                      <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-700 text-sm leading-relaxed">
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>
        
            </div>
            
            {/* Decorative Element */}
            <div className="absolute -top-4 -right-4 w-8 h-8 bg-green-500/10 rounded-full blur-sm"></div>
            <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-emerald-500/10 rounded-full blur-sm"></div>
          </div>
        </div>
      </div>
    </section>
  );
}