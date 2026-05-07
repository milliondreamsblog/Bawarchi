/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { Check, ChefHat, Clock } from "lucide-react";

interface Order {
    _id: string;
    tableSlug: string;
    items: Array<{ itemId: { name: string; price: number } | null; qty: number }>;
    total: number;
    finalAmount?: number;
    status: "pending" | "preparing" | "served";
    razorpayPaymentId?: string;
    createdAt: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function RestaurantOrdersPage() {
    const params = useParams();
    const slug = params.slug as string;
    const [restaurantId, setRestaurantId] = useState<string | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [filter, setFilter] = useState<"all" | "pending" | "preparing" | "served">("pending");
    const [tableFilter, setTableFilter] = useState<string>("all");

    useEffect(() => {
        if (slug) {
            fetch(`/api/restaurant/by-slug/${slug}`)
                .then((r) => r.json())
                .then((d) => d.success && setRestaurantId(d.restaurant._id));
        }
    }, [slug]);

    const { data, mutate } = useSWR(
        restaurantId ? `/api/orders?restaurantId=${restaurantId}` : null,
        fetcher,
        { refreshInterval: 5000 }
    );

    const orders: Order[] = data?.orders || [];

    const tableFiltered = tableFilter === "all" ? orders : orders.filter((o) => o.tableSlug === tableFilter);
    const filtered = filter === "all" ? tableFiltered : tableFiltered.filter((o) => o.status === filter);

    const counts = {
        all: tableFiltered.length,
        pending: tableFiltered.filter((o) => o.status === "pending").length,
        preparing: tableFiltered.filter((o) => o.status === "preparing").length,
        served: tableFiltered.filter((o) => o.status === "served").length,
    };

    const tablesWithOrders = Array.from(
        new Set(orders.map((o) => o.tableSlug))
    ).sort();

    const advance = async (order: Order) => {
        if (!restaurantId) return;
        const next = order.status === "pending" ? "preparing" : order.status === "preparing" ? "served" : null;
        if (!next) return;

        setUpdatingId(order._id);
        // Optimistic update
        mutate(
            { ...data, orders: orders.map((o) => (o._id === order._id ? { ...o, status: next } : o)) },
            false
        );
        try {
            await fetch(`/api/orders/${order._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: next, restaurantId }),
            });
            mutate();
        } catch {
            mutate(); // revert
        } finally {
            setUpdatingId(null);
        }
    };

    const elapsed = (createdAt: string) => {
        const s = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
        if (s < 60) return `${s}s`;
        if (s < 3600) return `${Math.floor(s / 60)}m`;
        return `${Math.floor(s / 3600)}h`;
    };

    if (!restaurantId) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-2 border-[#86A6DE]/30 border-t-[#324F7B] rounded-full animate-spin" />
            </div>
        );
    }

    const tabs: { key: typeof filter; label: string; count: number; tone: string }[] = [
        { key: "pending", label: "Pending", count: counts.pending, tone: "bg-amber-500" },
        { key: "preparing", label: "Preparing", count: counts.preparing, tone: "bg-[#5067AA]" },
        { key: "served", label: "Served", count: counts.served, tone: "bg-emerald-500" },
        { key: "all", label: "All", count: counts.all, tone: "bg-stone-400" },
    ];

    return (
        <div className="max-w-6xl mx-auto">
            {/* Sticky filter bar */}
            <div className="sticky top-14 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-[#F8F8F8]/95 backdrop-blur-md border-b border-stone-200 mb-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                        <p className="text-[10px] tracking-[0.3em] text-[#5067AA] uppercase">Orders</p>
                        <h1 className="text-xl font-serif italic text-stone-900">Live queue</h1>
                    </div>
                    <p className="text-xs text-stone-500">Auto-refresh · 5s</p>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    {tabs.map(({ key, label, count, tone }) => (
                        <button
                            key={key}
                            onClick={() => setFilter(key)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                                filter === key
                                    ? "bg-[#324F7B] text-white border-[#324F7B]"
                                    : "bg-white text-stone-700 border-stone-200 hover:border-[#86A6DE]"
                            }`}
                        >
                            <span className={`w-1.5 h-1.5 rounded-full ${tone}`} />
                            {label}
                            <span className={`ml-0.5 tabular-nums ${filter === key ? "text-[#86A6DE]" : "text-stone-400"}`}>
                                {count}
                            </span>
                        </button>
                    ))}

                    {tablesWithOrders.length > 0 && (
                        <>
                            <span className="w-px h-5 bg-stone-300 mx-1" />
                            <button
                                onClick={() => setTableFilter("all")}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                                    tableFilter === "all"
                                        ? "bg-[#324F7B] text-white border-[#324F7B]"
                                        : "bg-white text-stone-700 border-stone-200 hover:border-[#86A6DE]"
                                }`}
                            >
                                All tables
                            </button>
                            {tablesWithOrders.map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTableFilter(t)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                                        tableFilter === t
                                            ? "bg-[#324F7B] text-white border-[#324F7B]"
                                            : "bg-white text-stone-700 border-stone-200 hover:border-[#86A6DE]"
                                    }`}
                                >
                                    T{t}
                                </button>
                            ))}
                        </>
                    )}
                </div>
            </div>

            {/* Orders list */}
            {filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-stone-100 flex items-center justify-center">
                        <Check className="w-5 h-5 text-stone-400" />
                    </div>
                    <p className="text-sm font-medium text-stone-900">All caught up</p>
                    <p className="text-xs text-stone-500 mt-1">
                        {filter === "all" ? "No orders yet." : `No ${filter} orders.`}
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map((order) => (
                        <OrderRow
                            key={order._id}
                            order={order}
                            onAdvance={advance}
                            elapsed={elapsed(order.createdAt)}
                            updating={updatingId === order._id}
                        />
                    ))}
                </div>
            )}

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}

function OrderRow({
    order,
    onAdvance,
    elapsed,
    updating,
}: {
    order: Order;
    onAdvance: (o: Order) => void;
    elapsed: string;
    updating: boolean;
}) {
    const elapsedSec = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 1000);
    const isUrgent = elapsedSec > 600 && order.status !== "served";
    const isWarn = elapsedSec > 300 && order.status !== "served";

    const statusConfig = {
        pending: { label: "New", icon: Clock, tone: "text-amber-700 bg-amber-50 border-amber-200", action: "Start preparing", actionTone: "bg-[#324F7B] hover:bg-[#283f63] text-white", actionIcon: ChefHat },
        preparing: { label: "Preparing", icon: ChefHat, tone: "text-[#324F7B] bg-[#86A6DE]/15 border-[#86A6DE]/40", action: "Mark served", actionTone: "bg-emerald-600 hover:bg-emerald-700 text-white", actionIcon: Check },
        served: { label: "Served", icon: Check, tone: "text-emerald-700 bg-emerald-50 border-emerald-200", action: null, actionTone: "", actionIcon: null as any },
    };
    const cfg = statusConfig[order.status];
    const StatusIcon = cfg.icon;
    const ActionIcon = cfg.actionIcon;

    const amount = order.finalAmount ?? order.total;

    return (
        <div
            className={`bg-white rounded-2xl border overflow-hidden transition-colors ${
                isUrgent
                    ? "border-red-300 ring-1 ring-red-200"
                    : isWarn
                    ? "border-amber-200"
                    : "border-stone-200"
            }`}
        >
            <div className="flex items-center gap-4 px-4 py-3">
                {/* Table badge */}
                <div className="w-12 h-12 rounded-xl bg-[#324F7B] text-white flex items-center justify-center font-bold flex-shrink-0">
                    <span className="text-xs leading-none">T</span>
                    <span className="text-base leading-none">{order.tableSlug.replace(/[^0-9]/g, "") || order.tableSlug.slice(0, 2)}</span>
                </div>

                {/* Items */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${cfg.tone}`}>
                            <StatusIcon className="w-3 h-3" />
                            {cfg.label}
                        </span>
                        <span
                            className={`text-[10px] tabular-nums ${
                                isUrgent ? "text-red-600 font-bold" : isWarn ? "text-amber-700 font-medium" : "text-stone-400"
                            }`}
                        >
                            {elapsed}
                        </span>
                    </div>
                    <p className="text-sm text-stone-900 truncate">
                        {order.items.map((i, idx) => (
                            <span key={idx} className={!i.itemId ? "text-red-500 italic" : ""}>
                                {idx > 0 && ", "}
                                {i.itemId ? i.itemId.name : "—"} ×{i.qty}
                            </span>
                        ))}
                    </p>
                </div>

                {/* Amount + action */}
                <div className="flex items-center gap-3 flex-shrink-0">
                    <p className="text-base font-semibold text-stone-900 tabular-nums hidden sm:block">
                        ₹{amount}
                    </p>
                    {cfg.action && (
                        <button
                            onClick={() => onAdvance(order)}
                            disabled={updating}
                            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-colors disabled:opacity-50 ${cfg.actionTone}`}
                        >
                            {updating ? (
                                <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            ) : (
                                ActionIcon && <ActionIcon className="w-3.5 h-3.5" />
                            )}
                            <span className="hidden sm:inline">{cfg.action}</span>
                            <span className="sm:hidden">{cfg.action.split(" ")[0]}</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
