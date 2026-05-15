/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Plus, Pencil, Trash2, Search, X, ImagePlus, Check } from "lucide-react";

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

const CATEGORIES = ["General", "Starters", "Main Course", "Beverages", "Desserts", "Appetizers", "Soups", "Salads"];
const SPICE_LEVELS = [
    { value: "mild", label: "Mild" },
    { value: "medium", label: "Medium" },
    { value: "hot", label: "Hot" },
    { value: "extra-hot", label: "Extra hot" },
];

const emptyForm = {
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
};

export default function RestaurantItemsPage() {
    const params = useParams();
    const slug = params.slug as string;
    const [restaurantId, setRestaurantId] = useState<string | null>(null);
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Item | null>(null);
    const [formData, setFormData] = useState({ ...emptyForm });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>("");
    const [saving, setSaving] = useState(false);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        if (slug) loadAll();
    }, [slug]);

    const loadAll = async () => {
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
            if (data.success) setItems(data.items);
        } finally {
            setLoading(false);
        }
    };

    const openAdd = () => {
        setEditingItem(null);
        setFormData({ ...emptyForm });
        setImageFile(null);
        setImagePreview("");
        setDrawerOpen(true);
    };

    const openEdit = (item: Item) => {
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
        setImageFile(null);
        setImagePreview(item.image || "");
        setDrawerOpen(true);
    };

    const closeDrawer = () => {
        setDrawerOpen(false);
        setTimeout(() => {
            setEditingItem(null);
            setImageFile(null);
            setImagePreview("");
        }, 250);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const uploadImage = async (): Promise<string> => {
        if (!imageFile) return formData.image;
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(imageFile);
        });
        const res = await fetch("/api/upload-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: base64 }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || "Upload failed");
        return data.imageUrl;
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!restaurantId) return;
        setSaving(true);
        try {
            const imageUrl = await uploadImage();
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
                    setItems(items.map((i) => (i._id === editingItem._id ? data.item : i)));
                } else {
                    setItems([data.item, ...items]);
                }
                closeDrawer();
            } else {
                alert(data.error || "Failed to save");
            }
        } catch (err: any) {
            alert(err.message || "Failed to save");
        } finally {
            setSaving(false);
        }
    };

    const toggleAvailability = async (item: Item) => {
        if (!restaurantId) return;
        setUpdatingId(item._id);
        // Optimistic
        setItems(items.map((i) => (i._id === item._id ? { ...i, available: !i.available } : i)));
        try {
            await fetch(`/api/items/${item._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ available: !item.available, restaurantId }),
            });
        } catch {
            // Revert
            setItems(items.map((i) => (i._id === item._id ? { ...i, available: item.available } : i)));
        } finally {
            setUpdatingId(null);
        }
    };

    const handleDelete = async (item: Item) => {
        if (!confirm(`Delete "${item.name}"?`)) return;
        if (!restaurantId) return;
        setDeletingId(item._id);
        try {
            const res = await fetch(`/api/items/${item._id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ restaurantId }),
            });
            const data = await res.json();
            if (data.success) {
                setItems(items.filter((i) => i._id !== item._id));
            } else {
                alert(data.error || "Failed to delete");
            }
        } finally {
            setDeletingId(null);
        }
    };

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return items.filter((i) => {
            if (categoryFilter !== "all" && i.category !== categoryFilter) return false;
            if (q && !i.name.toLowerCase().includes(q) && !(i.description ?? "").toLowerCase().includes(q)) return false;
            return true;
        });
    }, [items, search, categoryFilter]);

    const categoriesPresent = useMemo(() => {
        const set = new Set(items.map((i) => i.category || "General"));
        return Array.from(set);
    }, [items]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-2 border-[#86A6DE]/30 border-t-[#324F7B] rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                    <p className="text-[10px] tracking-[0.3em] text-[#5067AA] uppercase">Items</p>
                    <h1 className="text-xl font-serif italic text-stone-900">
                        {items.length} {items.length === 1 ? "dish" : "dishes"} on the menu
                    </h1>
                </div>
                <button
                    onClick={openAdd}
                    className="inline-flex items-center gap-1.5 bg-[#324F7B] hover:bg-[#283f63] text-white px-4 py-2 rounded-full text-sm font-semibold transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Add item</span>
                </button>
            </div>

            {/* Search + filters */}
            <div className="flex items-center gap-2 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search dishes…"
                        className="w-full bg-white border border-stone-200 rounded-full pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#86A6DE]"
                    />
                </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar mb-4">
                <FilterChip active={categoryFilter === "all"} onClick={() => setCategoryFilter("all")}>
                    All <span className="ml-1 text-stone-400">{items.length}</span>
                </FilterChip>
                {categoriesPresent.map((c) => (
                    <FilterChip key={c} active={categoryFilter === c} onClick={() => setCategoryFilter(c)}>
                        {c}
                    </FilterChip>
                ))}
            </div>

            {/* Empty state */}
            {filtered.length === 0 && (
                <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center">
                    <p className="text-sm font-medium text-stone-900 mb-1">No items found</p>
                    <p className="text-xs text-stone-500 mb-4">
                        {items.length === 0 ? "Add your first dish to get started." : "Try a different search or filter."}
                    </p>
                    {items.length === 0 && (
                        <button
                            onClick={openAdd}
                            className="inline-flex items-center gap-1.5 bg-[#324F7B] hover:bg-[#283f63] text-white px-4 py-2 rounded-full text-sm font-semibold"
                        >
                            <Plus className="w-4 h-4" /> Add first item
                        </button>
                    )}
                </div>
            )}

            {/* Grid */}
            {filtered.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filtered.map((item) => (
                        <ItemRow
                            key={item._id}
                            item={item}
                            onEdit={() => openEdit(item)}
                            onDelete={() => handleDelete(item)}
                            onToggle={() => toggleAvailability(item)}
                            updating={updatingId === item._id}
                            deleting={deletingId === item._id}
                        />
                    ))}
                </div>
            )}

            {/* Drawer */}
            {drawerOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-stone-900/40 z-50"
                        onClick={closeDrawer}
                    />
                    <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl flex flex-col">
                        <div className="flex items-center justify-between px-5 py-3 border-b border-stone-200">
                            <h2 className="text-lg font-serif italic text-stone-900">
                                {editingItem ? "Edit item" : "New item"}
                            </h2>
                            <button
                                onClick={closeDrawer}
                                className="p-2 -mr-2 rounded-lg hover:bg-stone-100"
                            >
                                <X className="w-4 h-4 text-stone-600" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-4">
                            {/* Image */}
                            <div>
                                <label className="text-[11px] tracking-[0.2em] uppercase text-stone-400 mb-2 block">
                                    Photo
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                    id="image-upload"
                                />
                                <label
                                    htmlFor="image-upload"
                                    className="block cursor-pointer relative overflow-hidden rounded-xl border-2 border-dashed border-stone-200 hover:border-[#86A6DE] transition-colors"
                                >
                                    {imagePreview ? (
                                        <div className="relative w-full h-40">
                                            <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-stone-900/0 hover:bg-stone-900/20 flex items-center justify-center transition-colors">
                                                <span className="opacity-0 hover:opacity-100 bg-white/95 text-stone-900 text-xs font-medium px-3 py-1.5 rounded-full transition-opacity">
                                                    Change photo
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-8 text-stone-400">
                                            <ImagePlus className="w-6 h-6 mb-1" />
                                            <span className="text-xs">Click to upload</span>
                                        </div>
                                    )}
                                </label>
                            </div>

                            {/* Name + price */}
                            <div className="grid grid-cols-3 gap-3">
                                <Field label="Name" className="col-span-2" required>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        placeholder="Margherita pizza"
                                        className="input"
                                    />
                                </Field>
                                <Field label="Price ₹" required>
                                    <input
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        required
                                        min="0"
                                        step="1"
                                        placeholder="0"
                                        className="input tabular-nums"
                                    />
                                </Field>
                            </div>

                            {/* Description */}
                            <Field label="Description">
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Optional. What makes this dish special?"
                                    rows={2}
                                    className="input resize-none"
                                />
                            </Field>

                            {/* Category + calories */}
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Category">
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="input"
                                    >
                                        {CATEGORIES.map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </Field>
                                <Field label="Calories">
                                    <input
                                        type="number"
                                        value={formData.calories}
                                        onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                                        placeholder="optional"
                                        min="0"
                                        className="input tabular-nums"
                                    />
                                </Field>
                            </div>

                            {/* Dietary */}
                            <div>
                                <label className="text-[11px] tracking-[0.2em] uppercase text-stone-400 mb-2 block">Dietary</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(["isVeg", "isVegan", "isGlutenFree"] as const).map((key) => {
                                        const labels: Record<string, string> = { isVeg: "Veg", isVegan: "Vegan", isGlutenFree: "Gluten-free" };
                                        return (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, [key]: !formData[key] })}
                                                className={`px-3 py-2 rounded-full text-xs font-medium border transition-colors ${
                                                    formData[key]
                                                        ? "bg-[#324F7B] text-white border-[#324F7B]"
                                                        : "bg-white text-stone-700 border-stone-200 hover:border-[#86A6DE]"
                                                }`}
                                            >
                                                {labels[key]}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <Field label="Spice level">
                                <div className="flex gap-2">
                                    {SPICE_LEVELS.map((s) => (
                                        <button
                                            key={s.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, spiceLevel: s.value })}
                                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                                                formData.spiceLevel === s.value
                                                    ? "bg-[#324F7B] text-white border-[#324F7B]"
                                                    : "bg-white text-stone-700 border-stone-200 hover:border-[#86A6DE]"
                                            }`}
                                        >
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </Field>

                            <label className="flex items-center gap-3 px-3 py-2.5 bg-stone-50 rounded-xl cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.available}
                                    onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                                    className="w-4 h-4 accent-[#324F7B]"
                                />
                                <span className="text-sm text-stone-700">Available right now</span>
                            </label>
                        </form>

                        <div className="border-t border-stone-200 p-4 flex gap-2">
                            <button
                                onClick={closeDrawer}
                                type="button"
                                className="flex-1 px-4 py-2.5 rounded-full text-sm font-medium text-stone-700 hover:bg-stone-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave as any}
                                disabled={saving || !formData.name || !formData.price}
                                className="flex-1 px-4 py-2.5 rounded-full bg-[#324F7B] hover:bg-[#283f63] disabled:opacity-50 text-white text-sm font-semibold transition-colors"
                            >
                                {saving ? "Saving…" : editingItem ? "Save changes" : "Create item"}
                            </button>
                        </div>
                    </aside>
                </>
            )}

            <style jsx global>{`
                .input {
                    width: 100%;
                    background: white;
                    border: 1px solid #e7e5e4;
                    border-radius: 0.625rem;
                    padding: 0.5rem 0.75rem;
                    font-size: 0.875rem;
                    color: #1c1917;
                    transition: border-color 0.15s, box-shadow 0.15s;
                }
                .input:focus {
                    outline: none;
                    border-color: #86A6DE;
                    box-shadow: 0 0 0 2px rgba(134, 166, 222, 0.2);
                }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}

/* ── Components ───────────────────────────────────────────── */

function FilterChip({
    children,
    active,
    onClick,
}: {
    children: React.ReactNode;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                active
                    ? "bg-[#324F7B] text-white border-[#324F7B]"
                    : "bg-white text-stone-700 border-stone-200 hover:border-[#86A6DE]"
            }`}
        >
            {children}
        </button>
    );
}

function Field({
    label,
    children,
    required,
    className,
}: {
    label: string;
    children: React.ReactNode;
    required?: boolean;
    className?: string;
}) {
    return (
        <div className={className}>
            <label className="text-[11px] tracking-[0.2em] uppercase text-stone-400 mb-1 block">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {children}
        </div>
    );
}

function ItemRow({
    item,
    onEdit,
    onDelete,
    onToggle,
    updating,
    deleting,
}: {
    item: Item;
    onEdit: () => void;
    onDelete: () => void;
    onToggle: () => void;
    updating: boolean;
    deleting: boolean;
}) {
    return (
        <div
            className={`bg-white rounded-2xl border border-stone-200 overflow-hidden transition-all ${
                !item.available ? "opacity-60" : "hover:shadow-[0_8px_30px_rgba(50,79,123,0.08)]"
            }`}
        >
            <div className="flex gap-3 p-3">
                {/* Image */}
                <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0">
                    {item.image ? (
                        <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-300 text-2xl">
                            🍽
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-0.5">
                        <h3 className="text-sm font-semibold text-stone-900 line-clamp-1">{item.name}</h3>
                    </div>
                    <p className="text-xs text-stone-500 line-clamp-1 mb-1.5">
                        {item.category || "General"}
                        {item.calories ? ` · ${item.calories} cal` : ""}
                    </p>
                    <div className="flex items-center justify-between">
                        <span className="text-base font-semibold text-[#324F7B] tabular-nums">₹{item.price}</span>
                        <div className="flex items-center gap-1">
                            {item.isVegan && <Tag color="emerald">Vegan</Tag>}
                            {item.isVeg && !item.isVegan && <Tag color="emerald">Veg</Tag>}
                            {item.isGlutenFree && <Tag color="amber">GF</Tag>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between px-3 py-2 border-t border-stone-100 bg-stone-50/50">
                {/* Availability switch */}
                <button
                    onClick={onToggle}
                    disabled={updating}
                    className="flex items-center gap-2"
                    aria-label="Toggle availability"
                >
                    <span
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            item.available ? "bg-emerald-500" : "bg-stone-300"
                        } ${updating ? "opacity-60" : ""}`}
                    >
                        <span
                            className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                                item.available ? "translate-x-5" : "translate-x-1"
                            }`}
                        />
                    </span>
                    <span className={`text-xs font-medium ${item.available ? "text-emerald-700" : "text-stone-500"}`}>
                        {item.available ? "Available" : "Sold out"}
                    </span>
                </button>

                <div className="flex items-center gap-1">
                    <button
                        onClick={onEdit}
                        className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100 hover:text-[#324F7B] transition-colors"
                        aria-label="Edit"
                    >
                        <Pencil className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onDelete}
                        disabled={deleting}
                        className="p-1.5 rounded-lg text-stone-500 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                        aria-label="Delete"
                    >
                        {deleting ? (
                            <span className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin block" />
                        ) : (
                            <Trash2 className="w-4 h-4" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

function Tag({ children, color }: { children: React.ReactNode; color: "emerald" | "amber" }) {
    const tones: Record<string, string> = {
        emerald: "bg-emerald-50 text-emerald-700",
        amber: "bg-amber-50 text-amber-700",
    };
    return (
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${tones[color]}`}>{children}</span>
    );
}
