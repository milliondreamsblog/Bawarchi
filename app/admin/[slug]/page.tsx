/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
    UtensilsCrossed,
    Boxes,
    BookOpen,
    Grid3x3,
    Receipt,
    ChefHat,
    Star,
    BarChart3,
    Settings,
    ArrowRight,
    AlertTriangle,
} from "lucide-react";

interface Stats {
    ordersToday: number;
    totalItems: number;
    totalTables: number;
    tablesOccupied: number;
    lowStockItems: number;
    pendingOrders: number;
    revenueToday: number;
}

interface PendingOrder {
    _id: string;
    tableSlug: string;
    items: { itemId?: { name: string }; qty: number }[];
    total: number;
    finalAmount?: number;
    createdAt: string;
}

export default function RestaurantDashboardPage() {
    const { data: session, status } = useSession();
    const params = useParams();
    const slug = params.slug as string;
    const [restaurant, setRestaurant] = useState<any>(null);
    const [stats, setStats] = useState<Stats>({
        ordersToday: 0,
        totalItems: 0,
        totalTables: 0,
        tablesOccupied: 0,
        lowStockItems: 0,
        pendingOrders: 0,
        revenueToday: 0,
    });
    const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === "authenticated") {
            loadAll();
            const id = setInterval(loadAll, 15000);
            return () => clearInterval(id);
        }
    }, [status, slug]);

    const loadAll = async () => {
        try {
            const restRes = await fetch(`/api/restaurant/by-slug/${slug}`);
            const restData = await restRes.json();
            if (restData.success) {
                setRestaurant(restData.restaurant);

                const [statsRes, ordersRes] = await Promise.all([
                    fetch(`/api/restaurant/stats/${slug}`).then((r) => r.json()),
                    fetch(`/api/orders?restaurantId=${restData.restaurant._id}`).then((r) => r.json()),
                ]);

                if (statsRes.success) setStats(statsRes.stats);
                if (ordersRes.success) {
                    const pending = (ordersRes.orders || [])
                        .filter((o: any) => o.status === "pending")
                        .slice(0, 4);
                    setPendingOrders(pending);
                }
            }
        } catch (err) {
            console.error("Failed to load dashboard:", err);
        } finally {
            setLoading(false);
        }
    };

    if (status === "loading" || loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-2 border-[#86A6DE]/30 border-t-[#324F7B] rounded-full animate-spin" />
            </div>
        );
    }

    if (!session || !restaurant) return null;

    const avgTicket = stats.ordersToday > 0 ? Math.round(stats.revenueToday / stats.ordersToday) : 0;
    const occupancyPct = stats.totalTables > 0 ? Math.round((stats.tablesOccupied / stats.totalTables) * 100) : 0;

    const elapsed = (createdAt: string) => {
        const s = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
        if (s < 60) return `${s}s`;
        const m = Math.floor(s / 60);
        return `${m}m`;
    };

    const quickActions = [
        { href: `/admin/${slug}/items`, label: "Items", icon: UtensilsCrossed },
        { href: `/admin/${slug}/menu`, label: "Menu", icon: BookOpen },
        { href: `/admin/${slug}/tables`, label: "Tables", icon: Grid3x3 },
        { href: `/admin/${slug}/inventory`, label: "Inventory", icon: Boxes },
        { href: `/admin/${slug}/feedback`, label: "Feedback", icon: Star },
        { href: `/admin/${slug}/analytics`, label: "Analytics", icon: BarChart3 },
        { href: `/admin/${slug}/settings`, label: "Settings", icon: Settings },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-5">
            {/* Greeting + alert chips */}
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <p className="text-[10px] tracking-[0.3em] text-[#5067AA] uppercase mb-1">Today</p>
                    <h1 className="text-2xl font-serif italic text-stone-900">
                        Hi {restaurant.owner?.split(" ")[0] || "there"}
                    </h1>
                </div>
                <div className="flex flex-wrap gap-2">
                    {stats.pendingOrders > 0 && (
                        <Link
                            href={`/admin/${slug}/orders`}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-medium"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            {stats.pendingOrders} pending
                        </Link>
                    )}
                    {stats.lowStockItems > 0 && (
                        <Link
                            href={`/admin/${slug}/inventory`}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-medium"
                        >
                            <AlertTriangle className="w-3 h-3" />
                            {stats.lowStockItems} low stock
                        </Link>
                    )}
                </div>
            </div>

            {/* Top stats row — dense */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard
                    label="Revenue today"
                    value={`₹${stats.revenueToday.toLocaleString("en-IN")}`}
                    sub={avgTicket > 0 ? `avg ₹${avgTicket}` : "—"}
                    accent
                />
                <StatCard
                    label="Orders today"
                    value={stats.ordersToday.toString()}
                    sub={stats.pendingOrders > 0 ? `${stats.pendingOrders} pending` : "all clear"}
                />
                <StatCard
                    label="Tables in use"
                    value={`${stats.tablesOccupied}/${stats.totalTables}`}
                    sub={`${occupancyPct}% occupied`}
                />
                <StatCard
                    label="Menu items"
                    value={stats.totalItems.toString()}
                    sub={stats.lowStockItems > 0 ? `${stats.lowStockItems} low stock` : "all stocked"}
                />
            </div>

            {/* Pending orders preview + Quick actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Pending orders */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100">
                        <h2 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-[#324F7B]" />
                            Pending orders
                        </h2>
                        <Link
                            href={`/admin/${slug}/orders`}
                            className="text-xs font-medium text-[#5067AA] hover:text-[#324F7B] inline-flex items-center gap-1"
                        >
                            View all <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>

                    {pendingOrders.length === 0 ? (
                        <div className="px-5 py-10 text-center">
                            <p className="text-sm text-stone-500">No pending orders right now</p>
                            <p className="text-xs text-stone-400 mt-1">You're all caught up.</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-stone-100">
                            {pendingOrders.map((o) => (
                                <li key={o._id}>
                                    <Link
                                        href={`/admin/${slug}/orders`}
                                        className="flex items-center gap-4 px-5 py-3 hover:bg-stone-50 transition-colors"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-[#324F7B]/10 text-[#324F7B] flex items-center justify-center font-bold text-sm flex-shrink-0">
                                            {o.tableSlug.replace(/^t/, "").slice(0, 2)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-stone-900 truncate">
                                                {o.items
                                                    .map((i) => `${i.itemId?.name || "—"} ×${i.qty}`)
                                                    .join(", ")}
                                            </p>
                                            <p className="text-xs text-stone-500 mt-0.5">
                                                Table {o.tableSlug} · {elapsed(o.createdAt)} ago
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-[#324F7B] tabular-nums">
                                                ₹{o.finalAmount ?? o.total}
                                            </p>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Quick actions */}
                <div className="bg-white rounded-2xl border border-stone-200 p-4">
                    <h2 className="text-sm font-semibold text-stone-900 mb-3">Quick actions</h2>
                    <div className="grid grid-cols-2 gap-2">
                        <Link
                            href={`/admin/${slug}/orders`}
                            className="col-span-2 flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#324F7B] text-white hover:bg-[#283f63] transition-colors"
                        >
                            <Receipt className="w-4 h-4" />
                            <span className="text-sm font-medium">Open orders</span>
                            <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                        </Link>
                        <Link
                            href={`/admin/${slug}/kitchen`}
                            className="col-span-2 flex items-center gap-3 px-3 py-2.5 rounded-xl border border-[#86A6DE]/40 bg-[#86A6DE]/10 text-[#324F7B] hover:bg-[#86A6DE]/20 transition-colors"
                        >
                            <ChefHat className="w-4 h-4" />
                            <span className="text-sm font-medium">Kitchen display</span>
                            <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                        </Link>
                        {quickActions.map(({ href, label, icon: Icon }) => (
                            <Link
                                key={href}
                                href={href}
                                className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border border-stone-200 hover:border-[#86A6DE] hover:bg-stone-50 transition-colors"
                            >
                                <Icon className="w-4 h-4 text-stone-600" />
                                <span className="text-xs font-medium text-stone-700">{label}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({
    label,
    value,
    sub,
    accent,
}: {
    label: string;
    value: string;
    sub: string;
    accent?: boolean;
}) {
    return (
        <div
            className={`rounded-2xl border p-4 ${
                accent ? "bg-[#324F7B] border-[#324F7B] text-white" : "bg-white border-stone-200"
            }`}
        >
            <p
                className={`text-[10px] tracking-[0.2em] uppercase ${
                    accent ? "text-[#86A6DE]" : "text-stone-400"
                }`}
            >
                {label}
            </p>
            <p
                className={`text-2xl font-semibold mt-1 tabular-nums ${
                    accent ? "text-white" : "text-stone-900"
                }`}
            >
                {value}
            </p>
            <p className={`text-xs mt-0.5 ${accent ? "text-[#86A6DE]" : "text-stone-500"}`}>
                {sub}
            </p>
        </div>
    );
}
