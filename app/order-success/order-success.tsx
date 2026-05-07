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
    status: "pending" | "preparing" | "served" | "cancelled" | "refunded";
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
        positive: "bg-emerald-50 text-emerald-800 border-emerald-200",
        neutral: "bg-[#86A6DE]/10 text-[#324F7B] border-[#86A6DE]/30",
        negative: "bg-red-50 text-red-700 border-red-200",
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
            <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-8 text-center">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-stone-900 mb-1">Thank you for your feedback</h3>
                <p className="text-stone-500 text-sm mb-4">Your review helps us improve.</p>
                {aiResult && (
                    <div className={`inline-flex flex-col items-center gap-2 px-5 py-3 rounded-2xl border text-sm ${sentimentColors[aiResult.label] || "bg-stone-100 text-stone-700 border-stone-200"}`}>
                        <span className="font-semibold capitalize">{aiResult.label} experience</span>
                        {aiResult.summary && <p className="opacity-80 text-xs">{aiResult.summary}</p>}
                        {aiResult.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 justify-center mt-1">
                                {aiResult.tags.map((tag) => (
                                    <span key={tag} className="bg-white/70 px-2 py-0.5 rounded-full text-xs font-medium">{tag}</span>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-8">
            <h3 className="text-lg font-semibold text-stone-900 mb-1 text-center">How was your experience?</h3>
            <p className="text-stone-500 text-sm text-center mb-6">Your feedback helps the restaurant improve</p>

            <div className="flex justify-center gap-2 mb-5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        onMouseEnter={() => setHovered(star)}
                        onMouseLeave={() => setHovered(0)}
                        onClick={() => setRating(star)}
                        className="transition-transform hover:scale-110"
                        aria-label={`Rate ${star} stars`}
                    >
                        <svg
                            className={`w-9 h-9 transition-colors ${star <= (hovered || rating) ? "text-amber-400" : "text-stone-200"}`}
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                    </button>
                ))}
            </div>

            {rating > 0 && (
                <p className="text-center text-sm font-medium text-stone-600 mb-4">
                    {["", "Poor", "Fair", "Good", "Great", "Excellent!"][rating]}
                </p>
            )}

            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Tell us more… (optional)"
                rows={3}
                className="w-full border border-stone-200 rounded-2xl px-4 py-3 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#86A6DE] resize-none mb-4"
            />

            <button
                onClick={handleSubmit}
                disabled={rating === 0 || submitting}
                className="w-full bg-[#324F7B] hover:bg-[#283f63] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-full transition-colors"
            >
                {submitting ? "Submitting…" : "Submit feedback"}
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
    const [cancelling, setCancelling] = useState(false);

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
            if (loading) setError(err.message || "Failed to load order");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#324F7B]">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-2 border-[#86A6DE]/30 border-t-[#86A6DE] rounded-full animate-spin mb-4" />
                    <p className="text-white/80 text-sm tracking-wide">Loading order…</p>
                </div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#324F7B] p-4">
                <div className="max-w-md w-full">
                    <div className="bg-[#F8F8F8] rounded-3xl shadow-2xl p-8 text-center">
                        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-stone-900 mb-2">Order not found</h2>
                        <p className="text-stone-600 mb-6 text-sm">{error || "Unable to load order details"}</p>
                        <Link href="/" className="inline-block bg-[#324F7B] hover:bg-[#283f63] text-white px-6 py-2.5 rounded-full font-medium text-sm transition-colors">
                            Back to home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    const baseTotal = order.baseTotal || order.items.reduce((sum, item) => sum + item.itemId.price * item.qty, 0);
    const gstAmount = order.gstAmount || 0;
    const platformFee = order.platformFee || 0;
    const finalAmount = order.finalAmount || order.total;

    const canCancel =
        order.status === "pending" &&
        Date.now() - new Date(order.createdAt).getTime() < 5 * 60 * 1000;

    const handleCancelOrder = async () => {
        if (!confirm("Are you sure you want to cancel this order? A refund will be initiated if payment was made.")) return;
        setCancelling(true);
        try {
            const res = await fetch(`/api/orders/${order._id}/cancel`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason: "Cancelled by customer", cancelledBy: "customer" }),
            });
            const data = await res.json();
            if (data.success) {
                setOrder(data.order);
            } else {
                alert(data.error || "Failed to cancel order");
            }
        } catch {
            alert("Failed to cancel order");
        } finally {
            setCancelling(false);
        }
    };

    const getStepStatus = (step: "confirmed" | "preparing" | "served") => {
        if (order.status === "cancelled" || order.status === "refunded") return "pending";
        const statusMap: Record<string, number> = { pending: 0, preparing: 1, served: 2 };
        const stepLevels = { confirmed: 0, preparing: 1, served: 2 };
        const current = statusMap[order.status] ?? 0;
        const stepLevel = stepLevels[step];
        if (current > stepLevel) return "completed";
        if (current === stepLevel) return "active";
        return "pending";
    };

    const handleDownloadReceipt = () => window.print();

    const steps = [
        { key: "confirmed" as const, title: "Order confirmed", subtitle: "We have received your order" },
        { key: "preparing" as const, title: "Preparing", subtitle: "Chef is preparing your food" },
        { key: "served" as const, title: "Served", subtitle: "Enjoy your meal!" },
    ];

    return (
        <div className="min-h-screen bg-[#F8F8F8] py-6 px-4 print-receipt">
            <div className="max-w-3xl mx-auto receipt-content">
                {/* Hero */}
                <div className="bg-[#324F7B] rounded-t-3xl overflow-hidden relative">
                    <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle_at_1px_1px,_white_1px,_transparent_0)] [background-size:24px_24px]" />
                    <div className="relative px-8 py-10 text-white text-center">
                        <div className="w-16 h-16 bg-white/15 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-white/10">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <p className="text-[10px] tracking-[0.3em] text-[#86A6DE] uppercase mb-2">Payment received</p>
                        <h1 className="text-2xl font-serif italic mb-1">Thank you</h1>
                        <p className="text-white/70 text-sm">Your order is on its way</p>
                    </div>
                </div>

                {/* Body */}
                <div className="bg-white border-x border-stone-200">
                    {/* Restaurant */}
                    {order.restaurantId && (
                        <div className="px-8 py-5 text-center border-b border-dashed border-stone-300">
                            <h2 className="text-lg font-semibold text-stone-900">{order.restaurantId.name}</h2>
                            {order.restaurantId.address && (
                                <p className="text-xs text-stone-500 mt-0.5">{order.restaurantId.address}</p>
                            )}
                            {order.restaurantId.phone && (
                                <p className="text-xs text-stone-500">Phone: {order.restaurantId.phone}</p>
                            )}
                        </div>
                    )}

                    {/* Order meta */}
                    <div className="px-8 py-5 border-b border-stone-200">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-[10px] tracking-[0.2em] text-stone-400 uppercase mb-1">Order ID</p>
                                <p className="font-mono text-xs text-stone-700">{order._id.slice(-12)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] tracking-[0.2em] text-stone-400 uppercase mb-1">Date</p>
                                <p className="text-stone-700 text-xs">{formatDate(order.createdAt)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] tracking-[0.2em] text-stone-400 uppercase mb-1">Table</p>
                                <p className="font-semibold text-stone-900 uppercase">{order.tableSlug}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] tracking-[0.2em] text-stone-400 uppercase mb-1">Status</p>
                                <span className="inline-block px-2.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-semibold tracking-wider uppercase">
                                    Paid
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Items */}
                    <div className="px-8 py-5">
                        <h3 className="text-[10px] tracking-[0.2em] text-stone-400 uppercase mb-4">Order items</h3>
                        <div className="space-y-3">
                            {order.items.map((item, index) => (
                                <div key={index} className="flex items-start justify-between py-2 border-b border-stone-100 last:border-0">
                                    <div>
                                        <h4 className="font-medium text-stone-900 text-sm">{item.itemId.name}</h4>
                                        <p className="text-xs text-stone-500 mt-0.5">{item.itemId.category}</p>
                                    </div>
                                    <div className="text-right ml-4">
                                        <p className="text-xs text-stone-500">₹{item.itemId.price} × {item.qty}</p>
                                        <p className="font-semibold text-stone-900 text-sm mt-0.5 tabular-nums">
                                            ₹{(item.itemId.price * item.qty).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bill */}
                    <div className="px-8 py-5 bg-[#F8F8F8] border-t border-dashed border-stone-300">
                        <div className="space-y-2.5">
                            <div className="flex justify-between text-sm">
                                <span className="text-stone-500">Item total</span>
                                <span className="text-stone-800 tabular-nums">₹{baseTotal.toFixed(2)}</span>
                            </div>
                            {order.gstPercentage && order.gstPercentage > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-stone-500">GST ({order.gstPercentage}%)</span>
                                    <span className="text-stone-800 tabular-nums">₹{gstAmount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm">
                                <span className="text-stone-500">Platform fee (2%)</span>
                                <span className="text-stone-800 tabular-nums">₹{platformFee.toFixed(2)}</span>
                            </div>
                            <div className="border-t border-stone-300 pt-3 mt-2 flex justify-between items-baseline">
                                <span className="text-xs uppercase tracking-[0.2em] text-stone-500">Total</span>
                                <span className="text-2xl font-semibold text-[#324F7B] tabular-nums">₹{finalAmount.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Print receipt footer */}
                    <div className="hidden print:block px-8 py-3 text-center text-[10px] text-stone-400 border-t border-dashed border-stone-200">
                        Thank you for dining with us · Powered by Bawarchie
                    </div>

                    {/* Payment ID */}
                    {order.razorpayPaymentId && (
                        <div className="px-8 py-3 bg-[#86A6DE]/10 border-t border-[#86A6DE]/20">
                            <p className="text-[10px] tracking-[0.2em] text-[#324F7B] uppercase mb-0.5">Payment ID</p>
                            <p className="text-[#324F7B] font-mono text-xs">{order.razorpayPaymentId}</p>
                        </div>
                    )}

                    {/* Status timeline */}
                    <div className="px-8 py-6 border-t border-stone-200">
                        <h3 className="text-[10px] tracking-[0.2em] text-stone-400 uppercase mb-5">Order status</h3>
                        <div className="relative space-y-5">
                            <div className="absolute left-[15px] top-3 bottom-3 w-px bg-stone-200" />
                            {steps.map(({ key, title, subtitle }) => {
                                const status = getStepStatus(key);
                                const isDone = status === "completed";
                                const isActive = status === "active";
                                return (
                                    <div key={key} className="flex items-center relative">
                                        <div
                                            className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center mr-4 transition-all ${
                                                isDone
                                                    ? "bg-emerald-500 text-white"
                                                    : isActive
                                                    ? "bg-[#324F7B] text-white ring-4 ring-[#86A6DE]/30 animate-pulse"
                                                    : "bg-white border-2 border-stone-200 text-stone-300"
                                            }`}
                                        >
                                            {isDone ? (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : (
                                                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                            )}
                                        </div>
                                        <div>
                                            <p className={`font-medium text-sm ${status !== "pending" ? "text-stone-900" : "text-stone-400"}`}>
                                                {title}
                                            </p>
                                            <p className="text-xs text-stone-500">{subtitle}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Cancel/Refund banner */}
                {(order.status === "cancelled" || order.status === "refunded") && (
                    <div className="bg-red-50 border-x border-red-100 px-8 py-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-semibold text-red-800 text-sm">
                                    {order.status === "refunded" ? "Cancelled & refunded" : "Cancelled"}
                                </p>
                                <p className="text-xs text-red-600">
                                    {order.status === "refunded"
                                        ? "A refund has been initiated to your payment method."
                                        : "This order has been cancelled."}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action buttons */}
                <div className="bg-white border border-stone-200 border-t-0 px-8 py-5 rounded-b-3xl no-print space-y-3">
                    <button
                        onClick={handleDownloadReceipt}
                        className="w-full flex items-center justify-center gap-2 bg-[#324F7B] hover:bg-[#283f63] text-white font-semibold py-3 rounded-full transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download receipt
                    </button>

                    {canCancel && (
                        <button
                            onClick={handleCancelOrder}
                            disabled={cancelling}
                            className="w-full flex items-center justify-center gap-2 border border-red-300 text-red-700 hover:bg-red-50 font-medium py-3 rounded-full transition-colors disabled:opacity-50"
                        >
                            {cancelling ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                    Cancelling…
                                </>
                            ) : (
                                "Cancel order"
                            )}
                        </button>
                    )}
                </div>

                <div className="mt-5 no-print">
                    <FeedbackSection order={order} />
                </div>

                <div className="mt-5 text-center no-print">
                    <Link
                        href={`/r/${order.restaurantId?.name.toLowerCase().replace(/\s+/g, "-")}/t/${order.tableSlug}`}
                        className="inline-block text-[#324F7B] hover:text-[#5067AA] underline text-sm font-medium"
                    >
                        Order more items
                    </Link>
                </div>
            </div>
        </div>
    );
}
