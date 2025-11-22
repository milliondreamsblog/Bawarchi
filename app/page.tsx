import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 py-4">
        <div className="container max-w-6xl mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg"></div>
            <span className="text-xl font-bold text-gray-900">OrderBy<span className="text-green-600">QR</span></span>
          </div>
          <div className="hidden md:flex space-x-8">
            <Link href="#features" className="text-gray-600 hover:text-green-600 transition-colors">Features</Link>
            <Link href="#about" className="text-gray-600 hover:text-green-600 transition-colors">About</Link>
            <Link href="#pricing" className="text-gray-600 hover:text-green-600 transition-colors">Pricing</Link>
            {/* <Link href="#contact" className="text-gray-600 hover:text-green-600 transition-colors">Contact</Link> */}
          </div>
          <div className="flex space-x-4">
            <Link href="/auth/login" className="px-4 py-2 text-gray-700 hover:text-green-600 transition-colors">
              Login
            </Link>
            <Link href="/auth/signup" className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-green-50 to-white py-20 px-4">
        <div className="container max-w-6xl mx-auto text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Revolutionize Your
              <span className="text-green-600 block">Dining Experience</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Streamline restaurant operations with QR-powered ordering. 
              Reduce wait times, increase efficiency, and enhance customer satisfaction.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link 
                href="/auth/signup" 
                className="px-8 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
              >
                Start Free Trial
              </Link>
              <Link 
                href="/" 
                className="px-8 py-4 border border-gray-300 rounded-xl text-gray-700 hover:border-green-500 hover:text-green-600 transition-all duration-300 font-semibold"
              >
                Live Demo
              </Link>
            </div>
            <div className="mt-12 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">60%</div>
                <div className="text-sm text-gray-600">Faster Ordering</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">40%</div>
                <div className="text-sm text-gray-600">Cost Reduction</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">95%</div>
                <div className="text-sm text-gray-600">Customer Satisfaction</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-20 bg-white">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Powerful Features</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to transform your restaurant operations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                ),
                title: "QR Code Ordering",
                desc: "Unique QR codes for each table enable instant menu access and ordering"
              },
              {
                icon: (
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                ),
                title: "Secure Payments",
                desc: "Integrated Razorpay payments with multiple payment options"
              },
              {
                icon: (
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                ),
                title: "AI Recommendations",
                desc: "Smart menu suggestions based on customer preferences and trends"
              },
              {
                icon: (
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                ),
                title: "Live Dashboard",
                desc: "Real-time order tracking and comprehensive analytics"
              },
              {
                icon: (
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                ),
                title: "Smart Cart System",
                desc: "Advanced cart management with real-time updates and modifications"
              },
              {
                icon: (
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                ),
                title: "Performance Analytics",
                desc: "Detailed insights into sales, customer behavior, and menu performance"
              }
            ].map((feature, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl border border-gray-100 hover:border-green-200 hover:shadow-lg transition-all duration-300 group">
                {feature.icon}
                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* About Us Section */}
      <div id="about" className="py-20 bg-green-50">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">About OrderByQR</h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                We&apos;re revolutionizing the restaurant industry by providing cutting-edge QR-based ordering solutions. 
                Our platform bridges the gap between traditional dining experiences and modern technology.
              </p>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Founded in 2025, our mission is to help restaurants streamline operations, reduce costs, 
                and provide exceptional customer experiences through innovative technology.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-2xl font-bold text-green-600">500+</div>
                  <div className="text-gray-600">Restaurants</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">50K+</div>
                  <div className="text-gray-600">Daily Orders</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">98%</div>
                  <div className="text-gray-600">Uptime</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">24/7</div>
                  <div className="text-gray-600">Support</div>
                </div>
              </div>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Why Choose Us?</h3>
              <div className="space-y-4">
                {[
                  "Reduce ordering time by up to 60%",
                  "Cut operational costs by 40%",
                  "Increase table turnover rate",
                  "Real-time order tracking",
                  "Comprehensive analytics dashboard",
                  "Multi-language support",
                  "Customizable menu management",
                  "Integrated payment solutions"
                ].map((item, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div id="pricing" className="py-20 bg-white">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose the plan that works best for your restaurant. No hidden fees, no surprises.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "Starter",
                price: "₹2,999",
                period: "per month",
                description: "Perfect for small cafes and restaurants",
                features: [
                  "Up to 10 tables",
                  "Basic menu management",
                  "QR code generation",
                  "Email support",
                  "Basic analytics"
                ],
                popular: false
              },
              {
                name: "Professional",
                price: "₹5,999",
                period: "per month",
                description: "Ideal for growing restaurants",
                features: [
                  "Up to 30 tables",
                  "Advanced menu management",
                  "AI recommendations",
                  "Priority support",
                  "Advanced analytics",
                  "Custom branding",
                  "Multi-language support"
                ],
                popular: true
              },
              {
                name: "Enterprise",
                price: "₹11,999",
                period: "per month",
                description: "For large restaurant chains",
                features: [
                  "Unlimited tables",
                  "Full feature access",
                  "Dedicated account manager",
                  "24/7 phone support",
                  "Custom integrations",
                  "White-label solution",
                  "API access"
                ],
                popular: false
              }
            ].map((plan, index) => (
              <div key={index} className={`relative bg-white rounded-2xl border-2 ${plan.popular ? 'border-green-500 shadow-xl' : 'border-gray-200'} p-8 hover:shadow-lg transition-all duration-300`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600">/{plan.period}</span>
                </div>
                <p className="text-gray-600 mb-6">{plan.description}</p>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center space-x-3">
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link 
                  href="/auth/signup" 
                  className={`w-full block text-center py-3 rounded-lg font-semibold transition-all duration-300 ${
                    plan.popular 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-green-500 to-green-600">
        <div className="container max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Restaurant?
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Join thousands of restaurants already using OrderByQR to streamline their operations and boost revenue.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link 
              href="/auth/signup" 
              className="px-8 py-4 bg-white text-green-600 rounded-xl hover:bg-gray-100 transition-all duration-300 font-semibold shadow-lg"
            >
              Start Free Trial
            </Link>
            <Link 
              href="/" 
              className="px-8 py-4 border border-white text-white rounded-xl hover:bg-green-500 transition-all duration-300 font-semibold"
            >
              Schedule Demo
            </Link>
          </div>
          <p className="text-green-200 text-sm mt-6">No credit card required • 14-day free trial</p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-green-600 rounded-lg"></div>
                <span className="text-xl font-bold">OrderByQR</span>
              </div>
              <p className="text-gray-400">
                Revolutionizing restaurant dining through innovative QR technology.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/demo" className="hover:text-white transition-colors">Demo</Link></li>
                <li><Link href="/api" className="hover:text-white transition-colors">API</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 OrderByQR. All rights reserved. Built with modern technology for modern restaurants.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}