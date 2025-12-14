"use client"

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X, QrCode } from "lucide-react";
import Image from "next/image";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isDemoModalOpen || isMenuOpen) {
      // Prevent scrollbar shift by adding padding when modal opens
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '0px';
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '0px';
    };
  }, [isDemoModalOpen, isMenuOpen]);

  const handleDemoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsMenuOpen(false);
    setIsDemoModalOpen(true);
  };

  return (
    <>
      {/* Main Navigation Bar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
          ? 'bg-[#0A0F0D]/95 backdrop-blur-md border-b border-green-900/20 py-3'
          : 'bg-transparent py-4'
        }`}>
        <div className="container max-w-7xl mx-auto px-4 flex justify-between items-center">

          {/* Logo Only - Larger and Clean */}
          <Link href="/" className="flex items-center group">
            <div className="relative h-12 transition-transform duration-200">
              <Image
                src="/logoBawa.png"
                alt="Bawarchie Logo"
                height={100}
                width={100}
                className="relative -top-8 right-10"
                priority
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            <Link
              href="#how-it-works"
              className="px-4 py-2 text-gray-300 hover:text-green-400 rounded-lg transition-colors duration-200 font-medium text-sm hover:bg-white/5"
            >
              How it Works
            </Link>
            <Link
              href="#pricing"
              className="px-4 py-2 text-gray-300 hover:text-green-400 rounded-lg transition-colors duration-200 font-medium text-sm hover:bg-white/5"
            >
              Pricing
            </Link>
            <Link
              href="#testimonials"
              className="px-4 py-2 text-gray-300 hover:text-green-400 rounded-lg transition-colors duration-200 font-medium text-sm hover:bg-white/5"
            >
              Testimonials
            </Link>

            <Link
              href="#faq"
              className="px-4 py-2 text-gray-300 hover:text-green-400 rounded-lg transition-colors duration-200 font-medium text-sm hover:bg-white/5"
            >
              FAQ
            </Link>
            {/* Divider */}
            <div className="w-px h-6 bg-green-900/30 mx-3"></div>

            {/* Demo Button */}
            <button
              onClick={handleDemoClick}
              className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-lg hover:from-green-500 hover:to-emerald-400 transition-all duration-200 font-medium text-sm shadow-lg shadow-green-900/30 hover:shadow-green-800/50 flex items-center gap-2"
            >
              <QrCode className="w-4 h-4" />
              Demo QR
            </button>
          </div>

          {/* Mobile & Tablet Header */}
          <div className="flex items-center space-x-3 lg:hidden">
            {/* Demo Button */}
            <button
              onClick={handleDemoClick}
              className="px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-lg hover:from-green-500 hover:to-emerald-400 transition-all duration-200 font-medium text-sm shadow-lg shadow-green-900/30 flex items-center gap-2"
            >
              <QrCode className="w-4 h-4" />
              Demo QR
            </button>

            {/* Mobile Menu Button */}
            <button
              className={`relative flex items-center justify-center w-10 h-10 rounded-lg border transition-all duration-200 ${isScrolled
                  ? 'border-green-900/30 hover:bg-green-950/30'
                  : 'border-white/10 hover:bg-white/5'
                }`}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? (
                <X className="w-5 h-5 text-green-400" />
              ) : (
                <Menu className="w-5 h-5 text-gray-300" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay - Completely separate from navbar */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[100] bg-[#0A0F0D]">
          {/* Header section with logo and close button */}
          <div className="fixed top-0 left-0 right-0 bg-[#0A0F0D] border-b border-green-900/20 z-[101]">
            <div className="container max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
              {/* Logo */}
              <Link href="/" onClick={() => setIsMenuOpen(false)} className="flex items-center">
                <div className="relative h-12">
                  <Image
                    src="/logoBawa.png"
                    alt="Bawarchie Logo"
                    height={100}
                    width={100}
                    className="relative -top-8 right-10"
                    priority
                  />
                </div>
              </Link>

              {/* Close Button */}
              <button
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-green-900/30 hover:bg-green-950/30 transition-all duration-200"
                onClick={() => setIsMenuOpen(false)}
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-green-400" />
              </button>
            </div>
          </div>

          {/* Menu Content - Scrollable */}
          <div className="pt-20 pb-6 h-full overflow-y-auto">
            <div className="container max-w-7xl mx-auto px-4 h-full flex flex-col">
              {/* Mobile Navigation Links */}
              <div className="space-y-1 py-6">
                <Link
                  href="#how-it-works"
                  className="block px-5 py-3.5 text-gray-300 hover:text-green-400 hover:bg-green-950/30 rounded-lg transition-all duration-200 font-medium text-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  How it Works
                </Link>
                <Link
                  href="#pricing"
                  className="block px-5 py-3.5 text-gray-300 hover:text-green-400 hover:bg-green-950/30 rounded-lg transition-all duration-200 font-medium text-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Pricing
                </Link>
                <Link
                  href="#testimonials"
                  className="block px-5 py-3.5 text-gray-300 hover:text-green-400 hover:bg-green-950/30 rounded-lg transition-all duration-200 font-medium text-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Testimonials
                </Link>
                <Link
                  href="#faq"
                  className="block px-5 py-3.5 text-gray-300 hover:text-green-400 hover:bg-green-950/30 rounded-lg transition-all duration-200 font-medium text-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  FAQ
                </Link>
              </div>

              {/* Mobile CTA Section */}
              <div className="mt-auto pt-6 border-t border-green-900/30">
                <div className="mb-6">
                  <p className="text-gray-400 text-sm mb-4 text-center">
                    Transform your restaurant with our QR ordering system
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={(e) => {
                        setIsMenuOpen(false);
                        handleDemoClick(e);
                      }}
                      className="block w-full px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-lg hover:from-green-500 hover:to-emerald-400 transition-all duration-200 font-medium text-center shadow-lg shadow-green-900/30 flex items-center justify-center gap-2"
                    >
                      <QrCode className="w-5 h-5" />
                      See Demo QR
                    </button>
                    <a
                      href="https://cal.com/bawarchie"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full px-6 py-3 text-green-400 border border-green-800/50 rounded-lg hover:bg-green-950/30 transition-all duration-200 font-medium text-center"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Contact Sales
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Modal - Fixed scrollbar shift */}
      {isDemoModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div 
            className="absolute inset-0" 
            onClick={() => setIsDemoModalOpen(false)}
          ></div>
          
          <div className="relative bg-[#0A0F0D] border border-green-800/30 rounded-xl p-6 max-w-sm w-full shadow-2xl shadow-green-900/20">
            {/* Close Button */}
            <button
              onClick={() => setIsDemoModalOpen(false)}
              className="absolute -top-3 -right-3 bg-[#0A0F0D] border border-green-800/50 rounded-full p-2 hover:bg-green-950/50 transition-colors duration-200 shadow-lg"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-gray-400 hover:text-green-400" />
            </button>

            {/* Modal Content */}
            <div className="text-center mb-4">
              <h3 className="text-xl font-semibold text-green-400 mb-1">Demo QR Code</h3>
              <p className="text-sm text-gray-400">Scan to try our ordering system</p>
            </div>

            {/* QR Image */}
            <div className="bg-white p-4 rounded-lg">
              <Image
                src="/table-1-qr.png"
                alt="Table QR Code"
                width={300}
                height={300}
                className="w-full h-auto"
              />
            </div>

            {/* Footer Text */}
            <p className="text-xs text-center text-gray-500 mt-4">
              Table 1 - Demo Restaurant
            </p>
          </div>
        </div>
      )}
    </>
  );
}