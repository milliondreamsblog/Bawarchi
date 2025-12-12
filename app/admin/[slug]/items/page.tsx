/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";

interface Item {
    _id: string;
    name: string;
    description?: string;
    price: number;
    category?: string;
    calories?: number;
    image?: string;
    available: boolean;
    restaurantId: string;
}

export default function RestaurantItemsPage() {
    const params = useParams();
    const slug = params.slug as string;
    const [restaurantId, setRestaurantId] = useState<string | null>(null);
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
    const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
    const [editingItem, setEditingItem] = useState<Item | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>("");
    const [uploadingImage, setUploadingImage] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: "",
        category: "General",
        calories: "",
        image: "",
        available: true,
    });

    useEffect(() => {
        if (slug) {
            fetchRestaurantAndItems();
        }
    }, [slug]);

    const fetchRestaurantAndItems = async () => {
        try {
            const restRes = await fetch(`/api/restaurant/by-slug/${slug}`);
            const restData = await restRes.json();

            if (!restData.success) {
                setLoading(false);
                return;
            }

            const id = restData.restaurant._id;
            setRestaurantId(id);

            const res = await fetch(`/api/items?restaurantId=${id}`);
            const data = await res.json();
            if (data.success) {
                setItems(data.items);
            }
        } catch (error) {
            console.error("Failed to fetch items:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadImageToCloudinary = async (): Promise<string> => {
        if (!imageFile) return "";

        setUploadingImage(true);
        try {
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve) => {
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(imageFile);
            });

            const base64 = await base64Promise;

            const uploadRes = await fetch("/api/upload-image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image: base64 }),
            });

            const uploadData = await uploadRes.json();

            if (!uploadData.success) {
                throw new Error(uploadData.error || "Failed to upload image");
            }

            return uploadData.imageUrl;
        } catch (error: any) {
            console.error("Image upload error:", error);
            alert(error.message || "Failed to upload image");
            return "";
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!restaurantId) return;

        try {
            let imageUrl = formData.image;
            if (imageFile) {
                imageUrl = await uploadImageToCloudinary();
                if (!imageUrl && imageFile) {
                    return;
                }
            }

            const res = await fetch(editingItem ? `/api/items/${editingItem._id}` : "/api/items", {
                method: editingItem ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name,
                    description: formData.description,
                    price: parseFloat(formData.price),
                    category: formData.category,
                    calories: formData.calories ? parseInt(formData.calories) : undefined,
                    image: imageUrl,
                    available: formData.available,
                    restaurantId,
                }),
            });

            const data = await res.json();

            if (data.success) {
                if (editingItem) {
                    setItems(items.map(item => item._id === editingItem._id ? data.item : item));
                } else {
                    setItems([...items, data.item]);
                }
                setShowForm(false);
                setEditingItem(null);
                setFormData({
                    name: "",
                    description: "",
                    price: "",
                    category: "General",
                    calories: "",
                    image: "",
                    available: true,
                });
                setImageFile(null);
                setImagePreview("");
            } else {
                alert(data.error || "Failed to create item");
            }
        } catch (error) {
            console.error("Failed to create item:", error);
            alert("Failed to create item");
        }
    };

    const handleEditItem = (item: Item) => {
        setEditingItem(item);
        setFormData({
            name: item.name,
            description: item.description || "",
            price: item.price.toString(),
            category: item.category || "General",
            calories: item.calories?.toString() || "",
            image: item.image || "",
            available: item.available,
        });
        if (item.image) {
            setImagePreview(item.image);
        }
        setShowForm(true);
    };

    const handleDeleteItem = async (item: Item) => {
        if (!confirm(`Delete "${item.name}"? This action cannot be undone.`)) {
            return;
        }

        if (!restaurantId) return;

        try {
            setDeletingItemId(item._id);
            const res = await fetch(`/api/items/${item._id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ restaurantId }),
            });

            const data = await res.json();

            if (data.success) {
                setItems(items.filter(i => i._id !== item._id));
            } else {
                alert(data.error || "Failed to delete item");
            }
        } catch (error) {
            console.error("Failed to delete item:", error);
            alert("Failed to delete item");
        } finally {
            setDeletingItemId(null);
        }
    };

    const toggleAvailability = async (itemId: string, currentStatus: boolean) => {
        if (!restaurantId) return;
        try {
            setUpdatingItemId(itemId);

            const response = await fetch(`/api/items/${itemId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ available: !currentStatus, restaurantId }),
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || "Failed to update item");
            }

            setItems(items.map(item =>
                item._id === itemId ? { ...item, available: !currentStatus } : item
            ));
        } catch (error: any) {
            console.error("Failed to update item availability:", error);
            alert(`Error: ${error.message || "Failed to update item"}`);
        } finally {
            setUpdatingItemId(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                    <p className="text-gray-600 text-sm">Loading items...</p>
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
                        <h1 className="text-xl font-bold text-gray-900">Menu Items</h1>
                        <p className="text-gray-600 text-sm mt-1">
                            {items.length} {items.length === 1 ? 'item' : 'items'}
                        </p>
                    </div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-medium transition-all text-sm w-full sm:w-auto"
                    >
                        {showForm ? 'Cancel' : 'Add New Item'}
                    </button>
                </div>
            </div>

            {/* Add Item Form */}
            {showForm && (
                <div className="bg-white rounded-xl shadow border border-gray-200 p-4 mb-6">
                    <div className="mb-4">
                        <h2 className="font-semibold text-gray-900">{editingItem ? 'Edit Item' : 'Add New Item'}</h2>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Image Upload */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Food Image
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="w-full text-sm text-gray-600 border border-gray-300 rounded-lg p-2"
                            />
                            {imagePreview && (
                                <div className="mt-2">
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Item Name *
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    placeholder="Enter item name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Category
                                </label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                >
                                    <option value="General">General</option>
                                    <option value="Starters">Starters</option>
                                    <option value="Main Course">Main Course</option>
                                    <option value="Beverages">Beverages</option>
                                    <option value="Desserts">Desserts</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description
                            </label>
                            <textarea
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                placeholder="Enter item description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={2}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Price (₹) *
                                </label>
                                <input
                                    type="number"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    placeholder="0.00"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    required
                                    min="0"
                                    step="1"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Calories
                                </label>
                                <input
                                    type="number"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    placeholder="Calories"
                                    value={formData.calories}
                                    onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                                    min="0"
                                />
                            </div>

                            <div className="flex items-center">
                                <div className="flex items-center space-x-2 w-full">
                                    <input
                                        type="checkbox"
                                        id="available"
                                        checked={formData.available}
                                        onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                                        className="w-4 h-4 text-green-600 rounded"
                                    />
                                    <label htmlFor="available" className="text-sm text-gray-700">
                                        Available
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={uploadingImage}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-all disabled:opacity-50"
                            >
                                {uploadingImage ? 'Uploading...' : editingItem ? 'Update Item' : 'Create Item'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowForm(false);
                                    setEditingItem(null);
                                    setImageFile(null);
                                    setImagePreview("");
                                }}
                                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2.5 rounded-lg font-medium text-sm transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Items Grid */}
            {items.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {items.map((item) => (
                        <div key={item._id} className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
                            {/* Item Image */}
                            {item.image && (
                                <div className="w-full h-40">
                                    <Image
                                        src={item.image}
                                        alt={item.name}
                                        className="w-full h-full object-cover"
                                        height={400}
                                        width={400}
                                    />
                                </div>
                            )}

                            <div className="p-4">
                                {/* Header */}
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-semibold text-gray-900 text-sm truncate">{item.name}</h3>
                                    <span className={`text-xs px-2 py-1 rounded-full ${item.available
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                        }`}>
                                        {item.available ? 'Available' : 'Unavailable'}
                                    </span>
                                </div>

                                {/* Description */}
                                {item.description && (
                                    <p className="text-gray-600 text-xs mb-3 line-clamp-2">{item.description}</p>
                                )}

                                {/* Details */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-bold text-green-600">
                                            ₹{item.price}
                                        </span>
                                        {item.calories && (
                                            <span className="text-xs text-gray-500">
                                                • {item.calories} kcal
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded">
                                        {item.category}
                                    </span>
                                </div>

                                {/* Action Buttons */}
                                <div className="space-y-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => handleEditItem(item)}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-xs font-medium transition-all"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteItem(item)}
                                            disabled={deletingItemId === item._id}
                                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                                        >
                                            {deletingItemId === item._id ? 'Deleting...' : 'Delete'}
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => toggleAvailability(item._id, item.available)}
                                        disabled={updatingItemId === item._id}
                                        className={`w-full py-2 rounded-lg text-xs font-medium transition-all ${item.available
                                            ? 'bg-red-600 hover:bg-red-700 text-white'
                                            : 'bg-green-600 hover:bg-green-700 text-white'
                                            } disabled:opacity-50`}
                                    >
                                        {updatingItemId === item._id
                                            ? 'Updating...'
                                            : item.available
                                                ? 'Mark Unavailable'
                                                : 'Mark Available'
                                        }
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : !showForm && (
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Menu Items</h3>
                    <p className="text-gray-600 text-sm mb-4">
                        Start by adding your first menu item
                    </p>
                    <button
                        onClick={() => setShowForm(true)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-all"
                    >
                        Add First Item
                    </button>
                </div>
            )}
        </div>
    );
}