/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Button from "@/components/Button";

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
    isVeg?: boolean;
    isVegan?: boolean;
    isGlutenFree?: boolean;
    spiceLevel?: string;
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
        isVeg: false,
        isVegan: false,
        isGlutenFree: false,
        spiceLevel: "medium",
    });

    useEffect(() => {
        if (slug) {
            fetchRestaurantAndItems();
        }
    }, [slug]);

    const fetchRestaurantAndItems = async () => {
        try {
            // 1. Get restaurant ID from slug
            const restRes = await fetch(`/api/restaurant/by-slug/${slug}`);
            const restData = await restRes.json();

            if (!restData.success) {
                console.error("Restaurant not found");
                setLoading(false);
                return;
            }

            const id = restData.restaurant._id;
            setRestaurantId(id);

            // 2. Fetch items using ID
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
            // Create preview
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
            // Upload image first if there is one
            let imageUrl = formData.image;
            if (imageFile) {
                imageUrl = await uploadImageToCloudinary();
                if (!imageUrl && imageFile) {
                    // Upload failed, don't proceed
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
                    isVeg: formData.isVeg,
                    isVegan: formData.isVegan,
                    isGlutenFree: formData.isGlutenFree,
                    spiceLevel: formData.spiceLevel,
                }),
            });

            const data = await res.json();

            if (data.success) {
                if (editingItem) {
                    // Update existing item
                    setItems(items.map(item => item._id === editingItem._id ? data.item : item));
                } else {
                    // Add new item
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
                    isVeg: false,
                    isVegan: false,
                    isGlutenFree: false,
                    spiceLevel: "medium",
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
            isVeg: item.isVeg ?? false,
            isVegan: item.isVegan ?? false,
            isGlutenFree: item.isGlutenFree ?? false,
            spiceLevel: item.spiceLevel ?? "medium",
        });
        if (item.image) {
            setImagePreview(item.image);
        }
        setShowForm(true);
    };

    const handleDeleteItem = async (item: Item) => {
        if (!confirm(`Delete "${item.name}"?\n\nThis will permanently remove this item from your menu. This action cannot be undone.`)) {
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
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ available: !currentStatus, restaurantId }),
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || "Failed to update item");
            }

            setItems(items.map(item =>
                item._id === itemId ? { ...item, available: !currentStatus } : item
            ));

            console.log(`✅ Item ${itemId} availability updated to ${!currentStatus}`);
        } catch (error: any) {
            console.error("Failed to update item availability:", error);
            alert(`Error: ${error.message || "Failed to update item"}`);
        } finally {
            setUpdatingItemId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading menu items...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Menu Items</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Manage your restaurant menu ({items.length} {items.length === 1 ? 'item' : 'items'})
                    </p>
                </div>
                <Button
                    variant="primary"
                    onClick={() => setShowForm(!showForm)}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
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
                            Add New Item
                        </div>
                    )}
                </Button>
            </div>

            {/* Add Item Form */}
            {showForm && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 mb-8">
                    <div className="flex items-center mb-6">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</h2>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Image Upload Section */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Food Image
                            </label>
                            <div className="flex items-center space-x-4">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                    id="image-upload"
                                    required={!editingItem}
                                />
                                <label
                                    htmlFor="image-upload"
                                    className="cursor-pointer bg-white dark:bg-gray-700 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center dark:text-white"
                                >
                                    <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Choose Image
                                </label>
                                {imageFile && (
                                    <span className="text-sm text-gray-600 dark:text-gray-400">{imageFile.name}</span>
                                )}
                            </div>
                            {imagePreview && (
                                <div className="mt-4">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Preview:</p>
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="w-48 h-48 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Item Name *
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                    placeholder="Enter item name"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Category
                                </label>
                                <select
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                    value={formData.category}
                                    onChange={(e) =>
                                        setFormData({ ...formData, category: e.target.value })
                                    }
                                >
                                    <option value="General">General</option>
                                    <option value="Starters">Starters</option>
                                    <option value="Main Course">Main Course</option>
                                    <option value="Beverages">Beverages</option>
                                    <option value="Desserts">Desserts</option>
                                    <option value="Appetizers">Appetizers</option>
                                    <option value="Soups">Soups</option>
                                    <option value="Salads">Salads</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Description
                            </label>
                            <textarea
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-none"
                                placeholder="Enter item description"
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Price (₹) *
                                </label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                    placeholder="0.00"
                                    value={formData.price}
                                    onChange={(e) =>
                                        setFormData({ ...formData, price: e.target.value })
                                    }
                                    required
                                    min="0"
                                    step="1"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Calories
                                </label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                    placeholder="Enter calories"
                                    value={formData.calories}
                                    onChange={(e) =>
                                        setFormData({ ...formData, calories: e.target.value })
                                    }
                                    min="0"
                                />
                            </div>

                            <div className="flex items-center justify-center">
                                <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg w-full">
                                    <input
                                        type="checkbox"
                                        id="available"
                                        checked={formData.available}
                                        onChange={(e) =>
                                            setFormData({ ...formData, available: e.target.checked })
                                        }
                                        className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                                    />
                                    <label htmlFor="available" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Available for ordering
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Dietary Tags */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Dietary Tags</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {[
                                    { key: "isVeg",       label: "🟢 Vegetarian" },
                                    { key: "isVegan",     label: "🌱 Vegan" },
                                    { key: "isGlutenFree",label: "🌾 Gluten-Free" },
                                ].map(({ key, label }) => (
                                    <label key={key} className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 cursor-pointer transition-colors ${
                                        formData[key as keyof typeof formData]
                                            ? "border-green-500 bg-green-50 text-green-700"
                                            : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                                    }`}>
                                        <input
                                            type="checkbox"
                                            className="sr-only"
                                            checked={!!formData[key as keyof typeof formData]}
                                            onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                                        />
                                        <span className="text-sm font-medium">{label}</span>
                                    </label>
                                ))}
                                <div>
                                    <select
                                        value={formData.spiceLevel}
                                        onChange={(e) => setFormData({ ...formData, spiceLevel: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                                    >
                                        <option value="mild">🌶️ Mild</option>
                                        <option value="medium">🌶️🌶️ Medium</option>
                                        <option value="hot">🌶️🌶️🌶️ Hot</option>
                                        <option value="extra-hot">🌶️🌶️🌶️🌶️ Extra Hot</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <Button
                                type="submit"
                                disabled={uploadingImage}
                                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {uploadingImage ? (
                                    <div className="flex items-center">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Uploading Image...
                                    </div>
                                ) : (
                                    <div className="flex items-center">
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Create Item
                                    </div>
                                )}
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => {
                                    setShowForm(false);
                                    setEditingItem(null);
                                    setImageFile(null);
                                    setImagePreview("");
                                }}
                                className="px-8 py-3 rounded-lg font-semibold transition-all duration-300"
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item) => (
                    <div key={item._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-300">
                        {/* Item Image */}
                        {item.image && (
                            <div
                                className="w-full h-48 bg-cover bg-center rounded-lg mb-4"
                                style={{ backgroundImage: `url(${item.image})` }}
                            />
                        )}

                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{item.name}</h3>
                            <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${item.available
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                    }`}
                            >
                                {item.available ? (
                                    <div className="flex items-center">
                                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                        Available
                                    </div>
                                ) : (
                                    <div className="flex items-center">
                                        <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                                        Unavailable
                                    </div>
                                )}
                            </span>
                        </div>

                        {item.description && (
                            <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">{item.description}</p>
                        )}

                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-4">
                                <span className="text-2xl font-bold text-green-600">
                                    ₹{item.price}
                                </span>
                                {item.calories && (
                                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                        {item.calories} kcal
                                    </span>
                                )}
                            </div>
                            <span className="text-sm font-medium text-gray-700 bg-blue-100 px-3 py-1 rounded-full">
                                {item.category}
                            </span>
                        </div>

                        {/* Dietary Badges */}
                        {(item.isVeg || item.isVegan || item.isGlutenFree || (item.spiceLevel && item.spiceLevel !== "medium")) && (
                            <div className="flex flex-wrap gap-1.5 mb-4">
                                {item.isVegan && (
                                    <span className="text-xs font-medium bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">🌱 Vegan</span>
                                )}
                                {item.isVeg && !item.isVegan && (
                                    <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">🟢 Veg</span>
                                )}
                                {item.isGlutenFree && (
                                    <span className="text-xs font-medium bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">🌾 GF</span>
                                )}
                                {item.spiceLevel === "mild" && (
                                    <span className="text-xs font-medium bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">🌶️ Mild</span>
                                )}
                                {item.spiceLevel === "hot" && (
                                    <span className="text-xs font-medium bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">🌶️🌶️🌶️ Hot</span>
                                )}
                                {item.spiceLevel === "extra-hot" && (
                                    <span className="text-xs font-medium bg-red-100 text-red-700 px-2 py-0.5 rounded-full">🌶️🌶️🌶️🌶️ Extra Hot</span>
                                )}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <button
                                onClick={() => handleEditItem(item)}
                                className="flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit
                            </button>
                            <button
                                onClick={() => handleDeleteItem(item)}
                                disabled={deletingItemId === item._id}
                                className="flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {deletingItemId === item._id ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Deleting
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Delete
                                    </>
                                )}
                            </button>
                        </div>

                        <button
                            onClick={() => toggleAvailability(item._id, item.available)}
                            disabled={updatingItemId === item._id}
                            className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 ${item.available
                                ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl'
                                : 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {updatingItemId === item._id ? (
                                <div className="flex items-center justify-center">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Updating...
                                </div>
                            ) : item.available ? (
                                <div className="flex items-center justify-center">
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Mark Unavailable
                                </div>
                            ) : (
                                <div className="flex items-center justify-center">
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Mark Available
                                </div>
                            )}
                        </button>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {items.length === 0 && !showForm && (
                <div className="text-center py-16">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Menu Items Yet</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                        Start building your menu by adding your first item. Customers will see these items when they scan your QR codes.
                    </p>
                    <Button
                        onClick={() => setShowForm(true)}
                        className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                        <div className="flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create Your First Item
                        </div>
                    </Button>
                </div>
            )}
        </div>
    );
}
