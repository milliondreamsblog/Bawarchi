/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect } from "react";
import { useCartStore } from "@/lib/store/useCartStore";

interface RazorpayCheckoutProps {
    tableSlug: string;
    restaurantId: string;
    onSuccess?: () => void;
}

declare global {
    interface Window {
        Razorpay: any;
    }
}

export default function RazorpayCheckout({ tableSlug, restaurantId, onSuccess }: RazorpayCheckoutProps) {
    const { items, total, clearCart, getBillingBreakdown } = useCartStore();
    const [loading, setLoading] = React.useState(false);
    const billingBreakdown = getBillingBreakdown();

    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const handlePayment = async () => {
        if (items.length === 0) {
            alert("Cart is empty!");
            return;
        }

        if (!billingBreakdown) {
            alert("Unable to calculate billing. Please try again.");
            return;
        }

        setLoading(true);

        try {
            // Create payment order with base total (API will calculate full billing)
            const orderResponse = await fetch("/api/payments/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: total, currency: "INR", tableSlug, restaurantId }),
            });

            const orderData = await orderResponse.json();

            if (!orderData.success) {
                throw new Error(orderData.error || "Failed to create order");
            }

            const options = {
                key: orderData.key_id,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "Bawarchie",
                description: `Order for Table ${tableSlug}`,
                order_id: orderData.order_id,
                handler: async function (response: any) {
                    try {
                        const verifyResponse = await fetch("/api/payments/verify", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                tableSlug,
                                restaurantId,
                            }),
                        });

                        const verifyData = await verifyResponse.json();

                        if (verifyData.success) {
                            // Create order with complete billing breakdown
                            const billing = orderData.billingBreakdown;
                            const createOrderResponse = await fetch("/api/orders", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    tableSlug,
                                    restaurantId,
                                    items: items.map((item) => ({
                                        itemId: item.itemId,
                                        qty: item.qty,
                                    })),
                                    total,
                                    razorpayOrderId: response.razorpay_order_id,
                                    razorpayPaymentId: response.razorpay_payment_id,
                                    // Include complete billing breakdown
                                    baseTotal: billing.baseTotal,
                                    gstPercentage: billing.gstPercentage,
                                    gstAmount: billing.gstAmount,
                                    platformFee: billing.platformFee,
                                    finalAmount: billing.finalAmount,
                                    restaurantEarnings: billing.restaurantEarnings,
                                    myEarnings: billing.myEarnings,
                                }),
                            });

                            const orderResult = await createOrderResponse.json();

                            if (orderResult.success) {
                                clearCart();
                                if (onSuccess) {
                                    onSuccess();
                                } else {
                                    window.location.href = `/order-success?orderId=${orderResult.order._id}`;
                                }
                            } else {
                                alert("Order creation failed. Please contact support.");
                            }
                        } else {
                            alert("Payment verification failed!");
                        }
                    } catch (error) {
                        console.error("Payment handler error:", error);
                        alert("Something went wrong. Please try again.");
                    }
                },
                prefill: {
                    name: "",
                    email: "",
                    contact: "",
                },
                theme: {
                    color: "#10b981", // Emerald-500 color
                },
            };

            const razorpayInstance = new window.Razorpay(options);
            razorpayInstance.open();
        } catch (error: any) {
            console.error("Payment error:", error);
            alert(error.message || "Payment failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handlePayment}
            disabled={loading || items.length === 0}
            className={`w-full py-4 rounded-xl font-semibold text-base shadow-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                loading || items.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white hover:shadow-xl active:scale-[0.98]'
            }`}
        >
            {loading ? (
                <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Processing...</span>
                </>
            ) : (
                <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <span>Pay ₹{billingBreakdown?.finalAmount.toFixed(2) || total}</span>
                </>
            )}
        </button>
    );
}