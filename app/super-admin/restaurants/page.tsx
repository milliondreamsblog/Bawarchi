/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import useSWR from "swr";
import Button from "@/components/Button";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function RestaurantsPage() {
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [updateLoading, setUpdateLoading] = useState<string | null>(null);

    const { data, error, mutate } = useSWR(
        `/api/auth/restaurants${statusFilter !== "all" ? `?status=${statusFilter}` : ""}`,
        fetcher,
        { refreshInterval: 5000 }
    );

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
        } catch (err) {
            alert("Failed to update status");
        } finally {
            setUpdateLoading(null);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            pending: "bg-yellow-100 text-yellow-800",
            approved: "bg-green-100 text-green-800",
            blocked: "bg-red-100 text-red-800",
        };
        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
                {status === "pending" && <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>}
                {status === "approved" && <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>}
                {status === "blocked" && <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>}
                {status}
            </span>
        );
    };

    if (error) {
        return (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="text-red-600 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Error loading restaurants
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center justify-center py-8">
                    <div className="flex flex-col items-center">
                        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                        <p className="text-gray-600">Loading restaurants...</p>
                    </div>
                </div>
            </div>
        );
    }

    const restaurants = data.restaurants || [];

    return (
        <div>
            {/* Header Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Restaurant Management</h2>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6">
                    {["all", "pending", "approved", "blocked"].map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setStatusFilter(filter)}
                            className={`px-4 py-2 rounded-lg font-medium capitalize transition-all duration-200 ${statusFilter === filter
                                    ? "bg-green-600 text-white shadow-md"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl">
                        <div className="text-2xl font-bold text-yellow-600">
                            {restaurants.filter((r: any) => r.status === "pending").length}
                        </div>
                        <div className="text-sm text-yellow-800 font-medium">Pending Approval</div>
                    </div>
                    <div className="bg-green-50 border border-green-200 p-4 rounded-xl">
                        <div className="text-2xl font-bold text-green-600">
                            {restaurants.filter((r: any) => r.status === "approved").length}
                        </div>
                        <div className="text-sm text-green-800 font-medium">Approved</div>
                    </div>
                    <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
                        <div className="text-2xl font-bold text-red-600">
                            {restaurants.filter((r: any) => r.status === "blocked").length}
                        </div>
                        <div className="text-sm text-red-800 font-medium">Blocked</div>
                    </div>
                </div>
            </div>

            {/* Restaurants List */}
            {restaurants.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Restaurants Found</h3>
                    <p className="text-gray-600">No restaurants match the current filter criteria.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {restaurants.map((restaurant: any) => (
                        <div key={restaurant._id} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-200">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <h3 className="text-xl font-semibold text-gray-900">{restaurant.name}</h3>
                                        {getStatusBadge(restaurant.status)}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                                        <div className="space-y-1">
                                            <p><strong className="text-gray-700">Owner:</strong> {restaurant.owner}</p>
                                            <p><strong className="text-gray-700">Email:</strong> {restaurant.email}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p><strong className="text-gray-700">Phone:</strong> {restaurant.phone}</p>
                                            <p>
                                                <strong className="text-gray-700">Registered:</strong>{" "}
                                                {new Date(restaurant.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    {restaurant.address && (
                                        <p className="text-sm text-gray-600 mt-3">
                                            <strong className="text-gray-700">Address:</strong> {restaurant.address}
                                        </p>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2 ml-4 flex-shrink-0">
                                    {restaurant.status === "pending" && (
                                        <>
                                            <Button
                                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                                                onClick={() => updateStatus(restaurant._id, "approved")}
                                                disabled={updateLoading === restaurant._id}
                                            >
                                                {updateLoading === restaurant._id ? (
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                ) : (
                                                    "Approve"
                                                )}
                                            </Button>
                                            <Button
                                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                                                onClick={() => updateStatus(restaurant._id, "blocked")}
                                                disabled={updateLoading === restaurant._id}
                                            >
                                                Reject
                                            </Button>
                                        </>
                                    )}

                                    {restaurant.status === "approved" && (
                                        <Button
                                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                                            onClick={() => updateStatus(restaurant._id, "blocked")}
                                            disabled={updateLoading === restaurant._id}
                                        >
                                            Block
                                        </Button>
                                    )}

                                    {restaurant.status === "blocked" && (
                                        <Button
                                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                                            onClick={() => updateStatus(restaurant._id, "approved")}
                                            disabled={updateLoading === restaurant._id}
                                        >
                                            Unblock
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}