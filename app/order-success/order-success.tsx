/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface OrderItem {
    itemId: {
        _id: string;
        name: string;
        price: number;
        category: string;
    };
    qty: number;
}

interface Order {
    _id: string;
    items: OrderItem[];
    total: number;
    baseTotal?: number;
    gstPercentage?: number;
    gstAmount?: number;
    platformFee?: number;
    finalAmount?: number;
    status: "pending" | "preparing" | "served";
    tableSlug: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    createdAt: string;
    restaurantId?: {
        _id: string;
        name: string;
        address?: string;
        phone?: string;
        email?: string;
    };
}

export default function OrderSuccessPage() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get("orderId");
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAllItems, setShowAllItems] = useState(false);

    useEffect(() => {
        if (orderId) {
            fetchOrder();
            const interval = setInterval(fetchOrder, 5000);
            return () => clearInterval(interval);
        } else {
            setLoading(false);
            setError("No order ID provided");
        }
    }, [orderId]);

    const fetchOrder = async () => {
        try {
            const response = await fetch(`/api/orders/${orderId}`);
            const data = await response.json();

            if (data.success) {
                setOrder(data.order);
            } else {
                setError(data.error || "Failed to load order");
            }
        } catch (err: any) {
            console.error("Failed to poll order:", err);
            if (loading) {
                setError(err.message || "Failed to load order");
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white px-4">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading order details...</p>
                </div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-white px-4">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-8 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Order Not Found</h2>
                        <p className="text-gray-600 mb-6">{error || "Unable to load order details"}</p>
                        <Link href="/" className="block">
                            <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-semibold transition-colors">
                                Back to Home
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-IN', {
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const baseTotal = order.baseTotal || order.items.reduce((sum, item) => sum + (item.itemId.price * item.qty), 0);
    const gstAmount = order.gstAmount || 0;
    const platformFee = order.platformFee || 0;
    const finalAmount = order.finalAmount || order.total;

    const getStatusColor = () => {
        switch (order.status) {
            case 'served': return 'from-emerald-500 to-emerald-600';
            case 'preparing': return 'from-emerald-400 to-emerald-500';
            default: return 'from-emerald-500 to-emerald-600';
        }
    };

    const getStatusProgress = () => {
        switch (order.status) {
            case 'served': return 100;
            case 'preparing': return 66;
            default: return 33;
        }
    };

    const displayedItems = showAllItems ? order.items : order.items.slice(0, 3);

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white py-6 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Success Header */}
                <div className="bg-white rounded-2xl shadow-lg mb-6 overflow-hidden">
                    <div className={`bg-gradient-to-r ${getStatusColor()} px-6 py-8 text-white text-center`}>
                        <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold mb-2">Order Confirmed!</h1>
                        <p className="text-white/90 text-sm mb-3">Your payment was successful</p>
                        <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                            <p className="text-xs font-mono">Order #{order._id.slice(-8).toUpperCase()}</p>
                        </div>
                    </div>

                    {/* Restaurant & Table Info */}
                    {order.restaurantId && (
                        <div className="px-6 py-4 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">{order.restaurantId.name}</h2>
                                    <p className="text-sm text-gray-600">Table {order.tableSlug.toUpperCase()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Status Progress */}
                    <div className="px-6 py-5">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-gray-900">Order Status</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                order.status === 'served' ? 'bg-emerald-100 text-emerald-700' :
                                order.status === 'preparing' ? 'bg-emerald-100 text-emerald-600' :
                                'bg-emerald-100 text-emerald-700'
                            }`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="relative mb-6">
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-emerald-500 transition-all duration-500"
                                    style={{ width: `${getStatusProgress()}%` }}
                                />
                            </div>

                            {/* Status Steps */}
                            <div className="flex justify-between mt-4">
                                <div className="flex flex-col items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                        order.status !== 'pending' ? 'bg-emerald-500 text-white' : 'bg-emerald-500 text-white'
                                    }`}>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <p className="text-xs text-gray-600 mt-2">Confirmed</p>
                                </div>

                                <div className="flex flex-col items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                        order.status === 'served' ? 'bg-emerald-500 text-white' :
                                        order.status === 'preparing' ? 'bg-emerald-500 text-white' :
                                        'bg-gray-200 text-gray-400'
                                    }`}>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                        </svg>
                                    </div>
                                    <p className="text-xs text-gray-600 mt-2">Preparing</p>
                                </div>

                                <div className="flex flex-col items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                        order.status === 'served' ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-400'
                                    }`}>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <p className="text-xs text-gray-600 mt-2">Served</p>
                                </div>
                            </div>
                        </div>

                        {/* Live Status Message */}
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                            <p className="text-xs text-emerald-800 flex items-center gap-2">
                                <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                                    <circle cx="10" cy="10" r="8" />
                                </svg>
                                {order.status === 'served' ? 'Your order has been served. Enjoy your meal!' :
                                 order.status === 'preparing' ? 'Your food is being prepared...' :
                                 'Your order has been confirmed'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Order Items */}
                <div className="bg-white rounded-2xl shadow-lg mb-6 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-900">Order Items</h3>
                        <span className="text-sm text-gray-500">{order.items.length} items</span>
                    </div>

                    <div className="divide-y divide-gray-100">
                        {displayedItems.map((item, index) => (
                            <div key={index} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3 flex-1">
                                    <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <span className="text-emerald-600 font-bold text-sm">{item.qty}×</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-gray-900 text-sm truncate">{item.itemId.name}</h4>
                                        {item.itemId.category && (
                                            <span className={`text-xs ${
                                                item.itemId.category.toLowerCase().includes('veg') && !item.itemId.category.toLowerCase().includes('non')
                                                    ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                                {item.itemId.category}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <p className="font-semibold text-gray-900 ml-4">
                                    ₹{(item.itemId.price * item.qty).toFixed(2)}
                                </p>
                            </div>
                        ))}
                    </div>

                    {order.items.length > 3 && !showAllItems && (
                        <button
                            onClick={() => setShowAllItems(true)}
                            className="w-full px-6 py-3 text-sm text-emerald-600 hover:bg-emerald-50 transition-colors font-medium"
                        >
                            + Show {order.items.length - 3} more items
                        </button>
                    )}

                    {showAllItems && order.items.length > 3 && (
                        <button
                            onClick={() => setShowAllItems(false)}
                            className="w-full px-6 py-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors font-medium"
                        >
                            Show less
                        </button>
                    )}
                </div>

                {/* Bill Summary */}
                <div className="bg-white rounded-2xl shadow-lg mb-6 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-900">Payment Summary</h3>
                    </div>

                    <div className="px-6 py-4 space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Item Total</span>
                            <span className="font-medium text-gray-900">₹{baseTotal.toFixed(2)}</span>
                        </div>

                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">GST ({order.gstPercentage ?? 0}%)</span>
                            <span className="font-medium text-gray-900">₹{gstAmount.toFixed(2)}</span>
                        </div>

                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Platform Fee</span>
                            <span className="font-medium text-gray-900">₹{platformFee.toFixed(2)}</span>
                        </div>

                        <div className="border-t-2 border-gray-200 pt-3 mt-3">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-gray-900">Total Paid</span>
                                <span className="text-2xl font-bold text-emerald-600">₹{finalAmount.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {order.razorpayPaymentId && (
                        <div className="px-6 py-3 bg-emerald-50 border-t border-emerald-100">
                            <p className="text-xs text-emerald-700 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Payment ID: {order.razorpayPaymentId.slice(0, 20)}...
                            </p>
                        </div>
                    )}
                </div>

                {/* Action Button */}
                <Link href={`/r/${order.restaurantId?.name.toLowerCase().replace(/\s+/g, '-')}/t/${order.tableSlug}`}>
                    <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Order More Items
                    </button>
                </Link>

                {/* Help Text */}
                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-500">
                        Status updates automatically every 5 seconds
                    </p>
                </div>
            </div>
        </div>
    );
}