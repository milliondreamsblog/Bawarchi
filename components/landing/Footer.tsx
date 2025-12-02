import { Phone, MapPinHouse } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function Footer() {
    return (
        <footer className="relative py-12 border-t border-white/10 bg-black">
            <div className="container max-w-7xl mx-auto px-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
                    {/* Brand Section */}
                    <div className="lg:col-span-2">
                        <Link href="/" className="inline-flex items-center mb-6">
                            <div className="relative h-10 w-40">
                                <Image
                                    src="/logo-11.webp"
                                    alt="Bawarchie Logo"
                                    height={40}
                                    width={160}
                                    className="object-contain relative -top-18 right-8"
                                    priority
                                />
                            </div>
                        </Link>
                        <p className="text-gray-400 text-sm mb-6 max-w-md">
                            Revolutionizing restaurant industry with cutting-edge QR ordering solutions
                        </p>
                        <p className="text-gray-600 text-xs">
                            Made with ❤️ for restaurant owners
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-white font-semibold mb-6 text-lg">Quick Links</h4>
                        <ul className="space-y-2">
                            <li><Link href="#how-it-works" className="text-gray-400 hover:text-green-400 transition-colors text-sm block py-1">How it Works</Link></li>
                            <li><Link href="#pricing" className="text-gray-400 hover:text-green-400 transition-colors text-sm block py-1">Pricing</Link></li>
                            <li><Link href="#testimonials" className="text-gray-400 hover:text-green-400 transition-colors text-sm block py-1">Testimonials</Link></li>
                            <li><Link href="#faq" className="text-gray-400 hover:text-green-400 transition-colors text-sm block py-1">FAQ</Link></li>
                        </ul>
                    </div>

                    {/* Contact Section */}
                    <div>
                        <h4 className="text-white font-semibold mb-6 text-lg">Contact Us</h4>
                        <ul className="space-y-4 text-sm text-gray-400">
                            <li className="flex items-start gap-3">
                                <Phone className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <a href="tel:+918318365594" className="hover:text-green-400 transition-colors">+91 8318365594</a> <b>, </b>
                                    <a href="tel:+919129601109" className="hover:text-green-400 transition-colors">+91 9129601109</a>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <svg className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <a href="mailto:adityaproworks@gmail.com" className="hover:text-green-400 transition-colors">adityaproworks@gmail.com</a>
                            </li>
                            <li className="flex items-start gap-3">
                                <MapPinHouse className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                                <span>Awas Vikas - 3, Kalyanpur, Kanpur Nagar - 208018, Uttar Pradesh, India</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-white/10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-gray-500 text-sm text-center md:text-left">
                            © {new Date().getFullYear()} Bawarchie. All rights reserved.
                        </p>
                        <div className="text-center md:text-right">
                            <p className="text-gray-600 text-xs">
                                Transforming dining experiences, one QR code at a time.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}