/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import Image from "next/image";

interface ItemCardProps {
    item: {
        _id: string;
        name: string;
        description?: string;
        price: number;
        category?: string;
        calories?: number;
        image?: string;
        available?: boolean;
    };
    onAddToCart?: (item: any) => void;
}

export default function ItemCard({ item, onAddToCart }: ItemCardProps) {
    const [isAdding, setIsAdding] = useState(false);
    const formatPrice = (price: number) => `₹${price}`;

    const handleAddClick = async () => {
        if (!onAddToCart) return;

        setIsAdding(true);
        onAddToCart(item);

        setTimeout(() => {
            setIsAdding(false);
        }, 600);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
            <div className="p-4">
                <div className="flex gap-4">
                    {/* Left: Text Content */}
                    <div className="flex-1 min-w-0">
                        {/* Item Name */}
                        <h3 className="font-semibold text-gray-900 text-base mb-1.5 line-clamp-1">
                            {item.name}
                        </h3>

                        {/* Description */}
                        {item.description && (
                            <p className="text-gray-600 text-sm leading-relaxed line-clamp-2 mb-4">
                                {item.description}
                            </p>
                        )}

                        {/* Price and Calories */}
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="text-lg font-bold text-gray-900">
                                    {formatPrice(item.price)}
                                </span>
                                {item.calories && (
                                    <span className="ml-2 text-sm text-gray-500">
                                        • {item.calories} cal
                                    </span>
                                )}
                            </div>

                            {/* Add Button - Now on the same row */}
                            {onAddToCart && (
                                <button
                                    onClick={handleAddClick}
                                    disabled={item.available === false || isAdding}
                                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${item.available === false
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : isAdding
                                                ? 'bg-emerald-500 text-white'
                                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                        }`}
                                >
                                    {isAdding ? (
                                        <span className="flex items-center gap-1.5">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Added
                                        </span>
                                    ) : item.available === false ? (
                                        'Out of Stock'
                                    ) : (
                                        <span className="flex items-center gap-1.5">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                            </svg>
                                            ADD
                                        </span>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Right: Image */}
                    <div className="relative flex-shrink-0">
                        <div className="relative w-24 h-24 rounded-lg overflow-hidden">
                            {item.image ? (
                                <>
                                    <Image
                                        src={item.image}
                                        alt={item.name}
                                        className="w-full h-full object-cover"
                                        width={96}
                                        height={96}
                                    />
                                    {item.available === false && (
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                            <span className="bg-gray-800/90 text-white px-2 py-1 rounded text-xs font-medium">
                                                Unavailable
                                            </span>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                    <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}