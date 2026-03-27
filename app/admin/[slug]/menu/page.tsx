/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Button from "@/components/Button";

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
            // 1. Get restaurant ID
            const restRes = await fetch(`/api/restaurant/by-slug/${slug}`);
            const restData = await restRes.json();
            if (!restData.success) return;
            const id = restData.restaurant._id;
            setRestaurantId(id);

            // 2. Fetch items and menu
            const itemsRes = await fetch(`/api/items?restaurantId=${id}`);
            const itemsData = await itemsRes.json();
            if (itemsData.success) setAllItems(itemsData.items);

            const menuRes = await fetch(`/api/menu?restaurantId=${id}`);
            const menuData = await menuRes.json();
            if (menuData.success && menuData.menu) {
                setMenu({
                    title: menuData.menu.title,
                    sections: menuData.menu.sections.map((s: any) => ({
                        name: s.name,
                        items: s.items.map((item: any) => item._id),
                    })),
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
        setMenu({ ...menu, sections: [...menu.sections, { name: newSectionName, items: [] }] });
        setNewSectionName("");
    };

    const removeSection = (index: number) => {
        setMenu({ ...menu, sections: menu.sections.filter((_, i) => i !== index) });
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
            <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading menu builder...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Menu Builder</h1>
                    <p className="text-gray-600 dark:text-gray-400">Organize your items into menu sections for customer display</p>
                </div>
                <Button 
                    onClick={saveMenu}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                    disabled={saving}
                >
                    {saving ? (
                        <div className="flex items-center">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Saving...
                        </div>
                    ) : (
                        <div className="flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Save Menu
                        </div>
                    )}
                </Button>
            </div>

            {/* Menu Title */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Menu Title</label>
                <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    value={menu.title}
                    onChange={(e) => setMenu({ ...menu, title: e.target.value })} 
                    placeholder="Enter menu title"
                />
            </div>

            {/* Add Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Add New Section</h3>
                <div className="flex gap-4">
                    <input
                        type="text"
                        className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        placeholder="Enter section name"
                        value={newSectionName} 
                        onChange={(e) => setNewSectionName(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && addSection()} 
                    />
                    <Button 
                        onClick={addSection}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                        <div className="flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Section
                        </div>
                    </Button>
                </div>
            </div>

            {/* Sections */}
            <div className="space-y-6">
                {menu.sections.map((section, sectionIndex) => (
                    <div key={sectionIndex} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{section.name}</h3>
                            <Button 
                                onClick={() => removeSection(sectionIndex)}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300"
                            >
                                <div className="flex items-center">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Remove Section
                                </div>
                            </Button>
                        </div>

                        {/* Items in Section */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Items in this section</label>
                            {section.items.length === 0 ? (
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                                    <p className="text-gray-500 dark:text-gray-400">No items added to this section yet</p>
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-3">
                                    {section.items.map((itemId) => {
                                        const item = allItems.find((i) => i._id === itemId);
                                        return item ? (
                                            <div key={itemId} className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 flex items-center gap-3">
                                                <span className="text-green-800 font-medium">{item.name}</span>
                                                <button 
                                                    onClick={() => removeItemFromSection(sectionIndex, itemId)}
                                                    className="text-red-500 hover:text-red-700 transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ) : null;
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Add Items */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Add items to section</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {allItems.filter((item) => !section.items.includes(item._id)).map((item) => (
                                    <button 
                                        key={item._id} 
                                        onClick={() => addItemToSection(sectionIndex, item._id)}
                                        className="text-left px-4 py-3 bg-gray-50 dark:bg-gray-700 hover:bg-green-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 hover:border-green-300 rounded-lg transition-all duration-200 hover:shadow-md"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {menu.sections.length === 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Sections Created</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">Start by creating your first menu section above</p>
                </div>
            )}
        </div>
    );
}