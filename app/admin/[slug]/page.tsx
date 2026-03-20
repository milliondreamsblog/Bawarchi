/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect, useParams } from "next/navigation";
import Link from "next/link";

export default function RestaurantDashboardPage() {
    const { data: session, status } = useSession();
    const params = useParams();
    const slug = params.slug as string;
    const [restaurant, setRestaurant] = useState<any>(null);
    const [stats, setStats] = useState({
        ordersToday: 0,
        totalItems: 0,
        totalTables: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === "authenticated") {
            fetchRestaurant();
            fetchStats();
        }
    }, [status, slug]);

    const fetchRestaurant = async () => {
        try {
            const res = await fetch(`/api/restaurant/by-slug/${slug}`);
            const data = await res.json();
            if (data.success) {
                setRestaurant(data.restaurant);
            }
        } catch (error) {
            console.error("Failed to fetch restaurant:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await fetch(`/api/restaurant/stats/${slug}`);
            const data = await res.json();
            if (data.success) {
                setStats(data.stats);
            }
        } catch (error) {
            console.error("Failed to fetch stats:", error);
        }
    };

    if (status === "loading" || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-white">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (!session || !restaurant) {
        return null;
    }

    const quickActions = [
        {
            href: `/admin/${slug}/items`,
            title: "Manage Items",
            description: "Add, edit, or remove menu items",
            icon: (
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                </div>
            )
        },
        {
            href: `/admin/${slug}/menu`,
            title: "Build Menu",
            description: "Organize items into menu sections",
            icon: (
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                </div>
            )
        },
        {
            href: `/admin/${slug}/tables`,
            title: "Manage Tables",
            description: "Create tables and generate QR codes",
            icon: (
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                </div>
            )
        },
        {
            href: `/admin/${slug}/orders`,
            title: "View Orders",
            description: "Track incoming orders in real-time",
            icon: (
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                </div>
            )
        },
        {
            href: `/admin/${slug}/kitchen`,
            title: "Kitchen Display",
            description: "Live order queue for kitchen staff",
            icon: (
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
                    </svg>
                </div>
            )
        },
        {
            href: `/admin/${slug}/analytics`,
            title: "Analytics",
            description: "Revenue, top items & peak hours",
            icon: (
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                </div>
            )
        },
        {
            href: `/admin/${slug}/settings`,
            title: "Settings",
            description: "Configure payments and details",
            icon: (
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </div>
            )
        },
    ];

    return (
        <div>
            {/* Welcome Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Welcome back, {restaurant.owner}!
                </h1>
                <p className="text-lg text-gray-600">
                    Manage your restaurant <strong className="text-green-600">{restaurant.name}</strong> from this dashboard.
                </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.ordersToday}</p>
                            <p className="text-sm text-gray-600">Today&apos;s Orders</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalItems}</p>
                            <p className="text-sm text-gray-600">Menu Items</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mr-4">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalTables}</p>
                            <p className="text-sm text-gray-600">Active Tables</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quickActions.map((action, index) => (
                    <Link
                        key={index}
                        href={action.href}
                        className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:border-green-200 group"
                    >
                        <div className="flex items-center gap-4">
                            {action.icon}
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-green-600 transition-colors">
                                    {action.title}
                                </h3>
                                <p className="text-sm text-gray-600">
                                    {action.description}
                                </p>
                            </div>
                            <div className="text-gray-400 group-hover:text-green-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}