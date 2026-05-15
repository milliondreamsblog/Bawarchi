"use client";

import React from "react";
import { useCartStore } from "@/lib/store/useCartStore";

export default function Cart() {
    const { items, updateQuantity, removeItem, getBillingBreakdown } = useCartStore();
    const billingBreakdown = getBillingBreakdown();

    const formatPrice = (price: number) => `₹${price.toFixed(2)}`;

    if (items.length === 0) {
        return (
            <div className="text-center py-10">
                <div className="w-14 h-14 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-7 h-7 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                </div>
                <h3 className="text-sm font-semibold text-stone-900 mb-1">Your cart is empty</h3>
                <p className="text-stone-500 text-xs">Browse the menu and add a few dishes</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Items */}
            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                {items.map((item) => (
                    <div
                        key={item.itemId}
                        className="flex items-center gap-3 py-3 border-b border-stone-200 last:border-0"
                    >
                        <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-stone-900 text-sm truncate">
                                {item.name}
                            </h4>
                            <p className="text-[11px] text-stone-500 mt-0.5">
                                {formatPrice(item.price)} each
                            </p>
                        </div>

                        {/* Qty stepper */}
                        <div className="flex items-center bg-[#324F7B] rounded-full overflow-hidden text-white shadow-sm">
                            <button
                                onClick={() => updateQuantity(item.itemId, Math.max(0, item.qty - 1))}
                                className="w-7 h-7 flex items-center justify-center hover:bg-[#283f63] transition-colors"
                                aria-label="Decrease quantity"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                                </svg>
                            </button>
                            <span className="w-7 text-center text-xs font-semibold tabular-nums">
                                {item.qty}
                            </span>
                            <button
                                onClick={() => updateQuantity(item.itemId, item.qty + 1)}
                                className="w-7 h-7 flex items-center justify-center hover:bg-[#283f63] transition-colors"
                                aria-label="Increase quantity"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                            </button>
                        </div>

                        <div className="w-16 text-right">
                            <p className="text-sm font-semibold text-stone-900 tabular-nums">
                                {formatPrice(item.price * item.qty)}
                            </p>
                            <button
                                onClick={() => removeItem(item.itemId)}
                                className="text-[10px] text-stone-400 hover:text-red-600 mt-0.5 tracking-wide uppercase"
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Bill */}
            <div className="pt-3 border-t border-dashed border-stone-300">
                <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                        <span className="text-stone-500">Item total</span>
                        <span className="font-medium text-stone-800 tabular-nums">
                            {formatPrice(billingBreakdown?.baseTotal ?? 0)}
                        </span>
                    </div>

                    <div className="flex justify-between text-xs">
                        <span className="text-stone-500">
                            GST ({billingBreakdown?.gstPercentage ?? 0}%)
                        </span>
                        <span className="font-medium text-stone-800 tabular-nums">
                            {formatPrice(billingBreakdown?.gstAmount ?? 0)}
                        </span>
                    </div>

                    <div className="flex justify-between text-xs">
                        <span className="text-stone-500">Platform fee (2%)</span>
                        <span className="font-medium text-stone-800 tabular-nums">
                            {formatPrice(billingBreakdown?.platformFee ?? 0)}
                        </span>
                    </div>

                    <div className="flex justify-between items-baseline pt-3 mt-2 border-t border-stone-200">
                        <span className="text-xs uppercase tracking-[0.2em] text-stone-500">Total</span>
                        <span className="text-xl font-semibold text-[#324F7B] tabular-nums">
                            {formatPrice(billingBreakdown?.finalAmount ?? 0)}
                        </span>
                    </div>

                    <p className="text-[10px] text-stone-400 text-right tracking-wide">
                        All taxes included
                    </p>
                </div>
            </div>
        </div>
    );
}
