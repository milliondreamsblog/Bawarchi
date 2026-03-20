/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Button from "@/components/Button";

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

// ── Feedback Section ────────────────────────────────────────
function FeedbackSection({ order }: { order: Order }) {
    const [rating, setRating] = useState(0);
    const [hovered, setHovered] = useState(0);
    const [text, setText] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [aiResult, setAiResult] = useState<{ label: string; tags: string[]; summary: string } | null>(null);

    const sentimentColors: Record<string, string> = {
        positive: "bg-green-100 text-green-700 border-green-200",
        neutral: "bg-yellow-100 text-yellow-700 border-yellow-200",
        negative: "bg-red-100 text-red-700 border-red-200",
    };

    const handleSubmit = async () => {
        if (rating === 0) return;
        setSubmitting(true);
        try {
            const res = await fetch("/api/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    restaurantId: typeof order.restaurantId === "object" ? order.restaurantId._id : order.restaurantId,
                    orderId: order._id,
                    tableSlug: order.tableSlug,
                    rating,
                    text,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setSubmitted(true);
                if (data.feedback?.sentiment?.label) {
                    setAiResult(data.feedback.sentiment);
                }
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Thank you for your feedback!</h3>
                <p className="text-gray-500 text-sm mb-4">Your review helps us improve.</p>
                {aiResult && (
                    <div className={`inline-flex flex-col items-center gap-2 px-5 py-3 rounded-xl border text-sm ${sentimentColors[aiResult.label] || "bg-gray-100 text-gray-700 border-gray-200"}`}>
                        <span className="font-semibold capitalize">{aiResult.label} experience</span>
                        {aiResult.summary && <p className="opacity-80 text-xs">{aiResult.summary}</p>}
                        {aiResult.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 justify-center mt-1">
                                {aiResult.tags.map((tag) => (
                                    <span key={tag} className="bg-white/60 px-2 py-0.5 rounded-full text-xs font-medium">{tag}</span>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-1 text-center">How was your experience?</h3>
            <p className="text-gray-500 text-sm text-center mb-6">Your feedback helps the restaurant improve</p>

            {/* Star rating */}
            <div className="flex justify-center gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        onMouseEnter={() => setHovered(star)}
                        onMouseLeave={() => setHovered(0)}
                        onClick={() => setRating(star)}
                        className="transition-transform hover:scale-125"
                        aria-label={`Rate ${star} stars`}
                    >
                        <svg
                            className={`w-10 h-10 transition-colors ${star <= (hovered || rating) ? "text-yellow-400" : "text-gray-200"}`}
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                    </button>
                ))}
            </div>

            {rating > 0 && (
                <p className="text-center text-sm font-medium text-gray-600 mb-4">
                    {["", "Poor", "Fair", "Good", "Great", "Excellent!"][rating]}
                </p>
            )}

            {/* Optional text */}
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Tell us more... (optional)"
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-300 resize-none mb-4"
            />

            <button
                onClick={handleSubmit}
                disabled={rating === 0 || submitting}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
            >
                {submitting ? "Submitting..." : "Submit Feedback"}
            </button>
        </div>
    );
}
// ── End Feedback Section ─────────────────────────────────────

export default function OrderSuccessPage() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get("orderId");
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (orderId) {
            fetchOrder();
            // Poll for status updates every 5 seconds
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
            // Don't show error on polling failures, just log it
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
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-white">
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600">Loading order details...</p>
                </div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-white">
                <div className="max-w-md w-full mx-4">
                    <div className="bg-white rounded-2xl shadow-2xl border border-red-100 p-8 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
                        <p className="text-gray-600 mb-6">{error || "Unable to load order details"}</p>
                        <Link href="/">
                            <Button className="w-full">Back to Home</Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    // Use saved values if available, otherwise fallback to calculation (for old orders)
    const baseTotal = order.baseTotal || order.items.reduce((sum, item) => sum + (item.itemId.price * item.qty), 0);
    const gstAmount = order.gstAmount || 0;
    const platformFee = order.platformFee || 0;
    const finalAmount = order.finalAmount || order.total;

    // Helper to determine step status
    const getStepStatus = (step: 'confirmed' | 'preparing' | 'served') => {
        const statusMap = {
            pending: 0,
            preparing: 1,
            served: 2
        };
        const currentStatusLevel = statusMap[order.status];

        const stepLevels = {
            confirmed: 0,
            preparing: 1,
            served: 2
        };
        const stepLevel = stepLevels[step];

        if (currentStatusLevel > stepLevel) return 'completed';
        if (currentStatusLevel === stepLevel) return 'active';
        return 'pending';
    };

    const handleDownloadReceipt = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 py-8 px-4 print-receipt">
            <div className="max-w-3xl mx-auto receipt-content">
                {/* Success Header */}
                <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-t-3xl shadow-2xl border border-gray-100 overflow-hidden">
                    <div className="px-8 py-8 text-white text-center">
                        <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-bounce">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
                        <p className="text-green-100">Thank you for your order</p>
                    </div>
                </div>

                {/* Bill/Receipt */}
                <div className="bg-white shadow-2xl border-x border-gray-100">
                    {/* Restaurant Info */}
                    {order.restaurantId && (
                        <div className="border-b border-gray-200 px-8 py-6 text-center bg-gray-50">
                            <h2 className="text-2xl font-bold text-gray-900 mb-1">{order.restaurantId.name}</h2>
                            {order.restaurantId.address && (
                                <p className="text-sm text-gray-600">{order.restaurantId.address}</p>
                            )}
                            {order.restaurantId.phone && (
                                <p className="text-sm text-gray-600">Phone: {order.restaurantId.phone}</p>
                            )}
                        </div>
                    )}

                    {/* Order Info */}
                    <div className="px-8 py-6 border-b border-gray-200">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-600 mb-1">Order ID</p>
                                <p className="font-mono font-semibold text-gray-900 text-xs">{order._id}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-gray-600 mb-1">Date & Time</p>
                                <p className="font-semibold text-gray-900">{formatDate(order.createdAt)}</p>
                            </div>
                            <div>
                                <p className="text-gray-600 mb-1">Table</p>
                                <p className="font-semibold text-gray-900 uppercase">{order.tableSlug}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-gray-600 mb-1">Payment Status</p>
                                <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                    PAID
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Items List */}
                    <div className="px-8 py-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Order Items</h3>
                        <div className="space-y-3">
                            {order.items.map((item, index) => (
                                <div key={index} className="flex justify-between items-start py-3 border-b border-gray-100 last:border-0">
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h4 className="font-semibold text-gray-900">{item.itemId.name}</h4>
                                                <p className="text-sm text-gray-500 mt-0.5">{item.itemId.category}</p>
                                            </div>
                                            <div className="text-right ml-4">
                                                <p className="text-sm text-gray-600">₹{item.itemId.price} × {item.qty}</p>
                                                <p className="font-semibold text-gray-900 mt-1">₹{(item.itemId.price * item.qty).toFixed(2)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bill Summary */}
                    <div className="px-8 py-6 bg-gray-50 border-t-2 border-gray-200">
                        <div className="space-y-3">
                            <div className="flex justify-between text-gray-700">
                                <span>Item Total</span>
                                <span className="font-semibold">₹{baseTotal.toFixed(2)}</span>
                            </div>

                            {order.gstPercentage && order.gstPercentage > 0 && (
                                <div className="flex justify-between text-gray-700">
                                    <span>GST ({order.gstPercentage}%)</span>
                                    <span className="font-semibold">₹{gstAmount.toFixed(2)}</span>
                                </div>
                            )}

                            <div className="flex justify-between text-gray-700">
                                <span>Platform Fee (2%)</span>
                                <span className="font-semibold">₹{platformFee.toFixed(2)}</span>
                            </div>

                            <div className="border-t-2 border-gray-300 pt-3 flex justify-between items-center">
                                <span className="text-xl font-bold text-gray-900">Total Amount</span>
                                <span className="text-2xl font-bold text-green-600">₹{finalAmount.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Print-only receipt footer line */}
                    <div className="hidden print:block px-8 py-3 text-center text-xs text-gray-400 border-t border-dashed border-gray-200">
                        Thank you for dining with us! • Powered by Bawarchie
                    </div>

                    {/* Payment Info */}
                    {order.razorpayPaymentId && (
                        <div className="px-8 py-4 bg-blue-50 border-t border-blue-100">
                            <div className="flex items-center text-sm">
                                <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div className="flex-1">
                                    <p className="text-blue-900 font-medium">Payment ID</p>
                                    <p className="text-blue-700 font-mono text-xs mt-0.5">{order.razorpayPaymentId}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Order Status */}
                    <div className="px-8 py-6 border-t border-gray-200">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            Order Status
                        </h3>
                        <div className="space-y-4 relative">
                            {/* Connecting Line */}
                            <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-200 -z-10"></div>

                            {/* Step 1: Confirmed */}
                            <div className="flex items-center bg-white">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 border-2 ${getStepStatus('confirmed') === 'completed' || getStepStatus('confirmed') === 'active'
                                        ? 'bg-green-600 border-green-600 text-white'
                                        : 'bg-white border-gray-300 text-gray-300'
                                    }`}>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <p className={`font-semibold ${getStepStatus('confirmed') !== 'pending' ? 'text-gray-900' : 'text-gray-400'
                                        }`}>Order Confirmed</p>
                                    <p className="text-xs text-gray-500">We have received your order</p>
                                </div>
                            </div>

                            {/* Step 2: Preparing */}
                            <div className="flex items-center bg-white">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 border-2 ${getStepStatus('preparing') === 'completed' || getStepStatus('preparing') === 'active'
                                        ? 'bg-yellow-500 border-yellow-500 text-white'
                                        : 'bg-white border-gray-300 text-gray-300'
                                    }`}>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <p className={`font-semibold ${getStepStatus('preparing') !== 'pending' ? 'text-gray-900' : 'text-gray-400'
                                        }`}>Preparing</p>
                                    <p className="text-xs text-gray-500">Chef is preparing your food</p>
                                </div>
                            </div>

                            {/* Step 3: Served */}
                            <div className="flex items-center bg-white">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 border-2 ${getStepStatus('served') === 'completed' || getStepStatus('served') === 'active'
                                        ? 'bg-blue-600 border-blue-600 text-white'
                                        : 'bg-white border-gray-300 text-gray-300'
                                    }`}>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <p className={`font-semibold ${getStepStatus('served') !== 'pending' ? 'text-gray-900' : 'text-gray-400'
                                        }`}>Served</p>
                                    <p className="text-xs text-gray-500">Enjoy your meal!</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Download Receipt Button */}
                <div className="bg-white border-t border-gray-200 px-8 py-5 rounded-b-3xl no-print">
                    <button
                        onClick={handleDownloadReceipt}
                        className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 rounded-xl transition-colors shadow-lg"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download Receipt (PDF)
                    </button>
                </div>

                <div className="mt-6 no-print">
                    <FeedbackSection order={order} />
                </div>

                <div className="mt-6 text-center no-print">
                    <Link href={`/r/${order.restaurantId?.name.toLowerCase().replace(/\s+/g, '-')}/t/${order.tableSlug}`}>
                        <Button variant="secondary">Order More Items</Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}