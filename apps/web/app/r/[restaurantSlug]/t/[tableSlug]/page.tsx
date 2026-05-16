/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Sparkles } from "lucide-react";
import ItemCard from "@/components/ItemCard";
import Cart from "@/components/Cart";
import RazorpayCheckout from "@/components/RazorpayCheckout";
import { useCartStore } from "@/lib/store/useCartStore";
import MenuAIChat from "@/components/MenuAIChat";

interface MenuItem {
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
}

type DietFilter = "all" | "veg" | "vegan" | "glutenFree" | "mild";

interface MenuSection {
    name: string;
    items: MenuItem[];
}

interface Menu {
    title: string;
    sections: MenuSection[];
}

const FILTERS: { key: DietFilter; label: string; emoji: string }[] = [
    { key: "all", label: "All", emoji: "🍽️" },
    { key: "veg", label: "Veg", emoji: "🟢" },
    { key: "vegan", label: "Vegan", emoji: "🌱" },
    { key: "glutenFree", label: "Gluten-Free", emoji: "🌾" },
    { key: "mild", label: "Mild", emoji: "🌶️" },
];

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
    const [dietFilter, setDietFilter] = useState<DietFilter>("all");
    const [search, setSearch] = useState("");
    const [activeSection, setActiveSection] = useState<string | null>(null);
    const [dinerId, setDinerId] = useState<string | null>(null);
    const [forYouItems, setForYouItems] = useState<MenuItem[]>([]);
    const [forYouSource, setForYouSource] = useState<"taste" | "popular" | null>(null);
    const [forYouLoading, setForYouLoading] = useState(false);
    const [forYouConfidence, setForYouConfidence] = useState<number>(0);

    const addItem = useCartStore((state) => state.addItem);
    const cartItems = useCartStore((state) => state.items);
    const setGstPercentage = useCartStore((state) => state.setGstPercentage);
    const { getBillingBreakdown } = useCartStore();
    const billingBreakdown = getBillingBreakdown();

    useEffect(() => {
        useCartStore.persist.rehydrate();
        setIsHydrated(true);
    }, []);

    // Pillar 3 §4.1 — Layer A identity resolution. First scan mints a UUID
    // in localStorage; subsequent scans reuse it. Server upserts a Diner row
    // and returns the dinerId we attach to orders downstream. Fire-and-forget
    // — menu still renders if this fails (anonymous fallback).
    useEffect(() => {
        if (typeof window === "undefined") return;
        const KEY = "bawarchie:dinerUuid";
        let uuid = localStorage.getItem(KEY);
        if (!uuid) {
            uuid =
                typeof crypto !== "undefined" && "randomUUID" in crypto
                    ? crypto.randomUUID()
                    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
            localStorage.setItem(KEY, uuid);
        }
        (async () => {
            try {
                const r = await fetch("/api/diner/resolve", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ uuid }),
                });
                // Only parse JSON if the server actually returned JSON; an
                // HTML error page would otherwise crash the page load.
                const ct = r.headers.get("content-type") || "";
                if (!ct.includes("application/json")) return;
                const data = await r.json();
                if (data?.success && data.dinerId) setDinerId(data.dinerId);
            } catch {
                // Anonymous fallback — order will be created without dinerId.
            }
        })();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const restRes = await fetch(`/api/restaurant/by-slug/${restaurantSlug}`);
                const restData = await restRes.json();

                if (!restData.success) {
                    setError("Restaurant not found");
                    setLoading(false);
                    return;
                }

                const rest = restData.restaurant;
                setRestaurant(rest);
                setGstPercentage(rest.gstPercentage || 0);

                const tableRes = await fetch(`/api/tables?slug=${tableSlug}`);
                const tableData = await tableRes.json();

                if (!tableData.success || !tableData.tables || tableData.tables.length === 0) {
                    setError("Table not found");
                    setLoading(false);
                    return;
                }

                const foundTable = tableData.tables[0];
                if (foundTable.restaurantId !== rest._id) {
                    setError("Table does not belong to this restaurant");
                    setLoading(false);
                    return;
                }
                setTable(foundTable);

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

        if (restaurantSlug && tableSlug) fetchData();
    }, [restaurantSlug, tableSlug, setGstPercentage]);

    // Pillar 3 Layer D — "Picked for your taste" feed. Refetches when
    // dinerId resolves so an initial popular-fallback can upgrade to a
    // taste-based recommendation once the resolve call completes.
    useEffect(() => {
        if (!restaurant?._id) return;
        const url = new URL("/api/ai/for-you", window.location.origin);
        url.searchParams.set("restaurantId", restaurant._id);
        if (dinerId) url.searchParams.set("dinerId", dinerId);
        url.searchParams.set("k", "6");
        let cancelled = false;
        setForYouLoading(true);
        fetch(url.toString())
            .then(async (r) => {
                const ct = r.headers.get("content-type") || "";
                if (!ct.includes("application/json")) return null;
                return r.json();
            })
            .then((data) => {
                if (cancelled || !data?.success) return;
                setForYouItems((data.items || []) as MenuItem[]);
                setForYouSource(data.source === "taste" ? "taste" : "popular");
                setForYouConfidence(Number(data.confidence) || 0);
            })
            .catch(() => {
                // Silent — the regular menu still renders below.
            })
            .finally(() => {
                if (!cancelled) setForYouLoading(false);
            });
        return () => { cancelled = true; };
    }, [restaurant?._id, dinerId]);

    const handleAddToCart = (item: MenuItem, qty = 1) => {
        addItem({ itemId: item._id, name: item.name, price: item.price }, qty);
    };

    const filteredSections = useMemo(() => {
        const q = search.trim().toLowerCase();
        return (menu?.sections ?? [])
            .map((section) => ({
                ...section,
                items: section.items.filter((item) => {
                    if (dietFilter === "veg" && !(item.isVeg || item.isVegan)) return false;
                    if (dietFilter === "vegan" && !item.isVegan) return false;
                    if (dietFilter === "glutenFree" && !item.isGlutenFree) return false;
                    if (dietFilter === "mild" && item.spiceLevel !== "mild") return false;
                    if (q && !item.name.toLowerCase().includes(q) && !(item.description ?? "").toLowerCase().includes(q)) return false;
                    return true;
                }),
            }))
            .filter((section) => section.items.length > 0);
    }, [menu, dietFilter, search]);

    const totalItemCount = useMemo(
        () => filteredSections.reduce((sum, s) => sum + s.items.length, 0),
        [filteredSections]
    );

    const scrollToSection = (name: string) => {
        const el = document.getElementById(`section-${name}`);
        if (el) {
            const y = el.getBoundingClientRect().top + window.scrollY - 80;
            window.scrollTo({ top: y, behavior: "smooth" });
            setActiveSection(name);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#324F7B]">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-2 border-[#86A6DE]/30 border-t-[#86A6DE] rounded-full animate-spin mb-4" />
                    <p className="text-stone-200 text-sm tracking-wide">Loading menu…</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#324F7B] p-4">
                <div className="bg-[#F8F8F8] rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
                    <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-stone-900 mb-2">Unable to load menu</h2>
                    <p className="text-stone-600 mb-5 text-sm">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-[#324F7B] hover:bg-[#283f63] text-white px-6 py-2.5 rounded-full font-medium transition-colors text-sm"
                    >
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8F8F8] pb-40">
            {/* Hero */}
            <header className="bg-[#324F7B] text-white relative overflow-hidden">
                {/* Subtle pattern */}
                <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_1px_1px,_white_1px,_transparent_0)] [background-size:24px_24px]" />

                <div className="relative max-w-6xl mx-auto px-5 pt-8 pb-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2 text-xs tracking-[0.2em] text-[#86A6DE] uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#86A6DE] animate-pulse" />
                            Live menu
                        </div>
                        <div className="text-[10px] tracking-[0.25em] text-white/50 uppercase">
                            Powered by Bawarchie
                        </div>
                    </div>

                    <h1 className="text-3xl sm:text-4xl font-serif italic text-white mb-1.5 tracking-tight">
                        {restaurant?.name}
                    </h1>
                    <div className="flex items-center gap-3 text-white/70 text-sm mb-6">
                        <span className="inline-flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m6 10V7M5 12h14" />
                            </svg>
                            Table {table?.tableNumber}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-white/40" />
                        <span>{menu?.title || "Menu"}</span>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <svg
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"
                            fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
                        </svg>
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search dishes…"
                            className="w-full bg-white/95 text-stone-900 placeholder:text-stone-400 rounded-full pl-11 pr-4 py-3 text-sm shadow-lg focus:outline-none focus:ring-2 focus:ring-[#86A6DE]"
                        />
                    </div>
                </div>
            </header>

            {/* Sticky filter + section nav bar */}
            <div className="sticky top-0 z-30 bg-[#F8F8F8]/95 backdrop-blur-md border-b border-stone-200/70">
                <div className="max-w-6xl mx-auto px-5 py-3">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                        {FILTERS.map(({ key, label, emoji }) => (
                            <button
                                key={key}
                                onClick={() => setDietFilter(key)}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
                                    dietFilter === key
                                        ? "bg-[#324F7B] text-white border-[#324F7B] shadow-sm"
                                        : "bg-white text-stone-700 border-stone-200 hover:border-[#86A6DE]"
                                }`}
                            >
                                <span>{emoji}</span> {label}
                            </button>
                        ))}
                    </div>

                    {filteredSections.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto no-scrollbar mt-2.5">
                            {filteredSections.map((s) => (
                                <button
                                    key={s.name}
                                    onClick={() => scrollToSection(s.name)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                                        activeSection === s.name
                                            ? "bg-[#86A6DE]/25 text-[#324F7B]"
                                            : "text-stone-500 hover:text-[#324F7B]"
                                    }`}
                                >
                                    {s.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <main className="max-w-6xl mx-auto px-5 pt-6">
                {totalItemCount === 0 && (
                    <div className="text-center py-20">
                        <div className="text-5xl mb-3">🍽️</div>
                        <p className="text-stone-700 font-medium mb-1">No dishes match your filters</p>
                        <p className="text-stone-500 text-sm mb-4">Try a different filter or search term</p>
                        <button
                            onClick={() => { setDietFilter("all"); setSearch(""); }}
                            className="text-[#5067AA] underline text-sm font-medium"
                        >
                            Reset filters
                        </button>
                    </div>
                )}

                {(forYouLoading || forYouItems.length > 0) && (
                    <section className="mb-12 scroll-mt-24">
                        {/* Hero band — visually distinct from the rest of the menu.
                            Taste-based gets navy + sparkle; popular fallback stays softer. */}
                        <div
                            className={`rounded-3xl mb-5 px-6 py-7 sm:px-8 sm:py-8 ${
                                forYouSource === "taste"
                                    ? "bg-[#324F7B] text-white"
                                    : "bg-[#86A6DE]/10 text-[#324F7B]"
                            }`}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles
                                    className={`w-4 h-4 ${
                                        forYouSource === "taste" ? "text-[#86A6DE]" : "text-[#5067AA]"
                                    }`}
                                />
                                <p
                                    className={`text-[11px] uppercase tracking-[0.25em] font-semibold ${
                                        forYouSource === "taste" ? "text-[#86A6DE]" : "text-[#5067AA]"
                                    }`}
                                >
                                    {forYouSource === "taste" ? "Picked for your taste" : "Popular tonight"}
                                </p>
                                {forYouSource === "taste" && forYouConfidence >= 0.7 && (
                                    <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/15 border border-white/20">
                                        strong match
                                    </span>
                                )}
                            </div>
                            <h2 className={`text-2xl sm:text-3xl font-serif italic tracking-tight ${forYouSource === "taste" ? "text-white" : "text-[#324F7B]"}`}>
                                {forYouSource === "taste"
                                    ? "We think you’ll love these"
                                    : "Tonight’s most-ordered dishes"}
                            </h2>
                            <p className={`text-sm mt-2 max-w-xl ${forYouSource === "taste" ? "text-[#86A6DE]" : "text-stone-600"}`}>
                                {forYouSource === "taste"
                                    ? "Based on the dishes you tend to enjoy. Updates as you order."
                                    : "Crowd favorites here at this restaurant."}
                            </p>
                        </div>

                        {forYouLoading && forYouItems.length === 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[0, 1, 2].map((i) => (
                                    <div
                                        key={`skeleton-${i}`}
                                        className="rounded-2xl border border-stone-200 bg-white overflow-hidden animate-pulse"
                                    >
                                        <div className="h-32 bg-stone-100" />
                                        <div className="p-4 space-y-2">
                                            <div className="h-4 w-2/3 bg-stone-100 rounded" />
                                            <div className="h-3 w-full bg-stone-100 rounded" />
                                            <div className="h-3 w-1/2 bg-stone-100 rounded" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {forYouItems.map((item) => (
                                    <ItemCard
                                        key={`foryou-${item._id}`}
                                        item={item}
                                        onAddToCart={handleAddToCart}
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {filteredSections.map((section) => (
                    <section
                        key={section.name}
                        id={`section-${section.name}`}
                        className="mb-12 scroll-mt-24"
                    >
                        <div className="flex items-baseline justify-between mb-5">
                            <div className="flex items-baseline gap-3">
                                <h2 className="text-2xl font-serif italic text-stone-900 tracking-tight">
                                    {section.name}
                                </h2>
                                <span className="text-xs text-stone-500 tracking-wider uppercase">
                                    {section.items.length} {section.items.length === 1 ? "dish" : "dishes"}
                                </span>
                            </div>
                            <div className="hidden sm:block flex-1 mx-4 border-b border-dashed border-stone-300" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {section.items.map((item) => (
                                <ItemCard
                                    key={item._id}
                                    item={item}
                                    onAddToCart={handleAddToCart}
                                />
                            ))}
                        </div>
                    </section>
                ))}
            </main>

            {/* Sticky Cart Footer */}
            {isHydrated && cartItems.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 z-40">
                    <div className="bg-[#324F7B] text-white shadow-[0_-8px_30px_rgba(0,0,0,0.15)]">
                        <div className="max-w-6xl mx-auto px-5 py-4">
                            <div className="flex items-center gap-4">
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-[#86A6DE]">
                                        {cartItems.length} {cartItems.length === 1 ? "item" : "items"} in cart
                                    </p>
                                    <p className="font-semibold text-2xl text-white leading-tight">
                                        ₹{billingBreakdown?.finalAmount}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowCart(!showCart)}
                                    className="px-5 py-3 rounded-full bg-[#86A6DE] text-[#324F7B] font-semibold text-sm hover:bg-white transition-colors shadow-lg"
                                >
                                    {showCart ? "Hide cart" : "View cart"}
                                </button>
                            </div>

                            {showCart && (
                                <div className="mt-4 bg-[#F8F8F8] text-stone-900 rounded-2xl p-4 max-h-[55vh] overflow-y-auto">
                                    <Cart />
                                </div>
                            )}

                            <div className="mt-3">
                                <RazorpayCheckout tableSlug={tableSlug} restaurantId={restaurant?._id} dinerId={dinerId} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Waiter Chat */}
            {restaurant && (
                <MenuAIChat
                    restaurantId={restaurant._id}
                    dinerId={dinerId}
                    onAddToCart={handleAddToCart}
                />
            )}

            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
