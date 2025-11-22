/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect } from "react";
import { useCartStore } from "@/lib/store/useCartStore";
import Button from "./Button";

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
    const { items, total, clearCart } = useCartStore();
    const [loading, setLoading] = React.useState(false);

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

        setLoading(true);

        try {
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
                name: "OrderByQR",
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
                    color: "#059669", // Green color matching the theme
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
        <Button
            variant="success"
            size="lg"
            onClick={handlePayment}
            disabled={loading || items.length === 0}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300"
        >
            {loading ? (
                <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing Payment...
                </div>
            ) : (
                <div className="flex items-center justify-center">
                    <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Pay ₹{total}
                </div>
            )}
        </Button>
    );
}