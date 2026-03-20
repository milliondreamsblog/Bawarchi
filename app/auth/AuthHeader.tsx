"use client"

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export default function AdminHeader() {
    const { data: session } = useSession();

    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
            <div className="container max-w-7xl mx-auto flex items-center justify-between py-3 px-6">
                {/* Logo */}
                <Link href="/" className="flex items-center">
                    <div className="relative h-10">
                        <Image
                            src="/logoBawa.png"
                            alt="Bawarchie Logo"
                            height={80}
                            width={80}
                            className="relative -top-6 right-8"
                            priority
                        />
                    </div>
                </Link>

                {/* Right Section */}
                <nav className="bg-white border-b border-gray-100 py-2">
                <div className="container max-w-6xl mx-auto px-4 flex justify-between items-center">
                    <div className="flex space-x-4">
                        <Link href="/auth/signup" className="px-4 py-2 text-gray-700 hover:text-green-600 transition-colors">
                            Register
                        </Link>
                        <Link href="/" className="px-4 py-2 text-gray-700 hover:text-green-600 transition-colors">
                            Home
                        </Link>
                    </div>
                </div>
            </nav>
            </div>
        </header>
    );
}
