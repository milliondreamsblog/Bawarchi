/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface InventoryItem {
  _id: string;
  name: string;
  category: string;
  stock: number;
  lowStockThreshold: number;
  available: boolean;
  image: string;
  price: number;
}

export default function InventoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (slug) fetchData();
  }, [slug]);

  const fetchData = async () => {
    try {
      const restRes = await fetch(`/api/restaurant/by-slug/${slug}`);
      const restData = await restRes.json();
      if (!restData.success) return;
      const id = restData.restaurant._id;
      setRestaurantId(id);

      const res = await fetch(`/api/inventory?restaurantId=${id}`);
      const data = await res.json();
      if (data.success) setItems(data.items);
    } catch (err) {
      console.error("Failed to load inventory:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateStock = async (itemId: string, stock: number) => {
    setUpdatingId(itemId);
    try {
      const res = await fetch(`/api/inventory/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock }),
      });
      const data = await res.json();
      if (data.success) {
        setItems(items.map((i) => (i._id === itemId ? { ...i, stock, available: stock !== 0 } : i)));
      }
    } catch {
      alert("Failed to update stock");
    } finally {
      setUpdatingId(null);
    }
  };

  const getStockColor = (item: InventoryItem) => {
    if (item.stock === -1) return "text-gray-500 dark:text-gray-400";
    if (item.stock === 0) return "text-red-600";
    if (item.stock <= item.lowStockThreshold) return "text-yellow-600";
    return "text-green-600";
  };

  const getStockBg = (item: InventoryItem) => {
    if (item.stock === -1) return "bg-gray-100 dark:bg-gray-700";
    if (item.stock === 0) return "bg-red-50 dark:bg-red-900/30";
    if (item.stock <= item.lowStockThreshold) return "bg-yellow-50 dark:bg-yellow-900/30";
    return "bg-green-50 dark:bg-green-900/30";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading inventory...</p>
        </div>
      </div>
    );
  }

  const lowStockItems = items.filter((i) => i.stock > 0 && i.stock <= i.lowStockThreshold);
  const outOfStockItems = items.filter((i) => i.stock === 0);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Inventory Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Track stock levels and manage item availability</p>
      </div>

      {/* Alerts */}
      {(outOfStockItems.length > 0 || lowStockItems.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {outOfStockItems.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold text-red-800 dark:text-red-300">Out of Stock ({outOfStockItems.length})</span>
              </div>
              <p className="text-red-700 dark:text-red-400 text-sm">
                {outOfStockItems.map((i) => i.name).join(", ")}
              </p>
            </div>
          )}
          {lowStockItems.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="font-semibold text-yellow-800 dark:text-yellow-300">Low Stock ({lowStockItems.length})</span>
              </div>
              <p className="text-yellow-700 dark:text-yellow-400 text-sm">
                {lowStockItems.map((i) => `${i.name} (${i.stock} left)`).join(", ")}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Inventory Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Item</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Category</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Price</th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Stock</th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {item.image && (
                        <div
                          className="w-10 h-10 rounded-lg bg-cover bg-center flex-shrink-0"
                          style={{ backgroundImage: `url(${item.image})` }}
                        />
                      )}
                      <span className="font-medium text-gray-900 dark:text-white">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{item.category}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-green-600">{"\u20B9"}{item.price}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${getStockBg(item)} ${getStockColor(item)}`}>
                      {item.stock === -1 ? "\u221E Unlimited" : item.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {item.stock === 0 ? (
                      <span className="text-xs font-medium bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 px-2 py-1 rounded-full">Out of Stock</span>
                    ) : item.stock > 0 && item.stock <= item.lowStockThreshold ? (
                      <span className="text-xs font-medium bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400 px-2 py-1 rounded-full">Low Stock</span>
                    ) : (
                      <span className="text-xs font-medium bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">In Stock</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <input
                        type="number"
                        min="-1"
                        defaultValue={item.stock}
                        onBlur={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val) && val !== item.stock) {
                            updateStock(item._id, val);
                          }
                        }}
                        className="w-20 px-2 py-1 text-center border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        disabled={updatingId === item._id}
                      />
                      <div className="flex gap-1">
                        <button
                          onClick={() => updateStock(item._id, item.stock + 10)}
                          disabled={updatingId === item._id}
                          className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded font-medium disabled:opacity-50"
                        >
                          +10
                        </button>
                        <button
                          onClick={() => updateStock(item._id, -1)}
                          disabled={updatingId === item._id}
                          className="px-2 py-1 text-xs bg-gray-500 hover:bg-gray-600 text-white rounded font-medium disabled:opacity-50"
                          title="Set to unlimited"
                        >
                          {"\u221E"}
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {items.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No items found. Add items in the Manage Items page first.</p>
          </div>
        )}
      </div>
    </div>
  );
}
