/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function RestaurantDashboardPage() {
    const { data: session, status } = useSession();
    const params = useParams();
    const slug = params.slug as string;
    const [restaurant, setRestaurant] = useState<any>(null);
    const [stats, setStats] = useState({
        ordersToday: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        totalTables: 0,
        totalItems: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === "authenticated") {
            fetchAllData();
        }
    }, [status, slug]);

    const fetchAllData = async () => {
        try {
            // Fetch restaurant data
            const restaurantRes = await fetch(`/api/restaurant/by-slug/${slug}`);
            const restaurantData = await restaurantRes.json();
            
            if (restaurantData.success) {
                setRestaurant(restaurantData.restaurant);
                
                // Fetch orders to calculate stats
                const ordersRes = await fetch(`/api/orders?restaurantId=${restaurantData.restaurant._id}`);
                const ordersData = await ordersRes.json();
                
                // Fetch tables
                const tablesRes = await fetch(`/api/tables?restaurantId=${restaurantData.restaurant._id}`);
                const tablesData = await tablesRes.json();
                
                // Fetch items
                const itemsRes = await fetch(`/api/items?restaurantId=${restaurantData.restaurant._id}`);
                const itemsData = await itemsRes.json();
                
                // Calculate today's date
                const today = new Date();
                const todayString = today.toISOString().split('T')[0];
                
                // Calculate stats
                const orders = ordersData.orders || [];
                const todayOrders = orders.filter((order: any) => 
                    order.createdAt && order.createdAt.startsWith(todayString)
                );
                
                const pendingOrders = orders.filter((order: any) => 
                    order.status === 'pending'
                );
                
                // Calculate total revenue from served/completed orders
                const totalRevenue = orders
                    .filter((order: any) => order.status === 'served' || order.status === 'completed')
                    .reduce((sum: number, order: any) => sum + (order.finalAmount || order.total || 0), 0);
                
                setStats({
                    ordersToday: todayOrders.length,
                    totalRevenue,
                    pendingOrders: pendingOrders.length,
                    totalTables: tablesData.tables?.length || 0,
                    totalItems: itemsData.items?.length || 0
                });
            }
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
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
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600">Please log in to access the dashboard</p>
                </div>
            </div>
        );
    }

    const formatPrice = (price: number) => {
        const amount = price || 0;
        return `₹${amount.toFixed(2)}`;
    };

    const quickActions = [
        {
            href: `/admin/${slug}/orders`,
            title: "View Orders",
            description: "Track incoming orders in real-time",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
            )
        },
        {
            href: `/admin/${slug}/items`,
            title: "Manage Items",
            description: "Add, edit, or remove menu items",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
            )
        },
        {
            href: `/admin/${slug}/tables`,
            title: "Manage Tables",
            description: "Create tables and generate QR codes",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
            )
        },
        {
            href: `/admin/${slug}/menu`,
            title: "Build Menu",
            description: "Organize items into menu sections",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
            )
        },
        {
            href: `/admin/${slug}/settings`,
            title: "Settings",
            description: "Configure payments and details",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            )
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">
            {/* Welcome Header */}
                      <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Welcome back, {restaurant.owner}!
                </h1>
                <p className="text-lg text-gray-600">
                    Manage your restaurant <strong className="text-green-600">{restaurant.name}</strong> from this dashboard.
                </p>
            </div>


            <div className="p-4">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white rounded-xl shadow border border-gray-100 p-4">
                        <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-lg font-bold text-gray-900">{stats.ordersToday}</p>
                                <p className="text-xs text-gray-600">Today&apos;s Orders</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow border border-gray-100 p-4">
                        <div className="flex items-center">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-lg font-bold text-green-600">{formatPrice(stats.totalRevenue)}</p>
                                <p className="text-xs text-gray-600">Total Revenue</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow border border-gray-100 p-4">
                        <div className="flex items-center">
                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-lg font-bold text-gray-900">{stats.pendingOrders}</p>
                                <p className="text-xs text-gray-600">Pending Orders</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow border border-gray-100 p-4">
                        <div className="flex items-center">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-lg font-bold text-gray-900">{stats.totalTables}</p>
                                <p className="text-xs text-gray-600">Active Tables</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 gap-3">
                        {quickActions.map((action, index) => (
                            <Link
                                key={index}
                                href={action.href}
                                className="bg-white rounded-xl shadow border border-gray-100 p-4 hover:shadow-md transition-all hover:border-green-200 group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 group-hover:bg-green-100 group-hover:text-green-600 transition-colors">
                                        {action.icon}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 text-sm mb-1 group-hover:text-green-600 transition-colors">
                                            {action.title}
                                        </h3>
                                        <p className="text-xs text-gray-600">
                                            {action.description}
                                        </p>
                                    </div>
                                    <div className="text-gray-400 group-hover:text-green-600 transition-colors">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Restaurant Info Card */}
                <div className="bg-white rounded-xl shadow border border-gray-100 p-5 mb-6">
                    <div className="flex items-center mb-4">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Restaurant Details</h3>
                    </div>
                    
                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-sm text-gray-600">Restaurant Name</span>
                            <span className="font-medium text-gray-900">{restaurant.name}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-sm text-gray-600">Owner</span>
                            <span className="font-medium text-gray-900">{restaurant.owner || "-"}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-sm text-gray-600">Contact Email</span>
                            <span className="font-medium text-gray-900">{restaurant.email || "-"}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-sm text-gray-600">Restaurant ID</span>
                            <span className="font-medium text-gray-900">{restaurant._id || "-"}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-sm text-gray-600">Menu Items</span>
                            <span className="font-medium text-gray-900">{stats.totalItems}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}