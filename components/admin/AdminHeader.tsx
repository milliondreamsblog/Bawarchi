"use client"

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { LogOut, Menu } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

export default function AdminHeader({ onMenuClick }: { onMenuClick?: () => void }) {
    const { data: session } = useSession();

    return (
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 shadow-sm">
            <div className="container max-w-7xl mx-auto flex items-center justify-between py-3 px-6">
                <div className="flex items-center gap-4">
                    {/* Hamburger Menu - Mobile & Tablet Only */}
                    {onMenuClick && (
                        <button
                            onClick={onMenuClick}
                            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            aria-label="Toggle menu"
                        >
                            <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                        </button>
                    )}

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
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-4">
                    {session?.user && (
                        <div className="hidden sm:block text-sm text-gray-600 dark:text-gray-400">
                            Welcome, <span className="font-medium text-gray-900 dark:text-white">{session?.user?.name}</span>
                        </div>
                    )}

                    <ThemeToggle />

                    <button
                        onClick={() => signOut({ callbackUrl: "/auth/login" })}
                        className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors duration-200 border border-red-200 dark:border-red-800"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="font-medium">Sign Out</span>
                    </button>
                </div>
            </div>
        </header>
    );
}
