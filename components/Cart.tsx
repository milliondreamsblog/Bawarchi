"use client";

import React from "react";
import { useCartStore } from "@/lib/store/useCartStore";

export default function Cart() {
    const { items, updateQuantity, removeItem, getBillingBreakdown, gstPercentage } = useCartStore();
    const billingBreakdown = getBillingBreakdown();

    const formatPrice = (price: number) => `₹${price.toFixed(2)}`;

    if (items.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Cart is Empty</h3>
                <p className="text-gray-600">Add some delicious items to get started!</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center mb-6">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Your Order</h3>
            </div>

            <div className="space-y-4">
                {items.map((item) => (
                    <div
                        key={item.itemId}
                        className="flex justify-between items-center pb-4 border-b border-gray-200 last:border-b-0"
                    >
                        <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">{item.name}</h4>
                            <p className="text-sm text-gray-600">
                                {formatPrice(item.price)} × {item.qty}
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Quantity Controls */}
                            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                                <button
                                    onClick={() => updateQuantity(item.itemId, item.qty - 1)}
                                    className="w-8 h-8 rounded-lg bg-white hover:bg-gray-200 flex items-center justify-center font-bold text-gray-700 transition-colors shadow-sm"
                                >
                                    −
                                </button>
                                <span className="w-8 text-center font-semibold text-gray-900">{item.qty}</span>
                                <button
                                    onClick={() => updateQuantity(item.itemId, item.qty + 1)}
                                    className="w-8 h-8 rounded-lg bg-white hover:bg-gray-200 flex items-center justify-center font-bold text-gray-700 transition-colors shadow-sm"
                                >
                                    +
                                </button>
                            </div>

                            {/* Remove Button */}
                            <button
                                onClick={() => removeItem(item.itemId)}
                                className="w-8 h-8 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Billing Breakdown */}
            <div className="mt-6 space-y-3 border-t border-gray-100 pt-4">
                <div className="flex justify-between text-gray-600">
                    <span>Item Total</span>
                    <span>{formatPrice(billingBreakdown?.baseTotal ?? 0)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                    <span>GST ({billingBreakdown?.gstPercentage ?? 0}%)</span>
                    <span>{formatPrice(billingBreakdown?.gstAmount ?? 0)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                    <span>Platform Fee</span>
                    <span>{formatPrice(billingBreakdown?.platformFee ?? 0)}</span>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <div>
                        <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                        <p className="text-xs text-gray-500">{items.length} item{items.length !== 1 ? 's' : ''}</p>
                    </div>
                    <span className="text-2xl font-bold text-green-600">
                        {formatPrice(billingBreakdown?.finalAmount ?? 0)}
                    </span>
                </div>
            </div>
        </div>
    );
}