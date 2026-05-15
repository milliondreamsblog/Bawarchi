/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import QRCode from "qrcode";
import {
  Plus,
  Search,
  Printer,
  Download,
  ExternalLink,
  Trash2,
  Copy,
  X,
  LayoutGrid,
  List,
  QrCode as QrIcon,
  Check,
} from "lucide-react";

interface Table {
  _id: string;
  tableNumber: number;
  slug: string;
  restaurantId: string;
  qrUrl: string;
}

export default function RestaurantTablesPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState("");
  const [tables, setTables] = useState<Table[]>([]);
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ tableNumber: "", slug: "" });

  const [activeTable, setActiveTable] = useState<Table | null>(null);
  const [deletingTableId, setDeletingTableId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [printOnly, setPrintOnly] = useState<string | null>(null);

  const formRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (slug) fetchRestaurantAndTables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    function reset() {
      setPrintOnly(null);
    }
    window.addEventListener("afterprint", reset);
    return () => window.removeEventListener("afterprint", reset);
  }, []);

  async function fetchRestaurantAndTables() {
    try {
      const r = await fetch(`/api/restaurant/by-slug/${slug}`).then((x) => x.json());
      if (!r.success) return;
      setRestaurantId(r.restaurant._id);
      setRestaurantName(r.restaurant.name || "");

      const t = await fetch(`/api/tables?restaurantId=${r.restaurant._id}`).then((x) =>
        x.json()
      );
      if (t.success) {
        setTables(t.tables);
        generateQRCodes(t.tables);
      }
    } finally {
      setLoading(false);
    }
  }

  async function generateQRCodes(arr: Table[]) {
    const codes: Record<string, string> = {};
    await Promise.all(
      arr.map(async (table) => {
        try {
          const url = `${process.env.NEXT_PUBLIC_BASE_URL}/r/${slug}/t/${table.slug}`;
          codes[table._id] = await QRCode.toDataURL(url, { width: 512, margin: 2 });
        } catch {
          /* ignore */
        }
      })
    );
    setQrCodes((prev) => ({ ...prev, ...codes }));
  }

  async function handleSubmit(e: React.FormEvent) {
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
        const next = [...tables, data.table];
        setTables(next);
        generateQRCodes(next);
        setShowForm(false);
        setFormData({ tableNumber: "", slug: "" });
      } else {
        alert(data.error || "Failed to create table");
      }
    } catch {
      alert("Failed to create table");
    }
  }

  function autoGenerateSlug() {
    if (formData.tableNumber && restaurantId) {
      const prefix = restaurantId.substring(0, 7).toUpperCase();
      setFormData((f) => ({ ...f, slug: `R${prefix}-T${f.tableNumber}` }));
    }
  }

  async function handleDeleteTable(table: Table) {
    if (!confirm(`Delete Table ${table.tableNumber}? This action cannot be undone.`)) return;
    if (!restaurantId) return;
    setDeletingTableId(table._id);
    try {
      const res = await fetch(`/api/tables/${table._id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId }),
      });
      const data = await res.json();
      if (data.success) {
        setTables(tables.filter((t) => t._id !== table._id));
        const c = { ...qrCodes };
        delete c[table._id];
        setQrCodes(c);
        if (activeTable?._id === table._id) setActiveTable(null);
      } else {
        alert(data.error || "Failed to delete table");
      }
    } finally {
      setDeletingTableId(null);
    }
  }

  function getUrl(t: Table) {
    return `${process.env.NEXT_PUBLIC_BASE_URL}/r/${slug}/t/${t.slug}`;
  }

  async function copyUrl(t: Table) {
    try {
      await navigator.clipboard.writeText(getUrl(t));
      setCopiedId(t._id);
      setTimeout(() => setCopiedId((c) => (c === t._id ? null : c)), 1800);
    } catch {
      /* ignore */
    }
  }

  function printOne(t: Table) {
    setPrintOnly(t._id);
    setTimeout(() => window.print(), 60);
  }
  function printAll() {
    setPrintOnly(null);
    setTimeout(() => window.print(), 60);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tables
      .slice()
      .sort((a, b) => a.tableNumber - b.tableNumber)
      .filter(
        (t) =>
          !q ||
          String(t.tableNumber).includes(q) ||
          t.slug.toLowerCase().includes(q)
      );
  }, [tables, search]);

  const printList = printOnly ? tables.filter((t) => t._id === printOnly) : filtered;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 print:hidden">
        <div className="w-10 h-10 border-2 border-[#86A6DE]/30 border-t-[#324F7B] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Print sheet — visible only when printing */}
      <div className="hidden print:block">
        <PrintSheet
          tables={printList}
          qrCodes={qrCodes}
          restaurantName={restaurantName}
          restaurantSlug={slug}
        />
      </div>

      <div className="space-y-4 print:hidden">
        {/* Toolbar */}
        <div className="sticky top-14 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-[#F8F8F8]/90 backdrop-blur border-b border-stone-200">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-baseline gap-2 flex-1 min-w-[160px]">
              <h1 className="text-lg sm:text-xl font-semibold text-stone-900">Tables</h1>
              <span className="text-xs text-stone-500">{tables.length}</span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="w-44 sm:w-56 pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-lg text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#86A6DE]/40 focus:border-[#86A6DE]"
              />
            </div>

            <div className="inline-flex rounded-lg bg-white border border-stone-200 p-0.5">
              <button
                onClick={() => setView("grid")}
                className={`p-1.5 rounded-md transition-colors ${
                  view === "grid"
                    ? "bg-[#324F7B] text-white"
                    : "text-stone-500 hover:text-[#324F7B]"
                }`}
                title="Grid view"
                aria-label="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView("list")}
                className={`p-1.5 rounded-md transition-colors ${
                  view === "list"
                    ? "bg-[#324F7B] text-white"
                    : "text-stone-500 hover:text-[#324F7B]"
                }`}
                title="List view"
                aria-label="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={printAll}
              disabled={tables.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-stone-200 bg-white text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Print all QR codes"
            >
              <Printer className="w-4 h-4" />
              Print all
            </button>

            <button
              onClick={() => {
                setShowForm((s) => !s);
                setTimeout(
                  () =>
                    formRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }),
                  60
                );
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#324F7B] text-white text-sm font-semibold hover:bg-[#283f63]"
            >
              {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showForm ? "Cancel" : "Add table"}
            </button>
          </div>
        </div>

        {/* Add form */}
        {showForm && (
          <div ref={formRef} className="rounded-2xl bg-white border border-stone-200 p-4 sm:p-5">
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start"
            >
              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-stone-600 mb-1">
                  Table number
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={formData.tableNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, tableNumber: e.target.value })
                  }
                  onBlur={autoGenerateSlug}
                  placeholder="e.g. 7"
                  className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#86A6DE]/40 focus:border-[#86A6DE]"
                />
              </div>
              <div className="sm:col-span-6">
                <label className="block text-xs font-medium text-stone-600 mb-1">Slug</label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="Auto-generated"
                  className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#86A6DE]/40 focus:border-[#86A6DE]"
                />
                {formData.slug && (
                  <p className="text-[11px] text-stone-500 mt-1 truncate">
                    URL: <span className="font-mono">/r/{slug}/t/{formData.slug}</span>
                  </p>
                )}
              </div>
              <div className="sm:col-span-3 flex sm:justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-full border border-stone-200 bg-white text-sm font-medium text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-full bg-[#324F7B] text-white text-sm font-semibold hover:bg-[#283f63]"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Empty / list / grid */}
        {tables.length === 0 ? (
          <div className="rounded-2xl border border-stone-200 bg-white p-10 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#86A6DE]/15 flex items-center justify-center">
              <QrIcon className="w-6 h-6 text-[#324F7B]" />
            </div>
            <h3 className="text-base font-semibold text-stone-900">No tables yet</h3>
            <p className="text-sm text-stone-500 mt-1">
              Add your first table to generate a QR code.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#324F7B] text-white text-sm font-semibold hover:bg-[#283f63]"
            >
              <Plus className="w-4 h-4" /> Add table
            </button>
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
            {filtered.map((t) => (
              <button
                key={t._id}
                onClick={() => setActiveTable(t)}
                className="group relative text-left rounded-2xl bg-white border border-stone-200 hover:border-[#86A6DE] hover:shadow-md transition-all p-3"
                title="View QR & actions"
              >
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-lg bg-white border border-stone-200 p-1 flex-shrink-0">
                    {qrCodes[t._id] ? (
                      <img
                        src={qrCodes[t._id]}
                        alt=""
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full bg-stone-100 rounded animate-pulse" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] uppercase tracking-wider text-stone-400">
                      Table
                    </div>
                    <div className="text-2xl font-bold text-[#324F7B] leading-tight">
                      {t.tableNumber}
                    </div>
                    <div className="text-[10px] font-mono text-stone-500 truncate">
                      {t.slug}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-white border border-stone-200 overflow-hidden">
            <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-2 text-[11px] uppercase tracking-wider text-stone-500 border-b border-stone-200 bg-[#F8F8F8]">
              <div className="col-span-1">QR</div>
              <div className="col-span-1">Table</div>
              <div className="col-span-3">Slug</div>
              <div className="col-span-5">URL</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            <ul className="divide-y divide-stone-100">
              {filtered.map((t) => (
                <li key={t._id} className="px-4 py-2.5">
                  <div className="grid md:grid-cols-12 gap-3 items-center">
                    <div className="md:col-span-1">
                      <button
                        onClick={() => setActiveTable(t)}
                        className="w-10 h-10 rounded bg-white border border-stone-200 p-0.5 hover:border-[#86A6DE]"
                        title="View QR"
                      >
                        {qrCodes[t._id] && (
                          <img
                            src={qrCodes[t._id]}
                            alt=""
                            className="w-full h-full object-contain"
                          />
                        )}
                      </button>
                    </div>
                    <div className="md:col-span-1 font-semibold text-[#324F7B]">
                      {t.tableNumber}
                    </div>
                    <div className="md:col-span-3 font-mono text-xs text-stone-600 truncate">
                      {t.slug}
                    </div>
                    <div className="md:col-span-5 text-xs text-stone-500 truncate">
                      <a
                        href={`/r/${slug}/t/${t.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-[#324F7B] hover:underline"
                      >
                        /r/{slug}/t/{t.slug}
                      </a>
                    </div>
                    <div className="md:col-span-2 flex md:justify-end gap-1">
                      <IconBtn title="Copy URL" onClick={() => copyUrl(t)}>
                        {copiedId === t._id ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </IconBtn>
                      <IconBtn title="Print" onClick={() => printOne(t)}>
                        <Printer className="w-4 h-4" />
                      </IconBtn>
                      <IconBtn
                        title="Download"
                        onClick={() => downloadQr(t, qrCodes[t._id])}
                      >
                        <Download className="w-4 h-4" />
                      </IconBtn>
                      <IconBtn
                        title="Open"
                        onClick={() => window.open(`/r/${slug}/t/${t.slug}`, "_blank")}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </IconBtn>
                      <IconBtn
                        title="Delete"
                        danger
                        disabled={deletingTableId === t._id}
                        onClick={() => handleDeleteTable(t)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </IconBtn>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {filtered.length === 0 && tables.length > 0 && (
          <div className="text-sm text-stone-500 text-center py-6">
            No tables match &quot;{search}&quot;.
          </div>
        )}
      </div>

      {/* QR detail modal */}
      {activeTable && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 print:hidden"
          onClick={() => setActiveTable(null)}
        >
          <div
            className="bg-white rounded-2xl border border-stone-200 max-w-sm w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200">
              <div className="flex items-baseline gap-2 min-w-0">
                <h3 className="font-semibold text-stone-900">
                  Table {activeTable.tableNumber}
                </h3>
                <span className="text-[11px] font-mono text-stone-500 truncate">
                  {activeTable.slug}
                </span>
              </div>
              <button
                onClick={() => setActiveTable(null)}
                className="p-1 rounded hover:bg-stone-100 text-stone-500"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              <div className="bg-white border border-stone-200 rounded-xl p-3 mx-auto w-fit">
                {qrCodes[activeTable._id] && (
                  <img
                    src={qrCodes[activeTable._id]}
                    alt=""
                    className="w-56 h-56"
                  />
                )}
              </div>
              {restaurantName && (
                <p className="text-center text-sm font-semibold text-stone-900 mt-3">
                  {restaurantName}
                </p>
              )}
              <p className="text-center text-xs text-stone-500 mt-0.5">
                Scan to order — Table {activeTable.tableNumber}
              </p>
              <p className="mt-3 text-[11px] text-stone-500 text-center break-all font-mono">
                {getUrl(activeTable)}
              </p>
            </div>

            <div className="px-4 py-3 border-t border-stone-200 grid grid-cols-2 gap-2">
              <button
                onClick={() => printOne(activeTable)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-full bg-[#324F7B] text-white text-sm font-semibold hover:bg-[#283f63]"
              >
                <Printer className="w-4 h-4" /> Print
              </button>
              <button
                onClick={() => downloadQr(activeTable, qrCodes[activeTable._id])}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-full border border-stone-200 bg-white text-sm font-medium text-stone-700 hover:bg-stone-50"
              >
                <Download className="w-4 h-4" /> Download
              </button>
              <button
                onClick={() => copyUrl(activeTable)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-full border border-stone-200 bg-white text-sm font-medium text-stone-700 hover:bg-stone-50"
              >
                {copiedId === activeTable._id ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Copy URL
                  </>
                )}
              </button>
              <button
                onClick={() =>
                  window.open(`/r/${slug}/t/${activeTable.slug}`, "_blank")
                }
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-full border border-stone-200 bg-white text-sm font-medium text-stone-700 hover:bg-stone-50"
              >
                <ExternalLink className="w-4 h-4" /> Open
              </button>
              <button
                onClick={() => handleDeleteTable(activeTable)}
                disabled={deletingTableId === activeTable._id}
                className="col-span-2 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-full border border-red-200 bg-white text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                {deletingTableId === activeTable._id ? "Deleting…" : "Delete table"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          @page { margin: 14mm; }
          body { background: white !important; }
        }
      `}</style>
    </>
  );
}

function IconBtn({
  children,
  title,
  onClick,
  danger,
  disabled,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      disabled={disabled}
      className={`p-1.5 rounded-md transition-colors disabled:opacity-40 ${
        danger
          ? "text-stone-500 hover:bg-red-50 hover:text-red-600"
          : "text-stone-500 hover:bg-stone-100 hover:text-[#324F7B]"
      }`}
    >
      {children}
    </button>
  );
}

function downloadQr(t: Table, dataUrl?: string) {
  if (!dataUrl) return;
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = `table-${t.tableNumber}-qr.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function PrintSheet({
  tables,
  qrCodes,
  restaurantName,
  restaurantSlug,
}: {
  tables: Table[];
  qrCodes: Record<string, string>;
  restaurantName: string;
  restaurantSlug: string;
}) {
  return (
    <div className="p-2">
      <div className="grid grid-cols-2 gap-3">
        {tables.map((t) => (
          <div
            key={t._id}
            className="border border-stone-300 rounded-xl p-4 flex flex-col items-center"
            style={{ pageBreakInside: "avoid", breakInside: "avoid" }}
          >
            {restaurantName && (
              <p className="text-sm font-semibold text-stone-900">{restaurantName}</p>
            )}
            <p className="text-xs text-stone-500 mt-0.5">Scan to order</p>
            <div className="my-2">
              {qrCodes[t._id] && (
                <img src={qrCodes[t._id]} alt="" className="w-44 h-44" />
              )}
            </div>
            <p className="text-2xl font-bold text-stone-900">Table {t.tableNumber}</p>
            <p className="text-[10px] font-mono text-stone-500 mt-1">
              {restaurantSlug} / {t.slug}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
