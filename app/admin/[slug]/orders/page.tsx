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
    baseTotal?: number;
    gstAmount?: number;
    platformFee?: number;
    finalAmount?: number;
    status: "pending" | "preparing" | "served";
    createdAt: string;
}

interface Table {
    slug: string;
    tableNumber: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function RestaurantOrdersPage() {
    const params = useParams();
    const slug = params.slug as string;
    const [restaurantId, setRestaurantId] = useState<string | null>(null);
    const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
    const [selectedTable, setSelectedTable] = useState<string>("all");
    const [selectedStatus, setSelectedStatus] = useState<string>("all");

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
    const tables: Table[] = tablesData?.tables || [];
    const loading = !data && !error && restaurantId;

    const formatTime = (date: string) => {
        return new Date(date).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        });
    };

    const formatPrice = (price: number) => `₹${price.toFixed(2)}`;

    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        if (!restaurantId) return;
        try {
            setUpdatingOrderId(orderId);
            await fetch(`/api/orders/${orderId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus, restaurantId }),
            });
            mutate();
        } catch (error: any) {
            alert("Failed to update order");
        } finally {
            setUpdatingOrderId(null);
        }
    };

    // Filter orders by table first
    const tableFilteredOrders = selectedTable === "all"
        ? orders
        : orders.filter((order) => order.tableSlug === selectedTable);

    // Then filter by status
    const filteredOrders = selectedStatus === "all"
        ? tableFilteredOrders
        : tableFilteredOrders.filter((order) => order.status === selectedStatus);

    // Get total amounts for display
    const getTotalRevenue = (orders: Order[]) => {
        return orders.reduce((sum, order) => sum + (order.finalAmount || order.total), 0);
    };

    // Get order counts for each status (for the current table filter)
    const pendingCount = tableFilteredOrders.filter(o => o.status === "pending").length;
    const preparingCount = tableFilteredOrders.filter(o => o.status === "preparing").length;
    const servedCount = tableFilteredOrders.filter(o => o.status === "served").length;
    const servedOrders = tableFilteredOrders.filter(o => o.status === "served");

    // Get tables with order counts
    const getTablesWithOrders = () => {
        const tableMap = new Map<string, number>();
        orders.forEach(order => {
            const count = tableMap.get(order.tableSlug) || 0;
            tableMap.set(order.tableSlug, count + 1);
        });

        return tables.map(table => ({
            ...table,
            count: tableMap.get(table.slug) || 0
        })).sort((a, b) => parseInt(a.tableNumber) - parseInt(b.tableNumber));
    };

    const tablesWithOrders = getTablesWithOrders();

    const getStatusColor = (status: string) => {
        switch (status) {
            case "pending": return "bg-red-500";
            case "preparing": return "bg-yellow-500";
            case "served": return "bg-green-500";
            default: return "bg-gray-400";
        }
    };

    if (!restaurantId || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            {/* Header */}
            <div className="mb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Orders Dashboard</h1>
                        <p className="text-gray-600 text-sm">Manage restaurant orders</p>
                    </div>
                    <div className="text-right">
                        <div className="text-xl font-bold text-green-600">
                            {formatPrice(getTotalRevenue(filteredOrders))}
                        </div>
                        <p className="text-sm text-gray-600">Revenue</p>
                    </div>
                </div>
            </div>

            {/* Table Selection Grid */}
            <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Tables</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {/* All Tables Card */}
                    <div
                        className={`bg-white rounded-xl p-4 shadow border-2 cursor-pointer transition-all ${selectedTable === "all" ? "border-green-500 bg-green-50" : "border-gray-200"}`}
                        onClick={() => setSelectedTable("all")}
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="text-lg font-bold text-gray-900">All</div>
                                <div className="text-sm text-gray-600">Tables</div>
                            </div>
                            <div className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full">
                                {orders.length}
                            </div>
                        </div>
                    </div>

                    {/* Individual Tables */}
                    {tablesWithOrders.map((table) => (
                        <div
                            key={table.slug}
                            className={`bg-white rounded-xl p-4 shadow border-2 cursor-pointer transition-all ${selectedTable === table.slug ? "border-green-500 bg-green-50" : "border-gray-200"}`}
                            onClick={() => setSelectedTable(table.slug)}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="text-lg font-bold text-gray-900">Table {table.tableNumber}</div>
                                    <div className="text-xs text-gray-600">Orders: {table.count}</div>
                                </div>
                                {table.count > 0 && (
                                    <div className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                                        {table.count}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Order Status Tabs */}
            <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setSelectedStatus("all")}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${selectedStatus === "all" ? "bg-gray-800 text-white" : "bg-white text-gray-700 border border-gray-300"}`}
                    >
                        All Orders
                        <span className="ml-2 text-xs opacity-90">{tableFilteredOrders.length}</span>
                    </button>
                    <button
                        onClick={() => setSelectedStatus("pending")}
                        className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center ${selectedStatus === "pending" ? "bg-red-500 text-white" : "bg-white text-gray-700 border border-gray-300"}`}
                    >
                        <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                        Pending
                        <span className="ml-2 text-xs opacity-90">{pendingCount}</span>
                    </button>
                    <button
                        onClick={() => setSelectedStatus("preparing")}
                        className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center ${selectedStatus === "preparing" ? "bg-yellow-500 text-white" : "bg-white text-gray-700 border border-gray-300"}`}
                    >
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                        Preparing
                        <span className="ml-2 text-xs opacity-90">{preparingCount}</span>
                    </button>
                    <button
                        onClick={() => setSelectedStatus("served")}
                        className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center ${selectedStatus === "served" ? "bg-green-500 text-white" : "bg-white text-gray-700 border border-gray-300"}`}
                    >
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Served
                        <span className="ml-2 text-xs opacity-90">{servedCount}</span>
                    </button>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                <div className="bg-white rounded-xl p-4 shadow border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-gray-600">Active Orders</div>
                            <div className="text-2xl font-bold text-gray-900">{pendingCount + preparingCount}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-gray-500">Pending: {pendingCount}</div>
                            <div className="text-xs text-gray-500">Preparing: {preparingCount}</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-gray-600">Served Today</div>
                            <div className="text-2xl font-bold text-green-600">{servedCount}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-gray-500">Revenue</div>
                            <div className="text-sm font-semibold text-green-600">
                                {formatPrice(getTotalRevenue(servedOrders))}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow border border-gray-200">
                    <div className="text-sm text-gray-600">Showing</div>
                    <div className="text-xl font-bold text-gray-900">
                        {selectedTable === "all" ? "All Tables" : `Table ${selectedTable}`}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                        {filteredOrders.length} orders • {formatPrice(getTotalRevenue(filteredOrders))}
                    </div>
                </div>
            </div>

            {/* Orders Grid */}
            {filteredOrders.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredOrders.map((order) => (
                        <div key={order._id} className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
                            {/* Order Header */}
                            <div className="p-4 border-b border-gray-200">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${getStatusColor(order.status)}`}></div>
                                            <span className="text-sm font-medium capitalize">{order.status}</span>
                                        </div>
                                        <div className="text-lg font-bold mt-1">Table {order.tableSlug}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-gray-600">{formatTime(order.createdAt)}</div>
                                        <div className="text-xl font-bold text-green-600">
                                            {/* Show finalAmount if available, otherwise total */}
                                            {formatPrice(order.finalAmount || order.total)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Order Items */}
                            <div className="p-4 border-b border-gray-200">
                                <div className="space-y-2">
                                    {order.items.slice(0, 3).map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-sm">
                                            <span className="text-gray-700 truncate">
                                                {item.qty}× {item.itemId?.name || "Item"}
                                            </span>
                                            <span className="font-medium text-gray-900">
                                                {formatPrice(item.itemId ? item.itemId.price * item.qty : 0)}
                                            </span>
                                        </div>
                                    ))}
                                    {order.items.length > 3 && (
                                        <div className="text-xs text-gray-500 text-center pt-1">
                                            +{order.items.length - 3} more items
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Bill Breakdown (if available) */}
                            {(order.baseTotal || order.gstAmount || order.platformFee) && (
                                <div className="p-3 bg-gray-50 border-b border-gray-200">
                                    <div className="space-y-1 text-xs">
                                        {order.baseTotal && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Items:</span>
                                                <span className="font-medium">{formatPrice(order.baseTotal)}</span>
                                            </div>
                                        )}
                                        {order.gstAmount && order.gstAmount > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">GST:</span>
                                                <span className="font-medium">{formatPrice(order.gstAmount)}</span>
                                            </div>
                                        )}
                                        {order.platformFee && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Platform Fee:</span>
                                                <span className="font-medium">{formatPrice(order.platformFee)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Order Actions */}
                            <div className="p-4">
                                {order.status === "pending" && (
                                    <button
                                        onClick={() => updateOrderStatus(order._id, "preparing")}
                                        disabled={updatingOrderId === order._id}
                                        className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {updatingOrderId === order._id ? (
                                            <div className="flex items-center justify-center">
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                                Accepting...
                                            </div>
                                        ) : "Accept Order"}
                                    </button>
                                )}

                                {order.status === "preparing" && (
                                    <button
                                        onClick={() => updateOrderStatus(order._id, "served")}
                                        disabled={updatingOrderId === order._id}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {updatingOrderId === order._id ? (
                                            <div className="flex items-center justify-center">
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                                Marking...
                                            </div>
                                        ) : "Mark as Served"}
                                    </button>
                                )}

                                {order.status === "served" && (
                                    <div className="text-center py-2">
                                        <div className="flex items-center justify-center text-green-600">
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span className="font-medium">Completed</span>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            Paid: {formatPrice(order.finalAmount || order.total)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow border border-gray-200 p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Orders Found</h3>
                    <p className="text-gray-600">
                        {selectedStatus === "all"
                            ? selectedTable === "all"
                                ? "No orders yet. They'll appear here when placed."
                                : `No orders for Table ${selectedTable}`
                            : `No ${selectedStatus} orders for ${selectedTable === "all" ? "any table" : `Table ${selectedTable}`}`
                        }
                    </p>
                </div>
            )}

            {/* Bottom Summary Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 shadow-lg">
                <div className="flex justify-between items-center">
                    <div className="text-sm">
                        <span className="text-gray-600">Showing:</span>
                        <span className="font-bold ml-2">{filteredOrders.length} orders</span>
                    </div>
                    <div className="text-sm">
                        <span className="text-gray-600">Revenue:</span>
                        <span className="font-bold text-green-600 ml-2">
                            {formatPrice(getTotalRevenue(filteredOrders))}
                        </span>
                    </div>
                    <div className="text-sm">
                        <span className="text-gray-600">Table:</span>
                        <span className="font-bold ml-2">
                            {selectedTable === "all" ? "All" : selectedTable}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}