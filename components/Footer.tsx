import Link from "next/link";
import { ChefHat } from "lucide-react";

export default function Footer() {
    const footerLinks = {
        product: [
            { label: "Features", href: "#features" },
            { label: "Pricing", href: "#pricing" },
            { label: "Live Demo", href: "/demo" },
            { label: "API Docs", href: "/api" },
            { label: "Integrations", href: "/integrations" },
        ],
        company: [
            { label: "About Us", href: "#about" },
            { label: "Our Blog", href: "/blog" },
            { label: "Careers", href: "/careers" },
            { label: "Press Kit", href: "/press" },
            { label: "Contact", href: "/contact" },
        ],
        support: [
            { label: "Help Center", href: "/help" },
            { label: "Documentation", href: "/docs" },
            { label: "System Status", href: "/status" },
            { label: "Privacy Policy", href: "/privacy" },
            { label: "Terms of Service", href: "/terms" },
        ],
        resources: [
            { label: "Case Studies", href: "/cases" },
            { label: "Webinars", href: "/webinars" },
            { label: "Restaurant Guides", href: "/guides" },
            { label: "Industry Reports", href: "/reports" },
            { label: "Partners", href: "/partners" },
        ]
    };

    return (
        <footer className="bg-gradient-to-b from-gray-900 to-gray-950 text-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}></div>
            </div>

            <div className="container max-w-7xl mx-auto px-4 py-16 relative z-10">
                {/* Main Footer Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 mb-12">
                    {/* Brand Section */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                                <ChefHat className="w-8 h-8 text-white" />
                            </div>
                            <span className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                                Bawarchie
                            </span>
                        </div>
                        <p className="text-gray-400 text-lg leading-relaxed mb-6 max-w-md">
                            Revolutionizing restaurant dining through innovative QR technology and seamless digital experiences.
                        </p>

                        {/* Social Links - Updated with Instagram */}
                        <div className="flex space-x-3">
                            {[
                                {
                                    name: "Instagram",
                                    icon: "M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772 4.915 4.915 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm6.5-.25a1.25 1.25 0 0 0-2.5 0 1.25 1.25 0 0 0 2.5 0zM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z",
                                    href: "https://www.instagram.com/bawarchie_/"
                                },
                                {
                                    name: "Twitter",
                                    icon: "M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z",
                                    href: "#"
                                },
                                {
                                    name: "LinkedIn",
                                    icon: "M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z",
                                    href: "#"
                                }
                            ].map((social, index) => (
                                <a
                                    key={index}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-12 h-12 bg-gray-800 hover:bg-gradient-to-r hover:from-green-600 hover:to-emerald-600 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg"
                                    aria-label={social.name}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={social.icon} />
                                    </svg>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Product Links */}
                    <div className="hidden sm:block">
                        <h4 className="font-semibold text-lg mb-6 text-white">Product</h4>
                        <ul className="space-y-3">
                            {footerLinks.product.map((link, index) => (
                                <li key={index}>
                                    <Link
                                        href={link.href}
                                        className="text-gray-400 hover:text-green-400 transition-colors duration-300 text-sm flex items-center group"
                                    >
                                        <span className="w-1 h-1 bg-gray-600 rounded-full mr-3 group-hover:bg-green-400 transition-colors"></span>
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company Links */}
                    <div className="hidden sm:block">
                        <h4 className="font-semibold text-lg mb-6 text-white">Company</h4>
                        <ul className="space-y-3">
                            {footerLinks.company.map((link, index) => (
                                <li key={index}>
                                    <Link
                                        href={link.href}
                                        className="text-gray-400 hover:text-green-400 transition-colors duration-300 text-sm flex items-center group"
                                    >
                                        <span className="w-1 h-1 bg-gray-600 rounded-full mr-3 group-hover:bg-green-400 transition-colors"></span>
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Support & Resources */}
                    <div className="hidden sm:block space-y-8">
                        <div>
                            <h4 className="font-semibold text-lg mb-6 text-white">Support</h4>
                            <ul className="space-y-3">
                                {footerLinks.support.map((link, index) => (
                                    <li key={index}>
                                        <Link
                                            href={link.href}
                                            className="text-gray-400 hover:text-green-400 transition-colors duration-300 text-sm flex items-center group"
                                        >
                                            <span className="w-1 h-1 bg-gray-600 rounded-full mr-3 group-hover:bg-green-400 transition-colors"></span>
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-800 pt-8">
                    <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                        <p className="text-gray-400 text-sm text-center md:text-left">
                            &copy; {new Date().getFullYear()} Bawarchie Technologies. All rights reserved.
                        </p>
                        <div className="flex items-center space-x-6 text-sm text-gray-400">
                            <span>Built with ❤️ for modern restaurants</span>
                            <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                            <span className="hidden sm:block">Made in India</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}