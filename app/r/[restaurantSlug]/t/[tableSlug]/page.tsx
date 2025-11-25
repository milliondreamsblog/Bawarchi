/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ItemCard from "@/components/ItemCard";
import Cart from "@/components/Cart";
import RazorpayCheckout from "@/components/RazorpayCheckout";
import { useCartStore } from "@/lib/store/useCartStore";

interface MenuItem {
    _id: string;
    name: string;
    description?: string;
    price: number;
    category?: string;
    calories?: number;
    image?: string;
    available?: boolean;
}

interface MenuSection {
    name: string;
    items: MenuItem[];
}

interface Menu {
    title: string;
    sections: MenuSection[];
}

export default function TableMenuPage() {
    const params = useParams();
    const restaurantSlug = params.restaurantSlug as string;
    const tableSlug = params.tableSlug as string;

    const [menu, setMenu] = useState<Menu | null>(null);
    const [table, setTable] = useState<any>(null);
    const [restaurant, setRestaurant] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showCart, setShowCart] = useState(false);
    const [isHydrated, setIsHydrated] = useState(false);



    // Subscribe to cart store
    const addItem = useCartStore((state) => state.addItem);
    const cartItems = useCartStore((state) => state.items);
    const cartTotal = useCartStore((state) => state.total);
    const setGstPercentage = useCartStore((state) => state.setGstPercentage);
    const {getBillingBreakdown, total} = useCartStore();
    const billingBreakdown = getBillingBreakdown();
    // Manually hydrate the store
    useEffect(() => {
        useCartStore.persist.rehydrate();
        setIsHydrated(true);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Restaurant by Slug
                const restRes = await fetch(`/api/restaurant/by-slug/${restaurantSlug}`);
                const restData = await restRes.json();

                if (!restData.success) {
                    setError("Restaurant not found");
                    setLoading(false);
                    return;
                }

                const rest = restData.restaurant;
                setRestaurant(rest);

                // Set restaurant's GST percentage in cart store
                setGstPercentage(rest.gstPercentage || 0);

                // 2. Fetch Table by Slug (and verify restaurant)
                const tableRes = await fetch(`/api/tables?slug=${tableSlug}`);
                const tableData = await tableRes.json();

                if (!tableData.success || !tableData.tables || tableData.tables.length === 0) {
                    setError("Table not found");
                    setLoading(false);
                    return;
                }

                const foundTable = tableData.tables[0];

                // Verify table belongs to this restaurant
                if (foundTable.restaurantId !== rest._id) {
                    setError("Table does not belong to this restaurant");
                    setLoading(false);
                    return;
                }

                setTable(foundTable);

                // 3. Fetch Menu
                const menuRes = await fetch(`/api/menu?restaurantId=${rest._id}`);
                const menuData = await menuRes.json();

                if (!menuData.success) {
                    setError("Menu not available");
                    return;
                }

                setMenu(menuData.menu);
            } catch (err: any) {
                setError(err.message || "Failed to load menu");
            } finally {
                setLoading(false);
            }
        };

        if (restaurantSlug && tableSlug) {
            fetchData();
        }
    }, [restaurantSlug, tableSlug]);

    const handleAddToCart = (item: MenuItem) => {
        addItem({
            itemId: item._id,
            name: item.name,
            price: item.price,
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-white">
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600">Loading menu...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-white">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 max-w-md mx-4 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Menu</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-white pb-32">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white py-8 px-4 mb-6 shadow-lg">
                <div className="container max-w-6xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">{menu?.title || "Menu"}</h1>
                            <p className="text-lg opacity-90">
                                {restaurant?.name} • Table {table?.tableNumber}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-green-100 text-sm">Scan & Order</p>
                            <p className="text-green-100 text-sm">No Waiting</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Menu Sections */}
            <div className="container max-w-6xl mx-auto px-4">
                {menu?.sections.map((section) => (
                    <div key={section.name} className="mb-12">
                        <div className="flex items-center mb-6">
                            <div className="w-1 h-8 bg-green-600 rounded-full mr-3"></div>
                            <h2 className="text-2xl font-bold text-gray-900">{section.name}</h2>
                            <span className="ml-3 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                                {section.items.length} items
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {section.items.map((item) => (
                                <ItemCard
                                    key={item._id}
                                    item={item}
                                    onAddToCart={handleAddToCart}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Sticky Cart Footer */}
            {isHydrated && cartItems.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white shadow-2xl border-t border-gray-200 p-4 z-50">
                    <div className="container max-w-6xl mx-auto">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <p className="text-sm text-gray-600">
                                    {cartItems.length} item{cartItems.length !== 1 ? "s" : ""} in cart
                                </p>
                                <p className="font-bold text-2xl text-green-600">
                                    ₹{billingBreakdown?.finalAmount}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowCart(!showCart)}
                                className="flex items-center bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                            >
                                {showCart ? (
                                    <>
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                        </svg>
                                        Hide Cart
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        View Cart
                                    </>
                                )}
                            </button>
                        </div>

                        {showCart && (
                            <div className="mb-4 max-h-64 overflow-y-auto bg-gray-50 rounded-xl p-4 border border-gray-200">
                                <Cart />
                            </div>
                        )}

                        <RazorpayCheckout tableSlug={tableSlug} restaurantId={restaurant?._id} />
                    </div>
                </div>
            )}
        </div>
    );
}