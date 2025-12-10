/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/Button";
import Image from "next/image";

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const result = await signIn("credentials", {
                email: formData.email,
                password: formData.password,
                redirect: false,
            });

            if (result?.error) {
                if (result.error.includes("pending")) {
                    setError("Your account is pending approval. Please wait for admin approval.");
                } else if (result.error.includes("blocked")) {
                    setError("Your account has been blocked. Please contact support.");
                } else {
                    setError("Invalid email or password");
                }
            } else {
                // Fetch session to get the slug
                const sessionRes = await fetch("/api/auth/session");
                const session = await sessionRes.json();

                if (session?.user?.slug) {
                    router.push(`/admin/${session.user.slug}`);
                    router.refresh();
                } else {
                    // Fallback if slug is missing (shouldn't happen if auth is correct)
                    setError("Login successful but failed to redirect. Please refresh.");
                }
            }
        } catch (err: any) {
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">
            <div className="py-12 px-4">
                <div className="container max-w-md mx-auto">
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-green-600 to-green-700 px-8 py-6 text-white">
                            <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
                            <p className="text-green-100 opacity-90">
                                Sign in to your restaurant dashboard
                            </p>
                        </div>

                        <div className="p-8">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                        placeholder="Enter your email"
                                        value={formData.email}
                                        onChange={(e) =>
                                            setFormData({ ...formData, email: e.target.value })
                                        }
                                        required
                                        disabled={loading}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                        placeholder="Enter your password"
                                        value={formData.password}
                                        onChange={(e) =>
                                            setFormData({ ...formData, password: e.target.value })
                                        }
                                        required
                                        disabled={loading}
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <div className="flex items-center justify-center">
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Signing In...
                                        </div>
                                    ) : (
                                        "Sign In to Dashboard"
                                    )}
                                </Button>
                            </form>

                            <div className="mt-8 pt-6 border-t border-gray-200">
                                <div className="text-center">
                                    <p className="text-gray-600">
                                        Don&apos;t have an account?{" "}
                                        <Link
                                            href="/auth/signup"
                                            className="text-green-600 hover:text-green-700 font-semibold transition-colors"
                                        >
                                            Register your restaurant
                                        </Link>
                                    </p>
                                </div>
                                
                                <div className="mt-4 text-center">
                                    <Link 
                                        href="/" 
                                        className="inline-flex items-center text-sm text-gray-500 hover:text-green-600 transition-colors"
                                    >
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                        </svg>
                                        Back to home
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div className="bg-white rounded-lg p-4 border border-gray-100">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <h4 className="font-semibold text-sm text-gray-900">Secure Access</h4>
                            <p className="text-xs text-gray-600">Your data is protected</p>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-gray-100">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h4 className="font-semibold text-sm text-gray-900">Fast Dashboard</h4>
                            <p className="text-xs text-gray-600">Quick order management</p>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-gray-100">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h4 className="font-semibold text-sm text-gray-900">Real-time Updates</h4>
                            <p className="text-xs text-gray-600">Live order tracking</p>
                        </div>
                    </div>

                    {/* Demo Access Note */}
                    <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                        <div className="flex items-center justify-center mb-2">
                            <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h4 className="font-semibold text-blue-900">Want to see a demo?</h4>
                        </div>
                        <p className="text-blue-700 text-sm mb-3">
                            Explore our platform with a live demo menu
                        </p>
                        <Link 
                            href="/t/table-1" 
                            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                            View Demo Menu
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}