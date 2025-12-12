"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import QRCode from "qrcode";
import Image from "next/image";
import Link from "next/link";

interface Table {
    _id: string;
    tableNumber: number;
    slug: string;
    restaurantId: string;
    qrUrl?: string
}

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
            // Get restaurant ID
            const restRes = await fetch(`/api/restaurant/by-slug/${slug}`);
            const restData = await restRes.json();
            if (!restData.success) return;
            const id = restData.restaurant._id;
            setRestaurantId(id);

            // Fetch tables
            const res = await fetch(`/api/tables?restaurantId=${id}`);
            const data = await res.json();
            if (data.success) {
                const tablesData = data.tables || [];
                setTables(tablesData);
                generateQRCodes(tablesData);
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
                const url = `${window.location.origin}/r/${slug}/t/${table.slug}`;
                const qrDataUrl = await QRCode.toDataURL(url, { width: 200, margin: 1 });
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
        if (!confirm(`Delete Table ${table.tableNumber}? This action cannot be undone.`)) {
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
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                    <p className="text-gray-600 text-sm">Loading tables...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            {/* Header */}
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Tables</h1>
                        <p className="text-gray-600 text-sm mt-1">
                            {tables.length} {tables.length === 1 ? 'table' : 'tables'}
                        </p>
                    </div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-all w-full sm:w-auto"
                    >
                        {showForm ? 'Cancel' : 'Add Table'}
                    </button>
                </div>
            </div>

            {/* Add Table Form */}
            {showForm && (
                <div className="bg-white rounded-xl shadow border border-gray-200 p-4 mb-6">
                    <div className="mb-4">
                        <h2 className="font-semibold text-gray-900">Add New Table</h2>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Table Number *
                                </label>
                                <input
                                    type="number"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    value={formData.tableNumber}
                                    onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value })}
                                    onBlur={autoGenerateSlug}
                                    required
                                    min="1"
                                    placeholder="e.g., 1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Table Slug *
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                    placeholder="Auto-generated"
                                    required
                                />
                            </div>
                        </div>

                        {formData.slug && (
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs text-gray-600">
                                    Table URL:
                                </p>
                                <code className="text-xs bg-white px-2 py-1 rounded border border-gray-200 break-all">
                                    /r/{slug}/t/{formData.slug}
                                </code>
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            <button
                                type="submit"
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-all"
                            >
                                Create Table
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2.5 rounded-lg font-medium text-sm transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Tables Grid */}
            {tables.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {tables.map((table) => (
                        <div key={table._id} className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
                            <div className="p-4">
                                {/* Table Header */}
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Table {table.tableNumber}</h3>
                                        <p className="text-xs text-gray-600 font-mono mt-1">{table.slug}</p>
                                    </div>
                                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                        Active
                                    </span>
                                </div>

                                {/* QR Code */}
                                {qrCodes[table._id] && (
                                    <div className="text-center mb-4">
                                        <div className="bg-white p-3 rounded-lg border border-gray-200 inline-block">
                                            <Image
                                                src={qrCodes[table._id]}
                                                alt={`QR Code for Table ${table.tableNumber}`}
                                                className="w-40 h-40 mx-auto"
                                                width={460}
                                                height={460}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Table URL */}
                                <div className="mb-4">
                                    <div className="text-xs text-gray-600 mb-1">Table URL:</div>
                                    <div className="bg-gray-50 rounded-lg p-2">
                                        <code className="text-xs break-all">
                                            <Link href={`/r/${slug}/t/${table.slug}`}
                                                target="no_ref">
                                                /r/{slug}/t/{table.slug}
                                            </Link>
                                        </code>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="space-y-2">
                                    {qrCodes[table._id] && (
                                        <a
                                            href={qrCodes[table._id]}
                                            download={`table-${table.tableNumber}-qr.png`}
                                            className="block w-full bg-green-600 hover:bg-green-700 text-white text-center py-2 rounded-lg font-medium text-sm transition-all"
                                        >
                                            Download QR
                                        </a>
                                    )}

                                    <button
                                        onClick={() => handleDeleteTable(table)}
                                        disabled={deletingTableId === table._id}
                                        className="block w-full bg-red-600 hover:bg-red-700 text-white text-center py-2 rounded-lg font-medium text-sm transition-all disabled:opacity-50"
                                    >
                                        {deletingTableId === table._id ? 'Deleting...' : 'Delete Table'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : !showForm && (
                <div className="bg-white rounded-xl shadow border border-gray-200 p-8 text-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">No Tables</h3>
                    <p className="text-gray-600 text-sm mb-4">
                        Create tables to generate QR codes
                    </p>
                    <button
                        onClick={() => setShowForm(true)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-all"
                    >
                        Add First Table
                    </button>
                </div>
            )}
        </div>
    );
}