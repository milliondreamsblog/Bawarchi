"use client"

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X, QrCode, Sun, Moon } from "lucide-react";
import Image from "next/image";
import { useTheme } from "@/components/ThemeProvider";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isDemoModalOpen || isMenuOpen) {
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
          ? 'bg-[var(--bg)]/95 backdrop-blur-md border-b border-green-900/20 py-3'
          : 'bg-transparent py-4'
        }`}>
        <div className="container max-w-7xl mx-auto px-4 flex justify-between items-center">

          {/* Logo */}
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
              className="px-4 py-2 text-[var(--text-muted)] hover:text-[var(--accent)] rounded-lg transition-colors duration-200 font-medium text-sm hover:bg-[var(--soft)]"
            >
              How it Works
            </Link>
            <Link
              href="#pricing"
              className="px-4 py-2 text-[var(--text-muted)] hover:text-[var(--accent)] rounded-lg transition-colors duration-200 font-medium text-sm hover:bg-[var(--soft)]"
            >
              Pricing
            </Link>
            <Link
              href="#testimonials"
              className="px-4 py-2 text-[var(--text-muted)] hover:text-[var(--accent)] rounded-lg transition-colors duration-200 font-medium text-sm hover:bg-[var(--soft)]"
            >
              Testimonials
            </Link>

            <Link
              href="#faq"
              className="px-4 py-2 text-[var(--text-muted)] hover:text-[var(--accent)] rounded-lg transition-colors duration-200 font-medium text-sm hover:bg-[var(--soft)]"
            >
              FAQ
            </Link>

            {/* Divider */}
            <div className="w-px h-6 bg-green-900/30 mx-3"></div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--soft)] transition-colors duration-200"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {/* Login Link */}
            <Link
              href="/auth/login"
              className="px-4 py-2 text-[var(--text-muted)] hover:text-[var(--accent)] rounded-lg transition-colors duration-200 font-medium text-sm hover:bg-[var(--soft)]"
            >
              Login
            </Link>

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
          <div className="flex items-center space-x-2 lg:hidden">
            {/* Theme Toggle (mobile) */}
            <button
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--soft)] transition-colors duration-200"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {/* Login Link */}
            <Link
              href="/auth/login"
              className="px-3 py-2.5 text-[var(--text-muted)] hover:text-[var(--accent)] rounded-lg transition-colors duration-200 font-medium text-sm hover:bg-[var(--soft)]"
            >
              Login
            </Link>

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
              className="relative flex items-center justify-center w-10 h-10 rounded-lg border border-[var(--border)] hover:bg-[var(--soft)] transition-all duration-200"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? (
                <X className="w-5 h-5 text-[var(--accent)]" />
              ) : (
                <Menu className="w-5 h-5 text-[var(--text-muted)]" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[100] bg-[var(--bg)]">
          <div className="fixed top-0 left-0 right-0 bg-[var(--bg)] border-b border-green-900/20 z-[101]">
            <div className="container max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
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

              <button
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-[var(--border)] hover:bg-[var(--soft)] transition-all duration-200"
                onClick={() => setIsMenuOpen(false)}
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-[var(--accent)]" />
              </button>
            </div>
          </div>

          <div className="pt-20 pb-6 h-full overflow-y-auto">
            <div className="container max-w-7xl mx-auto px-4 h-full flex flex-col">
              <div className="space-y-1 py-6">
                <Link
                  href="#how-it-works"
                  className="block px-5 py-3.5 text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--soft)] rounded-lg transition-all duration-200 font-medium text-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  How it Works
                </Link>
                <Link
                  href="#pricing"
                  className="block px-5 py-3.5 text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--soft)] rounded-lg transition-all duration-200 font-medium text-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Pricing
                </Link>
                <Link
                  href="#testimonials"
                  className="block px-5 py-3.5 text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--soft)] rounded-lg transition-all duration-200 font-medium text-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Testimonials
                </Link>
                <Link
                  href="#faq"
                  className="block px-5 py-3.5 text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--soft)] rounded-lg transition-all duration-200 font-medium text-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  FAQ
                </Link>
                <Link
                  href="/auth/login"
                  className="block px-5 py-3.5 text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--soft)] rounded-lg transition-all duration-200 font-medium text-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
              </div>

              <div className="mt-auto pt-6 border-t border-green-900/30">
                <div className="mb-6">
                  <p className="text-[var(--text-muted)] text-sm mb-4 text-center">
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
                      className="block w-full px-6 py-3 text-[var(--accent)] border border-green-800/50 rounded-lg hover:bg-[var(--soft)] transition-all duration-200 font-medium text-center"
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

      {/* QR Modal */}
      {isDemoModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[var(--scrim)] backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => setIsDemoModalOpen(false)}
          ></div>

          <div className="relative bg-[var(--surface)] border border-green-800/30 rounded-xl p-6 max-w-sm w-full shadow-2xl shadow-green-900/20">
            <button
              onClick={() => setIsDemoModalOpen(false)}
              className="absolute -top-3 -right-3 bg-[var(--surface)] border border-green-800/50 rounded-full p-2 hover:bg-[var(--soft)] transition-colors duration-200 shadow-lg"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-[var(--text-muted)] hover:text-[var(--accent)]" />
            </button>

            <div className="text-center mb-4">
              <h3 className="text-xl font-semibold text-[var(--accent)] mb-1">Demo QR Code</h3>
              <p className="text-sm text-[var(--text-muted)]">Scan to try our ordering system</p>
            </div>

            <div className="bg-white p-4 rounded-lg">
              <Image
                src="/table-1-qr.png"
                alt="Table QR Code"
                width={300}
                height={300}
                className="w-full h-auto"
              />
            </div>

            <p className="text-xs text-center text-[var(--text-faint)] mt-4">
              Table 1 - Demo Restaurant
            </p>
          </div>
        </div>
      )}
    </>
  );
}
