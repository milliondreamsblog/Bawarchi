/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Item { _id: string; name: string; }
interface MenuSection { name: string; items: string[]; }
interface Menu { _id?: string; title: string; sections: MenuSection[]; }

export default function RestaurantMenuPage() {
    const params = useParams();
    const slug = params.slug as string;
    const [restaurantId, setRestaurantId] = useState<string | null>(null);
    const [menu, setMenu] = useState<Menu>({ title: "Restaurant Menu", sections: [] });
    const [allItems, setAllItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [newSectionName, setNewSectionName] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (slug) {
            fetchData();
        }
    }, [slug]);

    const fetchData = async () => {
        try {
            // Get restaurant ID
            const restRes = await fetch(`/api/restaurant/by-slug/${slug}`);
            const restData = await restRes.json();
            if (!restData.success) return;
            const id = restData.restaurant._id;
            setRestaurantId(id);

            // Fetch items
            const itemsRes = await fetch(`/api/items?restaurantId=${id}`);
            const itemsData = await itemsRes.json();
            if (itemsData.success) setAllItems(itemsData.items);

            // Fetch menu
            const menuRes = await fetch(`/api/menu?restaurantId=${id}`);
            const menuData = await menuRes.json();
            if (menuData.success && menuData.menu) {
                setMenu({
                    title: menuData.menu.title || "Restaurant Menu",
                    sections: menuData.menu.sections?.map((s: any) => ({
                        name: s.name,
                        items: s.items?.map((item: any) => item._id) || [],
                    })) || [],
                });
            }
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    };

    const addSection = () => {
        if (!newSectionName.trim()) return;
        setMenu({ 
            ...menu, 
            sections: [...menu.sections, { name: newSectionName, items: [] }] 
        });
        setNewSectionName("");
    };

    const removeSection = (index: number) => {
        setMenu({ 
            ...menu, 
            sections: menu.sections.filter((_, i) => i !== index) 
        });
    };

    const addItemToSection = (sectionIndex: number, itemId: string) => {
        const newSections = [...menu.sections];
        if (!newSections[sectionIndex].items.includes(itemId)) {
            newSections[sectionIndex].items.push(itemId);
            setMenu({ ...menu, sections: newSections });
        }
    };

    const removeItemFromSection = (sectionIndex: number, itemId: string) => {
        const newSections = [...menu.sections];
        newSections[sectionIndex].items = newSections[sectionIndex].items.filter(id => id !== itemId);
        setMenu({ ...menu, sections: newSections });
    };

    const saveMenu = async () => {
        if (!restaurantId) return;
        setSaving(true);
        try {
            const res = await fetch("/api/menu", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...menu, restaurantId }),
            });
            const data = await res.json();
            if (data.success) {
                alert("Menu saved successfully!");
            } else {
                alert(data.error || "Failed to save menu");
            }
        } catch (error) {
            alert("Failed to save menu");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                    <p className="text-gray-600 text-sm">Loading menu...</p>
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
                        <h1 className="text-xl font-bold text-gray-900">Menu Builder</h1>
                        <p className="text-gray-600 text-sm mt-1">
                            Organize items into sections
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={saveMenu}
                            disabled={saving}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-all disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Menu'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Menu Title */}
            <div className="bg-white rounded-xl shadow border border-gray-200 p-4 mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Menu Title</label>
                <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    value={menu.title}
                    onChange={(e) => setMenu({ ...menu, title: e.target.value })} 
                    placeholder="Enter menu title"
                />
            </div>

            {/* Add Section */}
            <div className="bg-white rounded-xl shadow border border-gray-200 p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Add New Section</h3>
                <div className="flex flex-col sm:flex-row gap-2">
                    <input 
                        type="text" 
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="Section name"
                        value={newSectionName} 
                        onChange={(e) => setNewSectionName(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && addSection()} 
                    />
                    <button 
                        onClick={addSection}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-all"
                    >
                        Add Section
                    </button>
                </div>
            </div>

            {/* Sections */}
            <div className="space-y-4">
                {menu.sections.map((section, sectionIndex) => (
                    <div key={sectionIndex} className="bg-white rounded-xl shadow border border-gray-200 p-4">
                        {/* Section Header */}
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-gray-900">{section.name}</h3>
                            <button 
                                onClick={() => removeSection(sectionIndex)}
                                className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors"
                            >
                                Remove
                            </button>
                        </div>

                        {/* Items in Section */}
                        <div className="mb-4">
                            <div className="text-sm text-gray-600 mb-2">Items ({section.items.length})</div>
                            {section.items.length === 0 ? (
                                <div className="bg-gray-50 rounded-lg p-3 text-center">
                                    <p className="text-gray-500 text-sm">No items added yet</p>
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {section.items.map((itemId) => {
                                        const item = allItems.find((i) => i._id === itemId);
                                        return item ? (
                                            <div key={itemId} className="bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 flex items-center gap-2">
                                                <span className="text-green-800 text-sm truncate max-w-[120px]">{item.name}</span>
                                                <button 
                                                    onClick={() => removeItemFromSection(sectionIndex, itemId)}
                                                    className="text-red-500 hover:text-red-700 text-xs transition-colors"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ) : null;
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Add Items */}
                        <div>
                            <div className="text-sm text-gray-600 mb-2">Add items</div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {allItems
                                    .filter((item) => !section.items.includes(item._id))
                                    .map((item) => (
                                        <button 
                                            key={item._id} 
                                            onClick={() => addItemToSection(sectionIndex, item._id)}
                                            className="text-left px-3 py-2 bg-gray-50 hover:bg-green-50 border border-gray-200 hover:border-green-300 rounded-lg transition-all text-sm"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="truncate">{item.name}</span>
                                                <span className="text-green-600 text-xs">+ Add</span>
                                            </div>
                                        </button>
                                    ))
                                }
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {menu.sections.length === 0 && !loading && (
                <div className="bg-white rounded-xl shadow border border-gray-200 p-8 text-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">No Sections Yet</h3>
                    <p className="text-gray-600 text-sm mb-4">
                        Create sections to organize your menu items
                    </p>
                </div>
            )}
        </div>
    );
}