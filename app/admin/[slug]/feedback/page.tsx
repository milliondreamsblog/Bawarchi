"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

/* ─── Types ───────────────────────────────────────────────── */
interface Review {
  _id: string;
  tableSlug: string;
  rating: number;
  text: string;
  createdAt: string;
  sentiment?: {
    score: number;
    label: "positive" | "neutral" | "negative";
    tags: string[];
    summary: string;
  };
}

interface Summary {
  total: number;
  avgRating: number;
  ratingDist: { star: number; count: number }[];
  sentimentCounts: { positive: number; neutral: number; negative: number };
  positivePercent: number;
}

/* ─── Helpers ─────────────────────────────────────────────── */
function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const sz = size === "lg" ? "w-8 h-8" : "w-4 h-4";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          className={`${sz} ${s <= rating ? "text-yellow-400" : "text-gray-200"}`}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      ))}
    </div>
  );
}

const sentimentStyle: Record<string, string> = {
  positive: "bg-green-100 text-green-700 border border-green-200",
  neutral:  "bg-yellow-100 text-yellow-700 border border-yellow-200",
  negative: "bg-red-100 text-red-700 border border-red-200",
};

/* ─── Main Page ───────────────────────────────────────────── */
export default function FeedbackPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "positive" | "neutral" | "negative">("all");

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      const restRes = await fetch(`/api/restaurant/by-slug/${slug}`);
      const restData = await restRes.json();
      if (!restData.success) return;

      const res = await fetch(`/api/feedback?restaurantId=${restData.restaurant._id}`);
      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews);
        setSummary(data.summary);
      }
      setLoading(false);
    };
    load();
  }, [slug]);

  const filtered =
    filter === "all"
      ? reviews
      : reviews.filter((r) => r.sentiment?.label === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Customer Feedback</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">AI-analysed reviews from your customers</p>
      </div>

      {summary && summary.total > 0 ? (
        <>
          {/* ── Summary Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Avg Rating */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col items-center text-center">
              <p className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
                {summary.avgRating.toFixed(1)}
              </p>
              <Stars rating={Math.round(summary.avgRating)} size="lg" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Based on {summary.total} review{summary.total !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Rating Distribution */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">Rating Breakdown</p>
              <div className="space-y-2">
                {[...summary.ratingDist].reverse().map(({ star, count }) => {
                  const pct = summary.total > 0 ? (count / summary.total) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-2 text-xs">
                      <span className="w-4 text-gray-500 dark:text-gray-400 font-medium">{star}</span>
                      <svg className="w-3 h-3 text-yellow-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                      <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-400 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-4 text-gray-400">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sentiment */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">AI Sentiment</p>
              <div className="space-y-3">
                {[
                  { key: "positive", label: "Positive", color: "bg-green-500", dot: "bg-green-500" },
                  { key: "neutral",  label: "Neutral",  color: "bg-yellow-400", dot: "bg-yellow-400" },
                  { key: "negative", label: "Negative", color: "bg-red-500",   dot: "bg-red-500" },
                ].map(({ key, label, color, dot }) => {
                  const count = summary.sentimentCounts[key as keyof typeof summary.sentimentCounts];
                  const pct = summary.total > 0 ? (count / summary.total) * 100 : 0;
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${dot}`} />
                          {label}
                        </span>
                        <span className="font-medium">{count} ({Math.round(pct)}%)</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
                <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                  {summary.positivePercent}% of reviewed orders rated positively
                </p>
              </div>
            </div>
          </div>

          {/* ── Filter Tabs ── */}
          <div className="flex gap-2 flex-wrap">
            {[
              { key: "all",      label: `All (${reviews.length})` },
              { key: "positive", label: `Positive (${summary.sentimentCounts.positive})` },
              { key: "neutral",  label: `Neutral (${summary.sentimentCounts.neutral})` },
              { key: "negative", label: `Negative (${summary.sentimentCounts.negative})` },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key as typeof filter)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  filter === key
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── Reviews List ── */}
          <div className="space-y-4">
            {filtered.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center text-gray-400 border border-gray-100 dark:border-gray-700">
                No {filter} reviews yet.
              </div>
            ) : (
              filtered.map((review) => (
                <div
                  key={review._id}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <Stars rating={review.rating} />
                      <span className="text-sm text-gray-500">
                        Table {review.tableSlug}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {review.sentiment?.label && (
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${sentimentStyle[review.sentiment.label]}`}>
                          {review.sentiment.label}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  {review.text && (
                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-3">
                      &ldquo;{review.text}&rdquo;
                    </p>
                  )}

                  {review.sentiment?.summary && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic mb-2">
                      AI: {review.sentiment.summary}
                    </p>
                  )}

                  {review.sentiment?.tags && review.sentiment.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {review.sentiment.tags.map((tag) => (
                        <span
                          key={tag}
                          className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2.5 py-1 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        /* Empty state */
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-16 text-center">
          <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          </div>
          <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">No reviews yet</p>
          <p className="text-gray-400 text-sm mt-1">
            Feedback will appear here after customers complete an order.
          </p>
        </div>
      )}
    </div>
  );
}
