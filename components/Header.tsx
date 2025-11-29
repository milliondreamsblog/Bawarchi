"use client"

import Link from "next/link";
import { useState } from "react";
import { ChefHat } from "lucide-react";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-100 py-4 sticky top-0 z-50 shadow-sm">
      <div className="container max-w-6xl mx-auto px-4 flex justify-between items-center">

        {/* Logo and Brand */}
        <Link href="/" className="flex items-center space-x-2">
          <ChefHat className="w-8 h-8 text-green-600" />
          <span className="text-xl font-bold text-gray-900">
            Bawarchie
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex space-x-8">
          <Link 
            href="#features" 
            className="text-gray-600 hover:text-green-600 transition-colors font-medium"
          >
            Features
          </Link>
          <Link 
            href="#about" 
            className="text-gray-600 hover:text-green-600 transition-colors font-medium"
          >
            About
          </Link>
          <Link 
            href="#pricing" 
            className="text-gray-600 hover:text-green-600 transition-colors font-medium"
          >
            Pricing
          </Link>
        </div>

        {/* Desktop & Mobile Auth Buttons */}
        <div className="flex items-center space-x-4">
          {/* Book a Call Button - Visible on all screens */}
          <Link 
            href="https://cal.com/aditya-yadav" 
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-md hover:shadow-lg text-sm md:text-base md:px-6 md:py-2"
          >
            Book a call
          </Link>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden flex flex-col justify-center items-center w-8 h-8 space-y-1.5"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className={`block w-6 h-0.5 bg-gray-600 transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
            <span className={`block w-6 h-0.5 bg-gray-600 transition-all duration-300 ${isMenuOpen ? 'opacity-0' : ''}`}></span>
            <span className={`block w-6 h-0.5 bg-gray-600 transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden bg-white border-t border-gray-100 transition-all duration-300 overflow-hidden ${isMenuOpen ? 'max-h-64 py-4' : 'max-h-0'}`}>
        <div className="container max-w-6xl mx-auto px-4 flex flex-col space-y-4">
          <Link 
            href="#features" 
            className="text-gray-600 hover:text-green-600 transition-colors font-medium py-2"
            onClick={() => setIsMenuOpen(false)}
          >
            Features
          </Link>
          <Link 
            href="#about" 
            className="text-gray-600 hover:text-green-600 transition-colors font-medium py-2"
            onClick={() => setIsMenuOpen(false)}
          >
            About
          </Link>
          <Link 
            href="#pricing" 
            className="text-gray-600 hover:text-green-600 transition-colors font-medium py-2"
            onClick={() => setIsMenuOpen(false)}
          >
            Pricing
          </Link>
          
          {/* Mobile Book a Call Button */}
          <div className="pt-2 border-t border-gray-100">
            <Link 
              href="https://cal.com/aditya-yadav" 
              className="block w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-md hover:shadow-lg text-center"
              onClick={() => setIsMenuOpen(false)}
            >
              Book a call
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}