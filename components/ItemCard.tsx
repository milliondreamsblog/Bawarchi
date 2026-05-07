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
        isVeg?: boolean;
        isVegan?: boolean;
        isGlutenFree?: boolean;
        spiceLevel?: string;
    };
    onAddToCart?: (item: any) => void;
}

export default function ItemCard({ item, onAddToCart }: ItemCardProps) {
    const [isAdding, setIsAdding] = useState(false);
    const formatPrice = (price: number) => `₹${price}`;
    const unavailable = item.available === false;

    const handleAddClick = () => {
        if (!onAddToCart || unavailable) return;
        setIsAdding(true);
        onAddToCart(item);
        setTimeout(() => setIsAdding(false), 700);
    };

    return (
        <article
            className={`group bg-white rounded-2xl border border-stone-200/80 overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgba(50,79,123,0.10)] hover:-translate-y-0.5 hover:border-stone-300 ${
                unavailable ? "opacity-70" : ""
            }`}
        >
            <div className="p-4 flex gap-4">
                {/* Text */}
                <div className="flex-1 min-w-0 flex flex-col">
                    {/* Veg/Non-veg indicator */}
                    <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                        {(item.isVeg || item.isVegan) ? (
                            <span
                                title={item.isVegan ? "Vegan" : "Vegetarian"}
                                className="inline-flex items-center justify-center w-3.5 h-3.5 border border-emerald-700 rounded-sm"
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-700" />
                            </span>
                        ) : (
                            <span
                                title="Non-vegetarian"
                                className="inline-flex items-center justify-center w-3.5 h-3.5 border border-red-700 rounded-sm"
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-red-700" />
                            </span>
                        )}

                        {item.isVegan && (
                            <span className="text-[10px] font-medium text-emerald-700 tracking-wider uppercase">Vegan</span>
                        )}
                        {item.isGlutenFree && (
                            <span className="text-[10px] font-medium text-[#5067AA] tracking-wider uppercase">GF</span>
                        )}
                        {item.spiceLevel && item.spiceLevel !== "mild" && (
                            <span className="text-[10px] font-medium text-red-600 tracking-wider uppercase">
                                {item.spiceLevel === "hot" ? "🌶 Hot" : item.spiceLevel === "medium" ? "🌶 Medium" : item.spiceLevel}
                            </span>
                        )}
                    </div>

                    {/* Name */}
                    <h3 className="font-semibold text-stone-900 text-[15px] leading-snug mb-1 line-clamp-2">
                        {item.name}
                    </h3>

                    {/* Description */}
                    {item.description && (
                        <p className="text-stone-500 text-xs leading-relaxed line-clamp-2 mb-3">
                            {item.description}
                        </p>
                    )}

                    {/* Price + Add */}
                    <div className="flex items-end justify-between mt-auto pt-2">
                        <div className="flex flex-col">
                            <span className="text-base font-semibold text-[#324F7B] tabular-nums">
                                {formatPrice(item.price)}
                            </span>
                            {item.calories && (
                                <span className="text-[10px] text-stone-400 tracking-wide">
                                    {item.calories} cal
                                </span>
                            )}
                        </div>

                        {onAddToCart && (
                            <button
                                onClick={handleAddClick}
                                disabled={unavailable || isAdding}
                                className={`px-4 py-1.5 rounded-full font-semibold text-xs tracking-wide transition-all duration-200 border ${
                                    unavailable
                                        ? "bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed"
                                        : isAdding
                                        ? "bg-[#324F7B] text-white border-[#324F7B] scale-95"
                                        : "bg-[#324F7B] text-white border-[#324F7B] hover:bg-[#283f63] active:scale-95"
                                }`}
                            >
                                {isAdding ? (
                                    <span className="inline-flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                        Added
                                    </span>
                                ) : unavailable ? (
                                    "Sold out"
                                ) : (
                                    <span className="inline-flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                        </svg>
                                        Add
                                    </span>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* Image */}
                <div className="relative flex-shrink-0">
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-stone-100">
                        {item.image ? (
                            <>
                                <Image
                                    src={item.image}
                                    alt={item.name}
                                    fill
                                    sizes="112px"
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                {unavailable && (
                                    <div className="absolute inset-0 bg-stone-900/50 flex items-center justify-center backdrop-blur-[1px]">
                                        <span className="bg-white text-stone-900 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase">
                                            Sold out
                                        </span>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <svg className="w-10 h-10 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </article>
    );
}
