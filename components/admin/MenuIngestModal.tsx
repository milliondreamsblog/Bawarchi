"use client";

import React, { useState } from "react";
import {
  X,
  Upload,
  Sparkles,
  Loader2,
  AlertTriangle,
  Check,
  Trash2,
} from "lucide-react";

interface ExtractedItem {
  name: string;
  description: string;
  price: number;
  isVeg: boolean;
  spiceLevel: "mild" | "medium" | "hot" | null;
  confidence: number;
}
interface ExtractedSection {
  name: string;
  items: ExtractedItem[];
}

type Step = "upload" | "extracting" | "review" | "saving";

export default function MenuIngestModal({
  restaurantId,
  onClose,
  onSaved,
}: {
  restaurantId: string;
  onClose: () => void;
  onSaved: (assignments: { itemId: string; sectionName: string }[]) => void;
}) {
  const [step, setStep] = useState<Step>("upload");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [sections, setSections] = useState<ExtractedSection[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const totalItems = sections.reduce((sum, s) => sum + s.items.length, 0);

  async function handleFile(file: File) {
    setError(null);
    setStep("extracting");

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = () => reject(new Error("Could not read file"));
        r.readAsDataURL(file);
      });

      const upRes = await fetch("/api/upload-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const up = await upRes.json();
      if (!up.success) throw new Error(up.error || "Upload failed");
      setImageUrl(up.imageUrl);

      const exRes = await fetch("/api/menu/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: up.imageUrl }),
      });
      const ex = await exRes.json();
      if (!ex.success) throw new Error(ex.error || "Extraction failed");

      setSections(ex.sections);
      setWarnings(ex.warnings || []);
      setStep("review");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setStep("upload");
    }
  }

  function updateItem(si: number, ii: number, patch: Partial<ExtractedItem>) {
    setSections((prev) => {
      const next = [...prev];
      next[si] = { ...next[si], items: [...next[si].items] };
      next[si].items[ii] = { ...next[si].items[ii], ...patch };
      return next;
    });
  }
  function removeItem(si: number, ii: number) {
    setSections((prev) => {
      const next = [...prev];
      next[si] = { ...next[si], items: next[si].items.filter((_, i) => i !== ii) };
      return next.filter((s) => s.items.length > 0);
    });
  }
  function renameSection(si: number, name: string) {
    setSections((prev) => {
      const next = [...prev];
      next[si] = { ...next[si], name };
      return next;
    });
  }

  async function saveAll() {
    if (!imageUrl) return;
    setStep("saving");
    setError(null);
    setProgress(0);

    const assignments: { itemId: string; sectionName: string }[] = [];
    let done = 0;

    try {
      for (const section of sections) {
        for (const it of section.items) {
          if (!it.name.trim()) continue;
          const res = await fetch("/api/items", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: it.name.trim(),
              description: it.description?.trim() || "",
              price: it.price,
              category: section.name,
              image: imageUrl,
              available: true,
              restaurantId,
              isVeg: it.isVeg,
              spiceLevel: it.spiceLevel || "medium",
            }),
          });
          const data = await res.json();
          if (data.success && data.item?._id) {
            assignments.push({ itemId: data.item._id, sectionName: section.name });
          }
          done++;
          setProgress(done);
        }
      }
      onSaved(assignments);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
      setStep("review");
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#324F7B]" />
            <h2 className="text-lg font-semibold text-stone-900">
              Import menu from photo
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {step === "upload" && (
            <div className="p-8">
              <label className="flex flex-col items-center justify-center gap-3 py-16 px-6 rounded-2xl border-2 border-dashed border-stone-300 hover:border-[#86A6DE] hover:bg-[#86A6DE]/5 cursor-pointer transition-colors">
                <div className="w-14 h-14 rounded-full bg-[#86A6DE]/15 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-[#324F7B]" />
                </div>
                <div className="text-center">
                  <p className="text-base font-semibold text-stone-900">
                    Upload a menu photo
                  </p>
                  <p className="text-sm text-stone-500 mt-1">
                    JPG or PNG. Clear, well-lit shots work best.
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                  }}
                />
              </label>
              {error && (
                <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                  {error}
                </div>
              )}
            </div>
          )}

          {step === "extracting" && (
            <div className="py-20 flex flex-col items-center gap-3 text-stone-600">
              <Loader2 className="w-8 h-8 animate-spin text-[#324F7B]" />
              <p className="text-sm font-medium">Reading your menu…</p>
              <p className="text-xs text-stone-400">This usually takes 5–15 seconds.</p>
            </div>
          )}

          {step === "review" && (
            <div className="p-6 space-y-5">
              {warnings.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="flex items-center gap-2 text-sm font-semibold text-amber-800 mb-1">
                    <AlertTriangle className="w-4 h-4" />
                    Heads up
                  </div>
                  <ul className="text-xs text-amber-700 space-y-0.5 list-disc list-inside">
                    {warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {sections.length === 0 ? (
                <div className="py-12 text-center text-sm text-stone-500">
                  No items detected. Try a clearer photo.
                </div>
              ) : (
                sections.map((section, si) => (
                  <div
                    key={si}
                    className="rounded-2xl border border-stone-200 overflow-hidden"
                  >
                    <div className="px-4 py-2.5 bg-[#F8F8F8] border-b border-stone-200 flex items-center gap-3">
                      <input
                        value={section.name}
                        onChange={(e) => renameSection(si, e.target.value)}
                        className="flex-1 bg-transparent text-sm font-semibold text-stone-900 focus:outline-none focus:bg-white focus:border focus:border-[#86A6DE] focus:rounded px-2 py-0.5"
                      />
                      <span className="text-[11px] font-medium text-stone-500 bg-white border border-stone-200 rounded-full px-2 py-0.5">
                        {section.items.length} items
                      </span>
                    </div>
                    <div className="divide-y divide-stone-100">
                      {section.items.map((it, ii) => (
                        <div
                          key={ii}
                          className="p-3 flex items-center gap-3 hover:bg-stone-50"
                        >
                          <button
                            onClick={() => updateItem(si, ii, { isVeg: !it.isVeg })}
                            className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center flex-shrink-0 ${
                              it.isVeg ? "border-emerald-500" : "border-red-500"
                            }`}
                            title={it.isVeg ? "Veg (click to toggle)" : "Non-veg (click to toggle)"}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                it.isVeg ? "bg-emerald-500" : "bg-red-500"
                              }`}
                            />
                          </button>
                          <input
                            value={it.name}
                            onChange={(e) => updateItem(si, ii, { name: e.target.value })}
                            placeholder="Item name"
                            className="flex-1 min-w-0 px-2 py-1 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#86A6DE]/40 focus:border-[#86A6DE]"
                          />
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <span className="text-xs text-stone-500">₹</span>
                            <input
                              type="number"
                              value={it.price}
                              onChange={(e) =>
                                updateItem(si, ii, { price: Number(e.target.value) || 0 })
                              }
                              className="w-20 px-2 py-1 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#86A6DE]/40 focus:border-[#86A6DE]"
                            />
                          </div>
                          <ConfidenceChip score={it.confidence} />
                          <button
                            onClick={() => removeItem(si, ii)}
                            className="p-1 rounded text-stone-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
                            title="Remove"
                            aria-label="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}

              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                  {error}
                </div>
              )}
            </div>
          )}

          {step === "saving" && (
            <div className="py-20 flex flex-col items-center gap-3 text-stone-600">
              <Loader2 className="w-8 h-8 animate-spin text-[#324F7B]" />
              <p className="text-sm font-medium">Saving items…</p>
              <p className="text-xs text-stone-400">
                {progress} / {totalItems}
              </p>
            </div>
          )}
        </div>

        {step === "review" && (
          <div className="px-6 py-4 border-t border-stone-200 flex items-center justify-between gap-3 bg-[#F8F8F8] rounded-b-3xl">
            <p className="text-xs text-stone-500">
              {totalItems} {totalItems === 1 ? "item" : "items"} ready to save
            </p>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-full text-sm font-medium text-stone-700 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                onClick={saveAll}
                disabled={totalItems === 0}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#324F7B] text-white text-sm font-semibold hover:bg-[#283f63] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4" />
                Save all to library
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ConfidenceChip({ score }: { score: number }) {
  const tier = score >= 0.8 ? "high" : score >= 0.5 ? "med" : "low";
  const cls =
    tier === "high"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : tier === "med"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-red-50 text-red-700 border-red-200";
  const label = tier === "high" ? "High" : tier === "med" ? "Medium" : "Low";
  return (
    <span
      className={`text-[10px] font-medium px-2 py-0.5 rounded-full border flex-shrink-0 ${cls}`}
      title={`Confidence: ${Math.round(score * 100)}%`}
    >
      {label}
    </span>
  );
}
