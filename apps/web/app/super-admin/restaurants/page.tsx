"use client";

import React, { useMemo, useState } from "react";
import useSWR from "swr";
import {
    Ban,
    Building2,
    CalendarDays,
    Clock3,
    Mail,
    MapPin,
    Phone,
    RefreshCw,
    Search,
    ShieldCheck,
    Store,
} from "lucide-react";
import Button from "@/components/Button";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type RestaurantStatus = "pending" | "approved" | "blocked";

type Restaurant = {
    _id: string;
    name: string;
    owner?: string;
    email: string;
    phone?: string;
    address?: string;
    createdAt?: string;
    status: RestaurantStatus;
};

const statusConfig = {
    pending: {
        label: "Pending",
        chip: "border-amber-200 bg-amber-50 text-amber-800",
        dot: "bg-amber-500",
        actionLabel: "Approve",
        secondaryAction: "blocked",
        secondaryLabel: "Reject",
    },
    approved: {
        label: "Approved",
        chip: "border-emerald-200 bg-emerald-50 text-emerald-800",
        dot: "bg-emerald-500",
        actionLabel: "Block",
        secondaryAction: null,
        secondaryLabel: null,
    },
    blocked: {
        label: "Blocked",
        chip: "border-rose-200 bg-rose-50 text-rose-800",
        dot: "bg-rose-500",
        actionLabel: "Unblock",
        secondaryAction: null,
        secondaryLabel: null,
    },
} as const;

const statusFilters = ["all", "pending", "approved", "blocked"] as const;

export default function RestaurantsPage() {
    const [statusFilter, setStatusFilter] = useState<(typeof statusFilters)[number]>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [updateLoading, setUpdateLoading] = useState<string | null>(null);

    const { data, error, mutate, isLoading } = useSWR("/api/auth/restaurants", fetcher, {
        refreshInterval: 5000,
    });

    const restaurants = useMemo<Restaurant[]>(() => data?.restaurants ?? [], [data?.restaurants]);

    const stats = useMemo(() => {
        return {
            total: restaurants.length,
            pending: restaurants.filter((restaurant) => restaurant.status === "pending").length,
            approved: restaurants.filter((restaurant) => restaurant.status === "approved").length,
            blocked: restaurants.filter((restaurant) => restaurant.status === "blocked").length,
        };
    }, [restaurants]);

    const filteredRestaurants = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        return restaurants.filter((restaurant) => {
            const matchesStatus =
                statusFilter === "all" ? true : restaurant.status === statusFilter;

            if (!matchesStatus) {
                return false;
            }

            if (!query) {
                return true;
            }

            const searchableFields = [
                restaurant.name,
                restaurant.owner,
                restaurant.email,
                restaurant.phone,
                restaurant.address,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return searchableFields.includes(query);
        });
    }, [restaurants, searchQuery, statusFilter]);

    const updateStatus = async (restaurantId: string, newStatus: string) => {
        setUpdateLoading(restaurantId);
        try {
            const res = await fetch("/api/auth/restaurants", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ restaurantId, status: newStatus }),
            });

            const result = await res.json();
            if (result.success) {
                mutate();
            } else {
                alert("Error: " + result.error);
            }
        } catch {
            alert("Failed to update status");
        } finally {
            setUpdateLoading(null);
        }
    };

    const renderStatusBadge = (status: keyof typeof statusConfig) => {
        const config = statusConfig[status];

        return (
            <span
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${config.chip}`}
            >
                <span className={`h-2 w-2 rounded-full ${config.dot}`} />
                {config.label}
            </span>
        );
    };

    if (error) {
        return (
            <div className="rounded-[28px] border border-rose-200 bg-white p-8 shadow-sm">
                <div className="flex items-center gap-3 text-rose-700">
                    <Ban className="h-5 w-5" />
                    Error loading restaurants
                </div>
            </div>
        );
    }

    if (isLoading && !data) {
        return (
            <div className="rounded-[28px] border border-emerald-100 bg-white p-10 shadow-sm">
                <div className="flex flex-col items-center justify-center gap-3 py-10">
                    <span className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600/25 border-t-emerald-600" />
                    <p className="text-sm text-slate-600">Loading restaurant operations...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <section className="overflow-hidden rounded-[30px] border border-emerald-100 bg-[linear-gradient(135deg,#f7fff8_0%,#ffffff_48%,#f0fdf4_100%)] shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
                <div className="grid gap-8 p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                            <ShieldCheck className="h-4 w-4" />
                            Super admin workspace
                        </div>

                        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                            Restaurant approvals and account control in one place
                        </h1>
                        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                            Review onboarding status, search live accounts, and update access without switching screens.
                        </p>

                        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm">
                                <RefreshCw className="h-4 w-4 text-emerald-600" />
                                Auto-refresh every 5 seconds
                            </span>
                            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm">
                                <Store className="h-4 w-4 text-emerald-600" />
                                {filteredRestaurants.length} visible account
                                {filteredRestaurants.length === 1 ? "" : "s"}
                            </span>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-[26px] border border-white bg-slate-900 p-5 text-white shadow-sm sm:col-span-2">
                            <div className="text-sm text-white/70">Total restaurants</div>
                            <div className="mt-3 text-4xl font-semibold">{stats.total}</div>
                            <div className="mt-4 h-2 rounded-full bg-white/10">
                                <div
                                    className="h-2 rounded-full bg-emerald-400"
                                    style={{
                                        width: `${stats.total === 0 ? 0 : (stats.approved / stats.total) * 100}%`,
                                    }}
                                />
                            </div>
                            <div className="mt-3 text-xs uppercase tracking-[0.18em] text-white/55">
                                Approved ratio
                            </div>
                        </div>

                        <div className="rounded-[24px] border border-amber-100 bg-amber-50 p-5">
                            <div className="text-sm font-medium text-amber-900">Pending</div>
                            <div className="mt-2 text-3xl font-semibold text-amber-700">{stats.pending}</div>
                        </div>

                        <div className="rounded-[24px] border border-rose-100 bg-rose-50 p-5">
                            <div className="text-sm font-medium text-rose-900">Blocked</div>
                            <div className="mt-2 text-3xl font-semibold text-rose-700">{stats.blocked}</div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap gap-2">
                        {statusFilters.map((filter) => {
                            const isActive = statusFilter === filter;
                            const count =
                                filter === "all"
                                    ? stats.total
                                    : stats[filter as keyof typeof stats];

                            return (
                                <button
                                    key={filter}
                                    onClick={() => setStatusFilter(filter)}
                                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium capitalize transition ${
                                        isActive
                                            ? "bg-slate-900 text-white shadow-sm"
                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    }`}
                                >
                                    {filter}
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-xs ${
                                            isActive ? "bg-white/15 text-white" : "bg-white text-slate-500"
                                        }`}
                                    >
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <label className="relative block w-full max-w-md">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by restaurant, owner, email, phone..."
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                        />
                    </label>
                </div>
            </section>

            {filteredRestaurants.length === 0 ? (
                <section className="rounded-[30px] border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                        <Building2 className="h-8 w-8" />
                    </div>
                    <h2 className="mt-5 text-xl font-semibold text-slate-900">No restaurants match this view</h2>
                    <p className="mt-2 text-sm text-slate-600">
                        Change the status filter or search term to see more accounts.
                    </p>
                </section>
            ) : (
                <section className="grid gap-5 xl:grid-cols-2">
                    {filteredRestaurants.map((restaurant) => {
                        const config = statusConfig[
                            restaurant.status as keyof typeof statusConfig
                        ];
                        const isRowLoading = updateLoading === restaurant._id;
                        const primaryAction =
                            restaurant.status === "pending"
                                ? "approved"
                                : restaurant.status === "approved"
                                    ? "blocked"
                                    : "approved";

                        return (
                            <article
                                key={restaurant._id}
                                className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
                            >
                                <div className="flex flex-col gap-5">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-3">
                                                <h2 className="text-2xl font-semibold text-slate-900">
                                                    {restaurant.name}
                                                </h2>
                                                {renderStatusBadge(
                                                    restaurant.status as keyof typeof statusConfig
                                                )}
                                            </div>
                                            <p className="mt-2 text-sm text-slate-500">
                                                Owner access and restaurant profile overview
                                            </p>
                                        </div>

                                        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                            <Clock3 className="h-3.5 w-3.5" />
                                            Live account
                                        </div>
                                    </div>

                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                                <Building2 className="h-4 w-4" />
                                                Owner
                                            </div>
                                            <div className="mt-2 text-sm font-medium text-slate-900">
                                                {restaurant.owner || "Not provided"}
                                            </div>
                                        </div>

                                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                                <CalendarDays className="h-4 w-4" />
                                                Registered
                                            </div>
                                            <div className="mt-2 text-sm font-medium text-slate-900">
                                                {restaurant.createdAt
                                                    ? new Date(restaurant.createdAt).toLocaleDateString()
                                                    : "Unknown"}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid gap-3 text-sm text-slate-600">
                                        <div className="flex items-start gap-3">
                                            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                                            <span>{restaurant.email}</span>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <Phone className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                                            <span>{restaurant.phone || "Phone not provided"}</span>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                                            <span>{restaurant.address || "Address not provided"}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="text-sm text-slate-500">
                                            Current state:{" "}
                                            <span className="font-semibold text-slate-700">{config.label}</span>
                                        </div>

                                        <div className="flex flex-wrap gap-3">
                                            {config.secondaryAction && config.secondaryLabel && (
                                                <Button
                                                    variant="outline"
                                                    className="rounded-2xl border-rose-200 px-5 py-2.5 text-rose-700 hover:border-rose-600 hover:bg-rose-600 hover:text-white"
                                                    onClick={() =>
                                                        updateStatus(
                                                            restaurant._id,
                                                            config.secondaryAction
                                                        )
                                                    }
                                                    disabled={isRowLoading}
                                                >
                                                    {isRowLoading ? (
                                                        <span className="flex items-center gap-2">
                                                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />
                                                            Updating
                                                        </span>
                                                    ) : (
                                                        config.secondaryLabel
                                                    )}
                                                </Button>
                                            )}

                                            <Button
                                                className={`rounded-2xl px-5 py-2.5 ${
                                                    primaryAction === "approved"
                                                        ? "bg-emerald-600 hover:bg-emerald-700"
                                                        : "bg-slate-900 hover:bg-slate-800"
                                                }`}
                                                onClick={() => updateStatus(restaurant._id, primaryAction)}
                                                disabled={isRowLoading}
                                            >
                                                {isRowLoading ? (
                                                    <span className="flex items-center gap-2">
                                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />
                                                        Updating
                                                    </span>
                                                ) : (
                                                    config.actionLabel
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </section>
            )}
        </div>
    );
}
