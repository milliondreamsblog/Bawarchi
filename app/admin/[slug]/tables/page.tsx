"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Button from "@/components/Button";
import QRCode from "qrcode";
import Image from "next/image";

interface Table { _id: string; tableNumber: number; slug: string; restaurantId: string; qrUrl: string }

export default function RestaurantTablesPage() {
    const params = useParams();
    const slug = params.slug as string;
    const [restaurantId, setRestaurantId] = useState<string | null>(null);
    const [tables, setTables] = useState<Table[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ tableNumber: "", slug: "" });
    const [qrCodes, setQrCodes] = useState<{ [key: string]: string }>({});
    const [deletingTableId, setDeletingTableId] = useState<string | null>(null);

    useEffect(() => {
        if (slug) {
            fetchRestaurantAndTables();
        }
    }, [slug]);

    const fetchRestaurantAndTables = async () => {
        try {
            // 1. Get restaurant ID
            const restRes = await fetch(`/api/restaurant/by-slug/${slug}`);
            const restData = await restRes.json();
            if (!restData.success) return;
            const id = restData.restaurant._id;
            setRestaurantId(id);

            // 2. Fetch tables
            const res = await fetch(`/api/tables?restaurantId=${id}`);
            const data = await res.json();
            if (data.success) {
                setTables(data.tables);
                generateQRCodes(data.tables);
            }
        } catch (error) {
            console.error("Failed to fetch tables:", error);
        } finally {
            setLoading(false);
        }
    };

    const generateQRCodes = async (tablesData: Table[]) => {
        const codes: { [key: string]: string } = {};
        for (const table of tablesData) {
            try {
                const url = `${process.env.NEXT_PUBLIC_BASE_URL}/r/${slug}/t/${table.slug}`;
                const qrDataUrl = await QRCode.toDataURL(url, { width: 200, margin: 2 });
                codes[table._id] = qrDataUrl;
            } catch (error) {
                console.error(`Failed to generate QR for ${table.slug}:`, error);
            }
        }
        setQrCodes(codes);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!restaurantId) return;

        try {
            const res = await fetch("/api/tables", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tableNumber: parseInt(formData.tableNumber),
                    slug: formData.slug,
                    restaurantId,
                }),
            });
            const data = await res.json();
            if (data.success) {
                const newTables = [...tables, data.table];
                setTables(newTables);
                generateQRCodes(newTables);
                setShowForm(false);
                setFormData({ tableNumber: "", slug: "" });
            } else {
                alert(data.error || "Failed to create table");
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            alert("Failed to create table");
        }
    };

    const autoGenerateSlug = () => {
        const num = formData.tableNumber;
        if (num && restaurantId) {
            const prefix = restaurantId.substring(0, 7).toUpperCase();
            const slug = `R${prefix}-T${num}`;
            setFormData({ ...formData, slug });
        }
    };

    const handleDeleteTable = async (table: Table) => {
        if (!confirm(`Delete Table ${table.tableNumber}?\n\nThis will permanently delete the table and its QR code. This action cannot be undone.`)) {
            return;
        }

        if (!restaurantId) return;

        try {
            setDeletingTableId(table._id);
            const res = await fetch(`/api/tables/${table._id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ restaurantId }),
            });

            const data = await res.json();

            if (data.success) {
                setTables(tables.filter(t => t._id !== table._id));
                const newQrCodes = { ...qrCodes };
                delete newQrCodes[table._id];
                setQrCodes(newQrCodes);
            } else {
                alert(data.error || "Failed to delete table");
            }
        } catch (error) {
            console.error("Failed to delete table:", error);
            alert("Failed to delete table");
        } finally {
            setDeletingTableId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-[#324F7B] border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading tables...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Table Management</h1>
                    <p className="text-gray-600 dark:text-gray-400">Create tables and generate QR codes for customer ordering</p>
                </div>
                <Button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-[#324F7B] hover:bg-[#283f63] text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                    {showForm ? (
                        <div className="flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancel
                        </div>
                    ) : (
                        <div className="flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Table
                        </div>
                    )}
                </Button>
            </div>

            {/* Add Table Form */}
            {showForm && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 mb-8">
                    <div className="flex items-center mb-6">
                        <div className="w-10 h-10 bg-[#86A6DE]/20 rounded-xl flex items-center justify-center mr-4">
                            <svg className="w-5 h-5 text-[#324F7B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add New Table</h2>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Table Number *
                                </label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-[#86A6DE] focus:border-[#5067AA] transition-colors"
                                    value={formData.tableNumber}
                                    onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value })}
                                    onBlur={autoGenerateSlug}
                                    required
                                    min="1"
                                    placeholder="Enter table number"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Table Slug *
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-[#86A6DE] focus:border-[#5067AA] transition-colors"
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                    placeholder="Auto-generated slug"
                                    required
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                    Unique identifier for the table URL. Auto-generated for security.
                                </p>
                            </div>
                        </div>

                        {/* Preview */}
                        {formData.slug && (
                            <div className="bg-[#86A6DE]/10 border border-[#86A6DE]/40 rounded-xl p-4">
                                <p className="text-sm text-[#324F7B]">
                                    <strong>Table URL Preview:</strong><br />
                                    <code className="text-xs bg-[#86A6DE]/20 px-2 py-1 rounded">
                                        {process.env.NEXT_PUBLIC_BASE_URL}/r/{slug}/t/{formData.slug}
                                    </code>
                                </p>
                            </div>
                        )}

                        <div className="flex gap-4 pt-4">
                            <Button
                                type="submit"
                                className="bg-[#324F7B] hover:bg-[#283f63] text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                            >
                                <div className="flex items-center">
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Create Table
                                </div>
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setShowForm(false)}
                                className="px-8 py-3 rounded-lg font-semibold transition-all duration-300"
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Tables Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tables.map((table) => (
                    <div key={table._id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-200">
                        {/* Table Header */}
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Table {table.tableNumber}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                    {table.slug}
                                </p>
                            </div>
                            <div className="bg-[#86A6DE]/20 text-[#324F7B] px-2 py-1 rounded-full text-xs font-medium">
                                Active
                            </div>
                        </div>

                        {/* QR Code */}
                        {table.qrUrl && (
                            <div className="text-center mb-4">
                                <div className="bg-white p-4 rounded-xl border border-gray-200 dark:border-gray-600 inline-block">
                                    <Image
                                        src={table.qrUrl}
                                        alt={`QR Code for Table ${table.tableNumber}`}
                                        className="mx-auto rounded-lg"
                                        width={460}
                                        height={460}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Table Info */}
                        <div className="space-y-3">
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                                <a
                                    href={`/r/${slug}/t/${table.slug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#324F7B] hover:text-[#324F7B] hover:underline break-all"
                                >
                                    /r/{slug}/t/{table.slug}
                                </a>
                            </div>

                            {/* Download Button */}
                            {table.qrUrl && (
                                <a
                                    href={qrCodes[table._id]}
                                    download={`table-${table.tableNumber}-qr.png`}
                                    className="block w-full bg-[#324F7B] hover:bg-[#283f63] text-white text-center py-3 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
                                >
                                    <div className="flex items-center justify-center">
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Download QR Code
                                    </div>
                                </a>
                            )}

                            {/* Delete Button */}
                            <button
                                onClick={() => handleDeleteTable(table)}
                                disabled={deletingTableId === table._id}
                                className="block w-full bg-red-600 hover:bg-red-700 text-white text-center py-3 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed mt-3"
                            >
                                {deletingTableId === table._id ? (
                                    <div className="flex items-center justify-center">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Deleting...
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center">
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Delete Table
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {tables.length === 0 && !showForm && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Tables Created</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">Create your first table to generate QR codes for customer ordering</p>
                    <Button
                        onClick={() => setShowForm(true)}
                        className="bg-[#324F7B] hover:bg-[#283f63] text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                        <div className="flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create First Table
                        </div>
                    </Button>
                </div>
            )}
        </div>
    );
}

