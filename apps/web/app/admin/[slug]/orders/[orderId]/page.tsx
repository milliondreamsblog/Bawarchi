/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Sparkles, Flame, Leaf, AlertCircle } from "lucide-react";

interface PredictedItem {
  _id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  isVeg?: boolean;
  isVegan?: boolean;
  spiceLevel?: string;
}

interface DinerContext {
  success: boolean;
  hasContext: boolean;
  reason?: string;
  message?: string;
  identity?: {
    state: "anonymous" | "opportunistic" | "identified";
    phoneRedacted: string | null;
  };
  operational?: {
    dietaryLeaning: "vegan" | "vegetarian" | "non-vegetarian" | "mixed";
    glutenFreeLeaning: boolean;
    spicePreference: "mild" | "medium" | "hot" | "mixed" | null;
  };
  taste?: {
    summary: string;
    tags: string[];
    confidence: number;
    sampleCount: number;
  };
  predictedItems?: PredictedItem[];
}

const dietBadge: Record<string, { label: string; tone: string }> = {
  vegan: { label: "Vegan", tone: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  vegetarian: { label: "Vegetarian", tone: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  "non-vegetarian": { label: "Non-veg", tone: "bg-red-50 text-red-800 border-red-200" },
  mixed: { label: "Mixed", tone: "bg-stone-100 text-stone-700 border-stone-300" },
};

const spiceBadge: Record<string, { label: string; tone: string }> = {
  mild: { label: "Mild spice", tone: "bg-[#86A6DE]/15 text-[#324F7B] border-[#86A6DE]/40" },
  medium: { label: "Medium spice", tone: "bg-amber-50 text-amber-800 border-amber-200" },
  hot: { label: "Spicy", tone: "bg-red-50 text-red-800 border-red-200" },
  mixed: { label: "Mixed spice", tone: "bg-stone-100 text-stone-700 border-stone-300" },
};

export default function DinerContextPage() {
  const params = useParams();
  const slug = params.slug as string;
  const orderId = params.orderId as string;

  const [ctx, setCtx] = useState<DinerContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;
    fetch(`/api/admin/diner-context/${orderId}`)
      .then(async (r) => {
        const ct = r.headers.get("content-type") || "";
        if (!ct.includes("application/json")) throw new Error("Server returned non-JSON");
        return r.json();
      })
      .then((data) => {
        if (!data?.success) throw new Error(data?.error || "Failed to load diner context");
        setCtx(data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-2 border-[#86A6DE]/30 border-t-[#324F7B] rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !ctx) {
    return (
      <div className="max-w-3xl mx-auto px-5 py-8">
        <Link href={`/admin/${slug}/orders`} className="inline-flex items-center gap-1.5 text-sm text-[#5067AA] hover:underline mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to orders
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-900">
          <p className="font-semibold mb-1">Unable to load diner context</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-5 py-6 sm:py-8">
      <Link href={`/admin/${slug}/orders`} className="inline-flex items-center gap-1.5 text-sm text-[#5067AA] hover:underline mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to orders
      </Link>

      <div className="mb-6">
        <p className="text-[11px] uppercase tracking-[0.25em] text-[#86A6DE] font-semibold mb-1">Diner context</p>
        <h1 className="text-3xl font-serif italic text-stone-900 tracking-tight">
          What this diner tends to enjoy
        </h1>
        <p className="text-sm text-stone-500 mt-2 max-w-xl">
          A taste-level summary derived from this diner&apos;s activity across the platform. Order history at other restaurants is never shown — only the predicted preferences that affect service at <span className="font-semibold">your</span> restaurant.
        </p>
      </div>

      {!ctx.hasContext ? (
        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6">
          <p className="font-semibold text-stone-900 mb-1">No diner context for this order</p>
          <p className="text-sm text-stone-600">{ctx.message || "The order was placed anonymously."}</p>
        </div>
      ) : (
        <>
          {/* Tier 1 — Operational facts (default disclosure) */}
          <section className="mb-6">
            <h2 className="text-sm font-semibold text-stone-900 mb-3 uppercase tracking-wider">Operational</h2>
            <div className="bg-white border border-stone-200 rounded-3xl p-5 flex flex-wrap gap-2">
              {ctx.operational && (
                <>
                  <Badge
                    icon={<Leaf className="w-3.5 h-3.5" />}
                    label={dietBadge[ctx.operational.dietaryLeaning]?.label || ctx.operational.dietaryLeaning}
                    tone={dietBadge[ctx.operational.dietaryLeaning]?.tone || "bg-stone-100 text-stone-700 border-stone-300"}
                  />
                  {ctx.operational.spicePreference && (
                    <Badge
                      icon={<Flame className="w-3.5 h-3.5" />}
                      label={spiceBadge[ctx.operational.spicePreference]?.label || ctx.operational.spicePreference}
                      tone={spiceBadge[ctx.operational.spicePreference]?.tone || "bg-stone-100 text-stone-700 border-stone-300"}
                    />
                  )}
                  {ctx.operational.glutenFreeLeaning && (
                    <Badge label="Gluten-free leaning" tone="bg-stone-100 text-stone-700 border-stone-300" />
                  )}
                </>
              )}
              {ctx.identity?.phoneRedacted && (
                <Badge label={`Phone: ${ctx.identity.phoneRedacted}`} tone="bg-stone-100 text-stone-700 border-stone-300" />
              )}
              {ctx.identity?.state && (
                <Badge
                  label={ctx.identity.state === "opportunistic" ? "Returning diner" : ctx.identity.state === "identified" ? "Identified" : "First-time"}
                  tone="bg-[#324F7B] text-white border-[#324F7B]"
                />
              )}
            </div>
          </section>

          {/* Tier 2 — Taste summary */}
          {ctx.taste && (
            <section className="mb-6">
              <div className="flex items-baseline justify-between mb-3">
                <h2 className="text-sm font-semibold text-stone-900 uppercase tracking-wider">Taste</h2>
                <span className="text-xs text-stone-500">
                  confidence {(ctx.taste.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <div className="bg-[#324F7B] text-white rounded-3xl p-6">
                <p className="font-serif italic text-xl leading-snug mb-3">&ldquo;{ctx.taste.summary}&rdquo;</p>
                {ctx.taste.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {ctx.taste.tags.map((t) => (
                      <span key={t} className="px-3 py-1 rounded-full text-xs bg-white/15 border border-white/20">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Predicted picks at THIS restaurant */}
          {ctx.predictedItems && ctx.predictedItems.length > 0 && (
            <section className="mb-6">
              <div className="flex items-baseline justify-between mb-3">
                <h2 className="text-sm font-semibold text-stone-900 uppercase tracking-wider">
                  Likely to enjoy on your menu
                </h2>
                <Sparkles className="w-4 h-4 text-[#86A6DE]" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {ctx.predictedItems.map((item) => (
                  <div key={item._id} className="bg-white border border-stone-200 rounded-2xl p-4">
                    <p className="font-semibold text-stone-900 mb-0.5">{item.name}</p>
                    {item.category && (
                      <p className="text-[10px] uppercase tracking-wider text-stone-500 mb-1">{item.category}</p>
                    )}
                    {item.description && (
                      <p className="text-xs text-stone-600 line-clamp-2">{item.description}</p>
                    )}
                    <p className="text-sm font-semibold text-[#324F7B] mt-2">₹{item.price}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Privacy footer */}
          <section className="mb-6">
            <div className="flex items-start gap-3 bg-emerald-50/50 border border-emerald-200 rounded-2xl p-4">
              <ShieldCheck className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-emerald-900">Predictions portable, raw data isolated</p>
                <p className="text-xs text-emerald-800/80 mt-0.5">
                  Cross-restaurant orders are never exposed here. The system shows you what they&apos;re predicted to enjoy, not what they&apos;ve eaten elsewhere.
                </p>
              </div>
            </div>
          </section>

          {ctx.taste && ctx.taste.confidence < 0.4 && (
            <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>Confidence is below 0.4 — this diner doesn&apos;t have enough order history yet for a reliable prediction. Treat as a guess.</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Badge({
  label,
  tone,
  icon,
}: {
  label: string;
  tone: string;
  icon?: React.ReactNode;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${tone}`}>
      {icon}
      {label}
    </span>
  );
}
