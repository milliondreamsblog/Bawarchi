/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import Button from "./Button";

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
        }, 500);
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group">
            {/* Item Image */}
            {item.image && (
                <div className="w-full h-48 bg-cover bg-center rounded-xl mb-4 group-hover:scale-105 transition-transform duration-300"
                    style={{ backgroundImage: `url(${item.image})` }}
                />
            )}

            {/* Item Header */}
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1 group-hover:text-green-600 transition-colors">
                        {item.name}
                    </h3>
                    {item.category && (
                        <span className="inline-block bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                            {item.category}
                        </span>
                    )}
                </div>
                {item.calories && (
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {item.calories} kcal
                    </span>
                )}
            </div>

            {/* Description */}
            {item.description && (
                <p className="text-gray-600 mb-4 leading-relaxed">{item.description}</p>
            )}

            {/* Price and Add to Cart */}
            <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-green-600">
                    {formatPrice(item.price)}
                </span>

                {onAddToCart && (
                    <Button
                        variant={item.available === false ? "secondary" : "primary"}
                        size="sm"
                        onClick={handleAddClick}
                        disabled={item.available === false || isAdding}
                        className="min-w-[120px]"
                    >
                        {isAdding ? (
                            <div className="flex items-center">
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Added!
                            </div>
                        ) : item.available === false ? (
                            "Unavailable"
                        ) : (
                            <div className="flex items-center">
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Add to Cart
                            </div>
                        )}
                    </Button>
                )}
            </div>
        </div>
    );
}