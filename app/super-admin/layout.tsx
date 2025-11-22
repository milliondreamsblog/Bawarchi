"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    const navItems = [
        { 
            href: "/super-admin/restaurants", 
            label: "Restaurants", 
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            )
        },
        { 
            href: "/super-admin/overview", 
            label: "Overview", 
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            )
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
                <div className="container max-w-7xl mx-auto flex items-center justify-between py-4 px-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Super Admin</h1>
                        <p className="text-sm text-gray-600">Platform Management Dashboard</p>
                    </div>
                    <Link 
                        href="/" 
                        className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:border-green-500 hover:text-green-600 transition-colors"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Home
                    </Link>
                </div>
            </header>

            <div className="container max-w-7xl mx-auto py-8 px-6">
                <div className="flex gap-8">
                    {/* Sidebar */}
                    <aside className="w-64 shrink-0">
                        <nav className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 space-y-2">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                                        pathname === item.href
                                            ? "bg-green-600 text-white shadow-md"
                                            : "text-gray-700 hover:bg-green-50 hover:text-green-600"
                                    }`}
                                >
                                    <span className="mr-3">{item.icon}</span>
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            ))}
                        </nav>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 min-w-0">{children}</main>
                </div>
            </div>
        </div>
    );
}