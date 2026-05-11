/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  Plus,
  Save,
  X,
  GripVertical,
  Search,
  Trash2,
  MoreHorizontal,
  Check,
  Pencil,
  ChevronRight,
  BookOpen,
  Sparkles,
} from "lucide-react";
import MenuIngestModal from "@/components/admin/MenuIngestModal";

interface Item {
  _id: string;
  name: string;
  price: number;
  image?: string;
  isVeg?: boolean;
  category?: string;
}
interface MenuSection {
  name: string;
  items: string[];
}
interface Menu {
  title: string;
  sections: MenuSection[];
}

type DragPayload =
  | { kind: "item"; id: string; from: number | null }
  | { kind: "col"; index: number };

export default function RestaurantMenuPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [menu, setMenu] = useState<Menu>({ title: "Restaurant Menu", sections: [] });
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const [search, setSearch] = useState("");
  const [newSectionName, setNewSectionName] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingSection, setEditingSection] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [showIngest, setShowIngest] = useState(false);

  const drag = useRef<DragPayload | null>(null);
  const [over, setOver] = useState<{ kind: "lib" | "col"; index?: number } | null>(null);

  useEffect(() => {
    if (slug) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Cmd/Ctrl+S to save
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isSave = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s";
      if (isSave) {
        e.preventDefault();
        if (dirty && !saving) saveMenu();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, saving, menu, restaurantId]);

  // Close kebab on outside click
  useEffect(() => {
    if (!openMenu) return;
    const close = () => setOpenMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [openMenu]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    function beforeUnload(e: BeforeUnloadEvent) {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);

  async function fetchData() {
    try {
      const r = await fetch(`/api/restaurant/by-slug/${slug}`).then((x) => x.json());
      if (!r.success) return;
      setRestaurantId(r.restaurant._id);

      const [it, mn] = await Promise.all([
        fetch(`/api/items?restaurantId=${r.restaurant._id}`).then((x) => x.json()),
        fetch(`/api/menu?restaurantId=${r.restaurant._id}`).then((x) => x.json()),
      ]);
      if (it.success) setItems(it.items);
      if (mn.success && mn.menu) {
        // Single-section-per-item: dedupe across sections, keep first occurrence
        const seen = new Set<string>();
        const sections: MenuSection[] = (mn.menu.sections || []).map((s: any) => ({
          name: s.name,
          items: (s.items || [])
            .map((x: any) => (typeof x === "string" ? x : x?._id))
            .filter((id: string) => {
              if (!id || seen.has(id)) return false;
              seen.add(id);
              return true;
            }),
        }));
        setMenu({ title: mn.menu.title, sections });
      }
    } finally {
      setLoading(false);
    }
  }

  function update(next: Menu) {
    setMenu(next);
    setDirty(true);
  }

  const itemMap = useMemo(() => {
    const m = new Map<string, Item>();
    items.forEach((i) => m.set(i._id, i));
    return m;
  }, [items]);

  const placedIds = useMemo(() => {
    const s = new Set<string>();
    menu.sections.forEach((sec) => sec.items.forEach((id) => s.add(id)));
    return s;
  }, [menu.sections]);

  const libraryItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items
      .filter((it) => !placedIds.has(it._id))
      .filter(
        (it) =>
          !q ||
          it.name.toLowerCase().includes(q) ||
          (it.category || "").toLowerCase().includes(q)
      );
  }, [items, placedIds, search]);

  // ---------- Mutations ----------
  function addSection(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    update({ ...menu, sections: [...menu.sections, { name: trimmed, items: [] }] });
    setNewSectionName("");
  }
  function deleteSection(index: number) {
    update({ ...menu, sections: menu.sections.filter((_, i) => i !== index) });
    setConfirmDelete(null);
  }
  function renameSection(index: number, name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const next = [...menu.sections];
    next[index] = { ...next[index], name: trimmed };
    update({ ...menu, sections: next });
  }
  function moveItem(id: string, target: number | null) {
    const next = menu.sections.map((s) => ({
      ...s,
      items: s.items.filter((x) => x !== id),
    }));
    if (target !== null && target >= 0 && target < next.length) {
      next[target].items.push(id);
    }
    update({ ...menu, sections: next });
  }
  function moveSection(from: number, to: number) {
    if (from === to) return;
    const next = [...menu.sections];
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    update({ ...menu, sections: next });
  }

  async function handleIngestSaved(
    assignments: { itemId: string; sectionName: string }[]
  ) {
    if (!restaurantId || assignments.length === 0) return;

    const it = await fetch(`/api/items?restaurantId=${restaurantId}`).then((x) => x.json());
    if (it.success) setItems(it.items);

    const nextSections = menu.sections.map((s) => ({ ...s, items: [...s.items] }));
    const sectionByName = new Map<string, number>(
      nextSections.map((s, i) => [s.name.toLowerCase(), i])
    );
    for (const a of assignments) {
      const key = a.sectionName.toLowerCase();
      let idx = sectionByName.get(key);
      if (idx === undefined) {
        nextSections.push({ name: a.sectionName, items: [] });
        idx = nextSections.length - 1;
        sectionByName.set(key, idx);
      }
      if (!nextSections[idx].items.includes(a.itemId)) {
        nextSections[idx].items.push(a.itemId);
      }
    }
    update({ ...menu, sections: nextSections });
  }

  async function saveMenu() {
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
        setDirty(false);
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 2200);
      } else {
        alert(data.error || "Failed to save menu");
      }
    } catch {
      alert("Failed to save menu");
    } finally {
      setSaving(false);
    }
  }

  // ---------- Drag handlers ----------
  function onItemDragStart(e: React.DragEvent, id: string, from: number | null) {
    drag.current = { kind: "item", id, from };
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  }
  function onColDragStart(e: React.DragEvent, index: number) {
    drag.current = { kind: "col", index };
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", `col:${index}`);
  }
  function onDragEnd() {
    drag.current = null;
    setOver(null);
  }
  function onDropOnSection(e: React.DragEvent, target: number) {
    e.preventDefault();
    const d = drag.current;
    if (!d) return;
    if (d.kind === "item") moveItem(d.id, target);
    if (d.kind === "col") moveSection(d.index, target);
    onDragEnd();
  }
  function onDropOnLibrary(e: React.DragEvent) {
    e.preventDefault();
    const d = drag.current;
    if (!d || d.kind !== "item") return;
    moveItem(d.id, null);
    onDragEnd();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-2 border-[#86A6DE]/30 border-t-[#324F7B] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      {/* Sticky toolbar */}
      <div className="sticky top-14 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-[#F8F8F8]/90 backdrop-blur border-b border-stone-200">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[220px]">
            <BookOpen className="w-5 h-5 text-[#324F7B] flex-shrink-0" />
            {editingTitle ? (
              <input
                autoFocus
                className="flex-1 px-3 py-1.5 bg-white border border-[#86A6DE] rounded-lg text-base font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#86A6DE]/40"
                value={menu.title}
                onChange={(e) => update({ ...menu, title: e.target.value })}
                onBlur={() => setEditingTitle(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === "Escape") setEditingTitle(false);
                }}
              />
            ) : (
              <button
                onClick={() => setEditingTitle(true)}
                className="group flex items-center gap-2 text-base sm:text-lg font-semibold text-stone-900 hover:text-[#324F7B] truncate"
                title="Click to rename menu"
              >
                <span className="truncate">{menu.title || "Untitled menu"}</span>
                <Pencil className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs">
            {dirty && !savedFlash && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Unsaved
              </span>
            )}
            {savedFlash && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Check className="w-3.5 h-3.5" />
                Saved
              </span>
            )}
          </div>

          <button
            onClick={() => setShowIngest(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white border border-stone-200 text-stone-700 text-sm font-medium hover:border-[#86A6DE] hover:text-[#324F7B] transition-colors"
            title="Extract items from a menu photo using AI"
          >
            <Sparkles className="w-4 h-4 text-[#324F7B]" />
            Import from photo
          </button>

          <button
            onClick={saveMenu}
            disabled={saving || !dirty}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#324F7B] text-white text-sm font-semibold hover:bg-[#283f63] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save menu
              </>
            )}
          </button>
        </div>

        <p className="mt-1.5 text-xs text-stone-500">
          Drag items from the library into sections. Drag a section header to reorder columns.
          <span className="text-stone-400"> Press Ctrl/⌘+S to save.</span>
        </p>
      </div>

      {/* Library + board */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Library pane */}
        <aside
          onDragOver={(e) => {
            if (drag.current?.kind === "item") {
              e.preventDefault();
              setOver({ kind: "lib" });
            }
          }}
          onDragLeave={() => setOver((o) => (o?.kind === "lib" ? null : o))}
          onDrop={onDropOnLibrary}
          className={`lg:w-80 lg:flex-shrink-0 rounded-2xl bg-white border ${
            over?.kind === "lib" ? "border-[#86A6DE] ring-2 ring-[#86A6DE]/30" : "border-stone-200"
          } overflow-hidden flex flex-col lg:max-h-[calc(100vh-12rem)] lg:sticky lg:top-32`}
        >
          <div className="px-4 py-3 border-b border-stone-200 bg-[#F8F8F8]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-stone-900">Item library</h3>
              <span className="text-xs text-stone-500">{libraryItems.length} unassigned</span>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search items…"
                className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-lg text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#86A6DE]/40 focus:border-[#86A6DE]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 max-h-[60vh] lg:max-h-none">
            {libraryItems.length === 0 ? (
              <div className="px-3 py-10 text-center text-xs text-stone-500">
                {search
                  ? "No items match your search."
                  : items.length === 0
                  ? "No items yet — create some on the Items page."
                  : "Every item is placed in a section."}
              </div>
            ) : (
              libraryItems.map((it) => (
                <ItemCardRow
                  key={it._id}
                  item={it}
                  fromSection={null}
                  sections={menu.sections}
                  onDragStart={onItemDragStart}
                  onDragEnd={onDragEnd}
                  onMove={(target) => moveItem(it._id, target)}
                  onRemove={null}
                  isMenuOpen={openMenu === it._id}
                  onMenuToggle={(open) => setOpenMenu(open ? it._id : null)}
                />
              ))
            )}
          </div>
        </aside>

        {/* Kanban board */}
        <div className="flex-1 min-w-0">
          <div className="flex gap-4 overflow-x-auto pb-3 -mx-1 px-1">
            {menu.sections.map((section, idx) => {
              const isOver = over?.kind === "col" && over.index === idx;
              return (
                <div
                  key={idx}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setOver({ kind: "col", index: idx });
                  }}
                  onDragLeave={() =>
                    setOver((o) => (o?.kind === "col" && o.index === idx ? null : o))
                  }
                  onDrop={(e) => onDropOnSection(e, idx)}
                  className={`flex-shrink-0 w-72 rounded-2xl bg-white border ${
                    isOver
                      ? "border-[#86A6DE] ring-2 ring-[#86A6DE]/30"
                      : "border-stone-200"
                  } overflow-hidden flex flex-col max-h-[calc(100vh-12rem)]`}
                >
                  {/* Column header (drag handle for reordering) */}
                  <div
                    draggable
                    onDragStart={(e) => onColDragStart(e, idx)}
                    onDragEnd={onDragEnd}
                    className="px-3 py-2.5 border-b border-stone-200 bg-[#F8F8F8] flex items-center gap-2 cursor-grab active:cursor-grabbing"
                  >
                    <GripVertical className="w-4 h-4 text-stone-400 flex-shrink-0" />
                    {editingSection === idx ? (
                      <input
                        autoFocus
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onBlur={() => {
                          renameSection(idx, editingValue);
                          setEditingSection(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            renameSection(idx, editingValue);
                            setEditingSection(null);
                          }
                          if (e.key === "Escape") setEditingSection(null);
                        }}
                        className="flex-1 px-2 py-1 bg-white border border-[#86A6DE] rounded text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#86A6DE]/40"
                      />
                    ) : (
                      <button
                        onClick={() => {
                          setEditingValue(section.name);
                          setEditingSection(idx);
                        }}
                        className="flex-1 text-left text-sm font-semibold text-stone-900 truncate hover:text-[#324F7B]"
                        title="Click to rename"
                      >
                        {section.name}
                      </button>
                    )}
                    <span className="text-[11px] font-medium text-stone-500 bg-white border border-stone-200 rounded-full px-2 py-0.5 flex-shrink-0">
                      {section.items.length}
                    </span>
                    <button
                      onClick={() =>
                        confirmDelete === idx ? deleteSection(idx) : setConfirmDelete(idx)
                      }
                      onMouseLeave={() =>
                        setConfirmDelete((c) => (c === idx ? null : c))
                      }
                      className={`p-1 rounded transition-colors flex-shrink-0 ${
                        confirmDelete === idx
                          ? "bg-red-100 text-red-600"
                          : "text-stone-400 hover:text-red-600 hover:bg-red-50"
                      }`}
                      title={confirmDelete === idx ? "Click again to confirm delete" : "Delete section"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Column body */}
                  <div className="flex-1 overflow-y-auto p-2 space-y-1.5 min-h-[120px]">
                    {section.items.length === 0 ? (
                      <div className="border-2 border-dashed border-stone-200 rounded-xl py-10 px-3 text-center text-xs text-stone-400">
                        Drop items here
                      </div>
                    ) : (
                      section.items.map((id) => {
                        const it = itemMap.get(id);
                        if (!it) return null;
                        return (
                          <ItemCardRow
                            key={id}
                            item={it}
                            fromSection={idx}
                            sections={menu.sections}
                            onDragStart={onItemDragStart}
                            onDragEnd={onDragEnd}
                            onMove={(t) => moveItem(id, t)}
                            onRemove={() => moveItem(id, null)}
                            isMenuOpen={openMenu === id}
                            onMenuToggle={(open) => setOpenMenu(open ? id : null)}
                          />
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}

            {/* Add new section column */}
            <div className="flex-shrink-0 w-72 rounded-2xl border-2 border-dashed border-stone-300 bg-white/40 p-3 flex flex-col gap-2 hover:bg-white transition-colors self-start">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 px-1">
                <Plus className="w-3.5 h-3.5" />
                New section
              </div>
              <input
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSection(newSectionName)}
                placeholder="e.g. Starters, Mains, Desserts"
                className="px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#86A6DE]/40 focus:border-[#86A6DE]"
              />
              <button
                onClick={() => addSection(newSectionName)}
                disabled={!newSectionName.trim()}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-full bg-[#324F7B] text-white text-sm font-semibold hover:bg-[#283f63] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
              <p className="text-[11px] text-stone-500 text-center">
                Customers see sections in this order.
              </p>
            </div>
          </div>

          {menu.sections.length === 0 && (
            <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-8 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#86A6DE]/15 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-[#324F7B]" />
              </div>
              <h3 className="text-base font-semibold text-stone-900">Build your first section</h3>
              <p className="text-sm text-stone-500 mt-1">
                Type a section name above (e.g. &quot;Starters&quot;), then drag items from the
                library into it.
              </p>
            </div>
          )}
        </div>
      </div>

      {showIngest && restaurantId && (
        <MenuIngestModal
          restaurantId={restaurantId}
          onClose={() => setShowIngest(false)}
          onSaved={handleIngestSaved}
        />
      )}
    </div>
  );
}

function ItemCardRow({
  item,
  fromSection,
  sections,
  onDragStart,
  onDragEnd,
  onMove,
  onRemove,
  isMenuOpen,
  onMenuToggle,
}: {
  item: Item;
  fromSection: number | null;
  sections: MenuSection[];
  onDragStart: (e: React.DragEvent, id: string, from: number | null) => void;
  onDragEnd: () => void;
  onMove: (target: number) => void;
  onRemove: (() => void) | null;
  isMenuOpen: boolean;
  onMenuToggle: (open: boolean) => void;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, item._id, fromSection)}
      onDragEnd={onDragEnd}
      className="group relative flex items-center gap-2 p-2 rounded-xl border border-stone-200 bg-white hover:border-[#86A6DE] hover:shadow-sm cursor-grab active:cursor-grabbing transition-all"
    >
      <GripVertical className="w-3.5 h-3.5 text-stone-300 group-hover:text-stone-500 flex-shrink-0" />

      <div className="w-9 h-9 rounded-lg bg-stone-100 overflow-hidden flex-shrink-0 border border-stone-200">
        {item.image ? (
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
        ) : null}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              item.isVeg ? "bg-emerald-500" : "bg-red-500"
            }`}
            title={item.isVeg ? "Veg" : "Non-veg"}
          />
          <p className="text-sm font-medium text-stone-900 truncate">{item.name}</p>
        </div>
        <p className="text-xs text-stone-500">₹{item.price}</p>
      </div>

      <div className="relative flex-shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMenuToggle(!isMenuOpen);
          }}
          className="p-1 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity"
          title="More actions"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>

        {isMenuOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-7 z-30 w-48 rounded-xl bg-white border border-stone-200 shadow-lg py-1"
          >
            <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-stone-400">
              Move to
            </div>
            {sections.length === 0 && (
              <div className="px-3 py-2 text-xs text-stone-400">No sections yet</div>
            )}
            {sections.map((s, i) =>
              i === fromSection ? null : (
                <button
                  key={i}
                  onClick={() => {
                    onMove(i);
                    onMenuToggle(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50 flex items-center justify-between gap-2"
                >
                  <span className="truncate">{s.name}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-stone-300 flex-shrink-0" />
                </button>
              )
            )}
            {onRemove && (
              <>
                <div className="my-1 border-t border-stone-100" />
                <button
                  onClick={() => {
                    onRemove();
                    onMenuToggle(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <X className="w-3.5 h-3.5" />
                  Remove from menu
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
