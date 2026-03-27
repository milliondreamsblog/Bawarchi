"use client";

import React from "react";
import { useCartStore } from "@/lib/store/useCartStore";

export default function Cart() {
    const { items, updateQuantity, removeItem, getBillingBreakdown } = useCartStore();
    const billingBreakdown = getBillingBreakdown();

    const formatPrice = (price: number) => `₹${price.toFixed(2)}`;

    if (items.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">Your cart is empty</h3>
                <p className="text-gray-500 text-sm">Add items to get started</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Cart Items */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {items.map((item) => (
                    <div
                        key={item.itemId}
                        className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        {/* Item Info */}
                        <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 text-sm mb-1 truncate">
                                {item.name}
                            </h4>
                            <p className="text-xs text-gray-600 mb-2">
                                {formatPrice(item.price)} × {item.qty}
                            </p>
                            <p className="text-sm font-semibold text-gray-900">
                                {formatPrice(item.price * item.qty)}
                            </p>
                        </div>

                        {/* Controls */}
                        <div className="flex flex-col items-end gap-2">
                            {/* Quantity Controls */}
                            <div className="flex items-center bg-white rounded-lg border border-gray-200 shadow-sm">
                                <button
                                    onClick={() => updateQuantity(item.itemId, Math.max(0, item.qty - 1))}
                                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 transition-colors rounded-l-lg"
                                    aria-label="Decrease quantity"
                                >
                                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                    </svg>
                                </button>
                                <span className="w-10 text-center text-sm font-semibold text-gray-900 border-x border-gray-200">
                                    {item.qty}
                                </span>
                                <button
                                    onClick={() => updateQuantity(item.itemId, item.qty + 1)}
                                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 transition-colors rounded-r-lg"
                                    aria-label="Increase quantity"
                                >
                                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                </button>
                            </div>

                            {/* Remove Button */}
                            <button
                                onClick={() => removeItem(item.itemId)}
                                className="text-xs text-red-600 hover:text-red-700 font-medium transition-colors flex items-center gap-1"
                                aria-label="Remove item"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Remove
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Billing Breakdown */}
            <div className="pt-4 border-t-2 border-gray-200">
                <div className="space-y-2.5">
                    {/* Subtotal */}
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Item Total</span>
                        <span className="font-medium text-gray-900">
                            {formatPrice(billingBreakdown?.baseTotal ?? 0)}
                        </span>
                    </div>
                    
                    {/* GST */}
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                            GST ({billingBreakdown?.gstPercentage ?? 0}%)
                        </span>
                        <span className="font-medium text-gray-900">
                            {formatPrice(billingBreakdown?.gstAmount ?? 0)}
                        </span>
                    </div>
                    
                    {/* Platform Fee */}
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Platform Fee (2%)</span>
                        <span className="font-medium text-gray-900">
                            {formatPrice(billingBreakdown?.platformFee ?? 0)}
                        </span>
                    </div>
                    
                    {/* Divider */}
                    <div className="border-t border-gray-200 my-3"></div>
                    
                    {/* Total */}
                    <div className="flex justify-between items-center pt-1">
                        <span className="font-bold text-gray-900 text-base">Total Amount</span>
                        <span className="text-2xl font-bold text-emerald-600">
                            {formatPrice(billingBreakdown?.finalAmount ?? 0)}
                        </span>
                    </div>

                    {/* Savings Info (if any discount logic exists) */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                        <p className="text-xs text-green-800 flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Bill includes all taxes
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}