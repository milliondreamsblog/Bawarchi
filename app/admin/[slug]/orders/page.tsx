/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";

interface Order {
    _id: string;
    tableSlug: string;
    items: Array<{ itemId: { name: string; price: number; }; qty: number; }>;
    total: number;
    status: "pending" | "preparing" | "served";
    razorpayPaymentId?: string;
    createdAt: string;
    restaurantId: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function RestaurantOrdersPage() {
    const params = useParams();
    const slug = params.slug as string;
    const [restaurantId, setRestaurantId] = useState<string | null>(null);
    const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
    const [filter, setFilter] = useState<string>("all");
    const [selectedTable, setSelectedTable] = useState<string>("all");

    useEffect(() => {
        if (slug) {
            fetch(`/api/restaurant/by-slug/${slug}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) setRestaurantId(data.restaurant._id);
                });
        }
    }, [slug]);

    const { data, error, mutate } = useSWR(
        restaurantId ? `/api/orders?restaurantId=${restaurantId}` : null,
        fetcher,
        { refreshInterval: 5000 }
    );

    const { data: tablesData } = useSWR(
        restaurantId ? `/api/tables?restaurantId=${restaurantId}` : null,
        fetcher
    );

    const orders: Order[] = data?.orders || [];
    const tables = tablesData?.tables || [];
    const loading = !data && !error && restaurantId;

    const formatDate = (date: string) => {
        return new Date(date).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
    };

    const formatPrice = (price: number) => `₹${price}`;

    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        if (!restaurantId) return;
        try {
            setUpdatingOrderId(orderId);
            const response = await fetch(`/api/orders/${orderId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus, restaurantId }),
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error || "Failed to update order");
            mutate();
        } catch (error: any) {
            alert(`Error: ${error.message || "Failed to update order"}`);
        } finally {
            setUpdatingOrderId(null);
        }
    };

    // Filter orders by table first, then by status
    const tableFilteredOrders = selectedTable === "all"
        ? orders
        : orders.filter((order) => order.tableSlug === selectedTable);

    const filteredOrders = tableFilteredOrders.filter((order) => filter === "all" ? true : order.status === filter);

    // Get unique tables that have orders
    const getTablesWithOrders = () => {
        const tableMap = new Map<string, number>();
        orders.forEach(order => {
            const count = tableMap.get(order.tableSlug) || 0;
            tableMap.set(order.tableSlug, count + 1);
        });
        return Array.from(tableMap.entries()).map(([slug, count]) => ({
            slug,
            count,
            tableNumber: tables.find((t: any) => t.slug === slug)?.tableNumber || slug
        })).sort((a, b) => parseInt(a.tableNumber) - parseInt(b.tableNumber));
    };

    const tablesWithOrders = getTablesWithOrders();

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "pending": return "bg-yellow-100 text-yellow-800";
            case "preparing": return "bg-blue-100 text-blue-800";
            case "served": return "bg-green-100 text-green-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    const getStatusCount = (status: string) => {
        return tableFilteredOrders.filter(order => order.status === status).length;
    };

    if (!restaurantId) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading restaurant...</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading orders...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Failed to Load Orders</h3>
                <p className="text-gray-600 dark:text-gray-400">Please try refreshing the page</p>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Order Management</h1>
                    <p className="text-gray-600 dark:text-gray-400">Manage and track incoming orders from your tables</p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">{filteredOrders.length}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Orders</p>
                </div>
            </div>

            {/* Stats and Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className={`text-center p-4 rounded-xl cursor-pointer transition-all ${filter === "all" ? "bg-green-600 text-white" : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"}`} onClick={() => setFilter("all")}>
                        <div className="text-2xl font-bold">{tableFilteredOrders.length}</div>
                        <div className="text-sm">All Orders</div>
                    </div>
                    <div className={`text-center p-4 rounded-xl cursor-pointer transition-all ${filter === "pending" ? "bg-yellow-600 text-white" : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"}`} onClick={() => setFilter("pending")}>
                        <div className="text-2xl font-bold">{getStatusCount("pending")}</div>
                        <div className="text-sm">Pending</div>
                    </div>
                    <div className={`text-center p-4 rounded-xl cursor-pointer transition-all ${filter === "preparing" ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"}`} onClick={() => setFilter("preparing")}>
                        <div className="text-2xl font-bold">{getStatusCount("preparing")}</div>
                        <div className="text-sm">Preparing</div>
                    </div>
                    <div className={`text-center p-4 rounded-xl cursor-pointer transition-all ${filter === "served" ? "bg-green-600 text-white" : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"}`} onClick={() => setFilter("served")}>
                        <div className="text-2xl font-bold">{getStatusCount("served")}</div>
                        <div className="text-sm">Served</div>
                    </div>
                </div>
            </div>

            {/* Table Tabs */}
            {tablesWithOrders.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 mb-6">
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => setSelectedTable("all")}
                            className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${selectedTable === "all"
                                ? "bg-green-600 text-white shadow-md"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                }`}
                        >
                            All Tables
                            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-bold ${selectedTable === "all" ? "bg-white text-green-600" : "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                                }`}>
                                {orders.length}
                            </span>
                        </button>
                        {tablesWithOrders.map((table) => (
                            <button
                                key={table.slug}
                                onClick={() => setSelectedTable(table.slug)}
                                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${selectedTable === table.slug
                                    ? "bg-green-600 text-white shadow-md"
                                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                    }`}
                            >
                                Table {table.tableNumber}
                                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-bold ${selectedTable === table.slug ? "bg-white text-green-600" : "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                                    }`}>
                                    {table.count}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Orders List */}
            <div className="space-y-6">
                {filteredOrders.map((order) => (
                    <div key={order._id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-200">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Table {order.tableSlug}</h3>
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(order.status)}`}>
                                        {order.status === "pending" && <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>}
                                        {order.status === "preparing" && <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>}
                                        {order.status === "served" && <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>}
                                        {order.status.toUpperCase()}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(order.createdAt)}</p>
                                {order.razorpayPaymentId && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Payment ID: {order.razorpayPaymentId}</p>
                                )}
                            </div>
                        </div>

                        {/* Order Items */}
                        <div className="mb-6">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Order Items</h4>
                            <div className="space-y-2">
                                {order.items.map((item, idx) => {
                                    if (!item.itemId) {
                                        return (
                                            <div key={idx} className="flex justify-between items-center bg-red-50 p-3 rounded-lg border border-red-200">
                                                <span className="text-red-700 flex items-center">
                                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    Item deleted × {item.qty}
                                                </span>
                                                <span className="font-semibold text-red-700">---</span>
                                            </div>
                                        );
                                    }
                                    return (
                                        <div key={idx} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                                            <span className="text-gray-700 dark:text-gray-300">{item.itemId.name} × {item.qty}</span>
                                            <span className="font-semibold text-gray-900 dark:text-white">{formatPrice(item.itemId.price * item.qty)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Order Actions */}
                        <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-600">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Amount</p>
                                <p className="text-2xl font-bold text-green-600">{formatPrice(order.total)}</p>
                            </div>
                            <div className="flex gap-3">
                                {order.status === "pending" && (
                                    <button
                                        onClick={() => updateOrderStatus(order._id, "preparing")}
                                        disabled={updatingOrderId === order._id}
                                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {updatingOrderId === order._id ? (
                                            <div className="flex items-center">
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                                Updating...
                                            </div>
                                        ) : (
                                            "Accept & Prepare"
                                        )}
                                    </button>
                                )}
                                {order.status === "preparing" && (
                                    <button
                                        onClick={() => updateOrderStatus(order._id, "served")}
                                        disabled={updatingOrderId === order._id}
                                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {updatingOrderId === order._id ? (
                                            <div className="flex items-center">
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                                Updating...
                                            </div>
                                        ) : (
                                            "Mark as Served"
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {filteredOrders.length === 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Orders Found</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                        {filter === "all"
                            ? "No orders have been placed yet. They will appear here when customers order."
                            : `No ${filter} orders at the moment.`
                        }
                    </p>
                </div>
            )}
        </div>
    );
}