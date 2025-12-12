/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ItemCard from "@/components/ItemCard";
import Cart from "@/components/Cart";
import RazorpayCheckout from "@/components/RazorpayCheckout";
import { useCartStore } from "@/lib/store/useCartStore";
import AdminFooter from "@/components/admin/AdminFooter";

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

    // Search and filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [showFilters, setShowFilters] = useState(false);
    const [sortBy, setSortBy] = useState("default");

    // Subscribe to cart store
    const addItem = useCartStore((state) => state.addItem);
    const cartItems = useCartStore((state) => state.items);
    const setGstPercentage = useCartStore((state) => state.setGstPercentage);
    const { getBillingBreakdown } = useCartStore();
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
    }, [restaurantSlug, tableSlug, setGstPercentage]);

    const handleAddToCart = (item: MenuItem) => {
        addItem({
            itemId: item._id,
            name: item.name,
            price: item.price,
        });
    };

    // Get all unique categories
    const categories = ["All", ...new Set(
        menu?.sections.flatMap(s => s.items.map(i => i.category).filter(Boolean)) || []
    )];

    // Filter and search logic
    const getFilteredSections = () => {
        if (!menu) return [];

        return menu.sections.map(section => {
            const filteredItems = section.items.filter(item => {
                const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.description?.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
                return matchesSearch && matchesCategory;
            });

            // Sort items
            if (sortBy === "price-low") {
                filteredItems.sort((a, b) => a.price - b.price);
            } else if (sortBy === "price-high") {
                filteredItems.sort((a, b) => b.price - a.price);
            } else if (sortBy === "calories") {
                filteredItems.sort((a, b) => (a.calories || 0) - (b.calories || 0));
            }

            return { ...section, items: filteredItems };
        }).filter(section => section.items.length > 0);
    };

    const filteredSections = getFilteredSections();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white">
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading menu...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white p-4">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Menu</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-sm"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white">
            {/* Sticky Header */}
            <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
                <div className="container mx-auto px-4 py-4 max-w-7xl">
                    {/* Restaurant Info */}
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{restaurant?.name}</h1>
                            <p className="text-sm text-gray-600">Table {table?.tableNumber}</p>
                        </div>
                        <button
                            onClick={() => setShowCart(!showCart)}
                            className="lg:hidden relative p-3 bg-emerald-500 text-white rounded-xl shadow-md hover:bg-emerald-600 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {cartItems.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                                    {cartItems.length}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative mb-3">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search dishes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
                        />
                    </div>

                    {/* Category Filters */}
                    {/* <div className="flex items-center gap-2 overflow-x-auto pb-2 hide-scrollbar">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            Sort
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                                    selectedCategory === cat
                                        ? 'bg-emerald-500 text-white shadow-sm'
                                        : 'bg-white border border-gray-200 text-gray-700 hover:border-emerald-300'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div> */}

                    {/* Sort Dropdown */}
                    {/* {showFilters && (
                        <div className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Sort by</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                            >
                                <option value="default">Default</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                                <option value="calories">Calories: Low to High</option>
                            </select>
                        </div>
                    )} */}
                </div>
            </div>

            {/* Main Content with Sidebar Layout */}
            <div className="container mx-auto px-4 max-w-7xl">
                <div className="flex gap-6 py-6">
                    {/* Menu Sections - Left Side */}
                    <div className="flex-1 pb-32 lg:pb-6">
                        {filteredSections.length === 0 ? (
                            <div className="text-center py-16">
                                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No items found</h3>
                                <p className="text-gray-600">Try adjusting your search or filters</p>
                            </div>
                        ) : (
                            filteredSections.map((section) => (
                                <div key={section.name} className="mb-10">
                                    <div className="flex items-center gap-3 mb-5">
                                        <h2 className="text-xl font-bold text-gray-900">{section.name}</h2>
                                        <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
                                            {section.items.length}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {section.items.map((item) => (
                                            <ItemCard
                                                key={item._id}
                                                item={item}
                                                onAddToCart={handleAddToCart}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Desktop Cart Sidebar - Right Side */}
                    <div className="hidden lg:block w-[400px] flex-shrink-0">
                        <div className="sticky top-24">
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                                <div className="p-6 border-b border-gray-200">
                                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        Your Order
                                    </h3>
                                </div>
                                <div className="p-6 max-h-[calc(100vh-300px)] overflow-y-auto">
                                    <Cart />
                                </div>
                                {isHydrated && cartItems.length > 0 && (
                                    <div className="p-6 border-t border-gray-200">
                                        <RazorpayCheckout tableSlug={tableSlug} restaurantId={restaurant?._id} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Cart Drawer */}
            {showCart && (
                <div className="lg:hidden fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCart(false)} />
                    <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] overflow-hidden flex flex-col animate-slide-up">
                        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">Your Order</h3>
                            <button onClick={() => setShowCart(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            <Cart />
                        </div>
                        {isHydrated && cartItems.length > 0 && (
                            <div className="p-4 border-t border-gray-200 bg-gray-50">
                                <RazorpayCheckout tableSlug={tableSlug} restaurantId={restaurant?._id} />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Mobile Bottom Bar */}
            {isHydrated && cartItems.length > 0 && (
                <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-2xl z-30">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                            <p className="text-xs text-gray-600 mb-0.5">
                                {cartItems.length} item{cartItems.length !== 1 ? 's' : ''}
                            </p>
                            <p className="text-xl font-bold text-emerald-600">
                                ₹{billingBreakdown?.finalAmount.toFixed(2)}
                            </p>
                        </div>
                        <button
                            onClick={() => setShowCart(true)}
                            className="flex-1 max-w-[200px] bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 rounded-xl font-semibold shadow-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <span>View Cart</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            <AdminFooter />

            <style jsx>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                @keyframes slide-up {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                .animate-slide-up {
                    animation: slide-up 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}