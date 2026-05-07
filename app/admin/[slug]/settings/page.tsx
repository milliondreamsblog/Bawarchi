/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Button from "@/components/Button";

export default function RestaurantSettingsPage() {
    const params = useParams();
    const slug = params.slug as string;
    const [restaurantId, setRestaurantId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        razorpayKeyId: "",
        razorpayKeySecret: "",
        gstPercentage: 0,
    });

    useEffect(() => {
        if (slug) {
            fetchRestaurantAndSettings();
        }
    }, [slug]);

    const fetchRestaurantAndSettings = async () => {
        try {
            // 1. Get restaurant ID
            const restRes = await fetch(`/api/restaurant/by-slug/${slug}`);
            const restData = await restRes.json();
            if (!restData.success) return;
            const id = restData.restaurant._id;
            setRestaurantId(id);

            // 2. Fetch settings
            const res = await fetch(`/api/restaurant/${id}/settings`);
            const data = await res.json();
            if (data.success && data.settings) {
                setFormData({
                    razorpayKeyId: data.settings.razorpayKeyId || "",
                    razorpayKeySecret: data.settings.razorpayKeySecret || "",
                    gstPercentage: data.settings.gstPercentage || 0,
                });
            }
        } catch (error) {
            console.error("Failed to fetch settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!restaurantId) return;
        setSaving(true);

        try {
            const res = await fetch(`/api/restaurant/${restaurantId}/settings`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (data.success) {
                alert("Settings updated successfully!");
            } else {
                alert(data.error || "Failed to update settings");
            }
        } catch (error) {
            console.error("Failed to update settings:", error);
            alert(" Failed to update settings");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-[#324F7B] border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Restaurant Settings</h1>
                <p className="text-gray-600 dark:text-gray-400">Configure your payment gateway and restaurant settings</p>
            </div>

            {/* Payment Settings Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 max-w-2xl">
                <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-[#86A6DE]/20 rounded-xl flex items-center justify-center mr-4">
                        <svg className="w-5 h-5 text-[#324F7B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Payment & Billing Settings</h2>
                        <p className="text-gray-600 dark:text-gray-400">Configure payment gateway and GST</p>
                    </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
                    <div className="flex items-start">
                        <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <p className="text-blue-800 dark:text-blue-300 font-medium mb-1">Razorpay API Keys & GST Configuration</p>
                            <p className="text-blue-700 dark:text-blue-400 text-sm">
                                Enter your Razorpay Key ID and Key Secret to accept payments directly to your account.
                                You can find these in your Razorpay Dashboard under Settings &gt; API Keys.
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Razorpay Key ID
                        </label>
                        <input
                            type="text"
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-[#86A6DE] focus:border-[#5067AA] transition-colors"
                            value={formData.razorpayKeyId}
                            onChange={(e) =>
                                setFormData({ ...formData, razorpayKeyId: e.target.value })
                            }
                            placeholder="rzp_test_..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Razorpay Key Secret
                        </label>
                        <input
                            type="password"
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-[#86A6DE] focus:border-[#5067AA] transition-colors"
                            value={formData.razorpayKeySecret}
                            onChange={(e) =>
                                setFormData({ ...formData, razorpayKeySecret: e.target.value })
                            }
                            placeholder="Enter your key secret"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            GST Percentage
                        </label>
                        <select
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-[#86A6DE] focus:border-[#5067AA] transition-colors bg-white"
                            value={formData.gstPercentage}
                            onChange={(e) =>
                                setFormData({ ...formData, gstPercentage: parseInt(e.target.value) })
                            }
                        >
                            <option value={0}>0% (No GST)</option>
                            <option value={5}>5% GST</option>
                            <option value={12}>12% GST</option>
                            <option value={18}>18% GST</option>
                        </select>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Choose the applicable GST rate for your restaurant (as per Indian tax regulations)</p>
                    </div>

                    <div className="pt-4">
                        <Button
                            type="submit"
                            className="bg-[#324F7B] hover:bg-[#283f63] text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
                            disabled={saving}
                        >
                            {saving ? (
                                <div className="flex items-center">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Saving Settings...
                                </div>
                            ) : (
                                <div className="flex items-center">
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Save Settings
                                </div>
                            )}
                        </Button>
                    </div>
                </form>
            </div>

            {/* Additional Settings Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 max-w-2xl">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
                    <div className="flex items-center mb-4">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Restaurant Details</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">Update your restaurant name, contact information, and address.</p>
                    <Button variant="secondary" className="w-full">
                        Manage Restaurant Info
                    </Button>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
                    <div className="flex items-center mb-4">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Security</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">Change your password and manage account security settings.</p>
                    <Button variant="secondary" className="w-full">
                        Security Settings
                    </Button>
                </div>
            </div>
        </div>
    );
}