/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  TrendingUp,
  ShoppingBag,
  Coins,
  Receipt,
  Download,
  RefreshCw,
  BarChart3,
} from "lucide-react";

interface DailyRevenue {
  date: string;
  revenue: number;
  orders: number;
}
interface TopItem {
  name: string;
  category: string;
  totalQty: number;
}
interface PeakHour {
  hour: number;
  label: string;
  orders: number;
}
interface Summary {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  totalPlatformFee: number;
  totalRestaurantEarnings: number;
  totalGst: number;
}
interface AnalyticsData {
  dailyRevenue: DailyRevenue[];
  topItems: TopItem[];
  peakHours: PeakHour[];
  summary: Summary;
  statusBreakdown: { pending: number; preparing: number; served: number };
  range: number;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);

const RANGE_OPTIONS = [
  { label: "7d", value: 7 },
  { label: "30d", value: 30 },
  { label: "90d", value: 90 },
];

// Monochromatic navy → sky ramp for ranked bars
const RAMP = ["#324F7B", "#3D5C8A", "#4A6A9B", "#5A78A8", "#6B87B5", "#7C97C2", "#8DA6CF", "#A1B7DB"];

function RevenueTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-stone-200 rounded-xl px-3 py-2 shadow-md text-xs">
      <p className="font-semibold text-stone-700 mb-1">{label}</p>
      <p className="text-[#324F7B]">Revenue: ₹{fmt(payload[0]?.value ?? 0)}</p>
      <p className="text-[#5067AA]">Orders: {payload[1]?.value ?? 0}</p>
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  icon,
  spark,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  spark?: number[];
}) {
  return (
    <div className="rounded-2xl bg-white border border-stone-200 p-4 sm:p-5 hover:border-[#86A6DE] transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">
          {label}
        </span>
        <span className="w-8 h-8 rounded-lg bg-[#86A6DE]/15 flex items-center justify-center text-[#324F7B]">
          {icon}
        </span>
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-stone-900 leading-tight">{value}</p>
      <div className="flex items-end justify-between gap-2 mt-1">
        {sub && <p className="text-[11px] text-stone-500 truncate">{sub}</p>}
        {spark && spark.length > 1 && (
          <div className="w-20 h-7 -mb-1 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spark.map((v, i) => ({ i, v }))}>
                <defs>
                  <linearGradient id={`spark-${label}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#324F7B" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#324F7B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke="#324F7B"
                  strokeWidth={1.5}
                  fill={`url(#spark-${label})`}
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [range, setRange] = useState(30);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  async function fetchAnalytics(rangeVal: number, isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      let id = restaurantId;
      if (!id) {
        const restRes = await fetch(`/api/restaurant/by-slug/${slug}`);
        const restData = await restRes.json();
        if (!restData.success) throw new Error("Restaurant not found");
        id = restData.restaurant._id;
        setRestaurantId(id);
      }

      const res = await fetch(
        `/api/analytics?restaurantId=${id}&range=${rangeVal}`
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to fetch analytics");
      setData(json.data);
      setUpdatedAt(new Date());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (!slug) return;
    fetchAnalytics(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, range]);

  function exportCsv() {
    if (!restaurantId) return;
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - range);
    const params = new URLSearchParams({
      restaurantId,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    });
    window.open(`/api/export/orders?${params.toString()}`, "_blank");
  }

  const chartData = useMemo(
    () =>
      (data?.dailyRevenue || []).map((d) => ({
        ...d,
        label: new Date(d.date).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
        }),
      })),
    [data]
  );

  const sparkRevenue = useMemo(
    () => (data?.dailyRevenue || []).map((d) => d.revenue),
    [data]
  );
  const sparkOrders = useMemo(
    () => (data?.dailyRevenue || []).map((d) => d.orders),
    [data]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-2 border-[#86A6DE]/30 border-t-[#324F7B] rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-white border border-red-200 p-8 text-center">
        <p className="text-red-600 font-medium">{error}</p>
        <button
          onClick={() => fetchAnalytics(range, true)}
          className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-stone-200 bg-white text-sm font-medium text-stone-700 hover:bg-stone-50"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { summary, topItems, peakHours, statusBreakdown } = data;
  const totalStatus =
    statusBreakdown.pending + statusBreakdown.preparing + statusBreakdown.served;
  const peakMax = Math.max(...peakHours.map((h) => h.orders), 0);
  const empty = summary.totalOrders === 0;

  return (
    <div className="space-y-4 pb-6">
      {/* Sticky toolbar */}
      <div className="sticky top-14 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-[#F8F8F8]/90 backdrop-blur border-b border-stone-200">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-baseline gap-2 flex-1 min-w-[160px]">
            <h1 className="text-lg sm:text-xl font-semibold text-stone-900">Analytics</h1>
            {updatedAt && (
              <span className="text-[11px] text-stone-500 hidden sm:inline">
                Updated {updatedAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>

          {/* Range pill */}
          <div className="inline-flex rounded-lg bg-white border border-stone-200 p-0.5">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRange(opt.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  range === opt.value
                    ? "bg-[#324F7B] text-white"
                    : "text-stone-600 hover:text-[#324F7B]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchAnalytics(range, true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 p-2 rounded-full border border-stone-200 bg-white text-stone-500 hover:text-[#324F7B] hover:bg-stone-50 disabled:opacity-50"
            title="Refresh"
            aria-label="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={exportCsv}
            disabled={empty}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-stone-200 bg-white text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Export orders as CSV for this range"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {empty ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-10 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#86A6DE]/15 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-[#324F7B]" />
          </div>
          <h3 className="text-base font-semibold text-stone-900">No orders in this range</h3>
          <p className="text-sm text-stone-500 mt-1">
            Try a longer window or wait for more orders to come in.
          </p>
        </div>
      ) : (
        <>
          {/* KPI strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard
              label="Revenue"
              value={`₹${fmt(summary.totalRevenue)}`}
              sub={`Last ${range}d`}
              icon={<Coins className="w-4 h-4" />}
              spark={sparkRevenue}
            />
            <KpiCard
              label="Orders"
              value={fmt(summary.totalOrders)}
              sub={`Avg ₹${fmt(summary.avgOrderValue)} / order`}
              icon={<ShoppingBag className="w-4 h-4" />}
              spark={sparkOrders}
            />
            <KpiCard
              label="Earnings"
              value={`₹${fmt(summary.totalRestaurantEarnings)}`}
              sub="After GST & platform fee"
              icon={<TrendingUp className="w-4 h-4" />}
            />
            <KpiCard
              label="GST collected"
              value={`₹${fmt(summary.totalGst)}`}
              sub={`Platform fee ₹${fmt(summary.totalPlatformFee)}`}
              icon={<Receipt className="w-4 h-4" />}
            />
          </div>

          {/* Revenue trend */}
          <div className="rounded-2xl bg-white border border-stone-200 p-4 sm:p-5">
            <div className="flex items-baseline justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-stone-900">Revenue trend</h2>
                <p className="text-[11px] text-stone-500">Daily revenue and order volume</p>
              </div>
              <div className="hidden sm:flex gap-4 text-[11px] text-stone-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-5 border-t-2 border-[#324F7B] inline-block" />
                  Revenue
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-5 border-t-2 border-[#86A6DE] border-dashed inline-block" />
                  Orders
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#324F7B" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#324F7B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1efed" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "#a8a29e" }}
                  tickLine={false}
                  axisLine={false}
                  interval={range === 7 ? 0 : range === 30 ? 4 : 13}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#a8a29e" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
                />
                <Tooltip content={<RevenueTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#324F7B"
                  strokeWidth={2.25}
                  fill="url(#revGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: "#324F7B" }}
                />
                <Area
                  type="monotone"
                  dataKey="orders"
                  stroke="#86A6DE"
                  strokeWidth={1.5}
                  fill="none"
                  strokeDasharray="4 3"
                  dot={false}
                  activeDot={{ r: 3, fill: "#86A6DE" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Top items + Peak hours */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-white border border-stone-200 p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-stone-900">Top selling items</h2>
              <p className="text-[11px] text-stone-500 mb-4">Top 8 by quantity</p>
              {topItems.length === 0 ? (
                <p className="text-stone-400 text-center py-10 text-sm">No order data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={topItems}
                    layout="vertical"
                    margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1efed" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 10, fill: "#a8a29e" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={110}
                      tick={{ fontSize: 11, fill: "#44403c" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      formatter={(v) => [`${v} orders`, "Qty"]}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #e7e5e4",
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="totalQty" radius={[0, 6, 6, 0]} maxBarSize={20}>
                      {topItems.map((_, i) => (
                        <Cell key={i} fill={RAMP[i % RAMP.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="rounded-2xl bg-white border border-stone-200 p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-stone-900">Peak hours</h2>
              <p className="text-[11px] text-stone-500 mb-4">Order volume by hour of day</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={peakHours} margin={{ top: 0, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1efed" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 9, fill: "#a8a29e" }}
                    tickLine={false}
                    axisLine={false}
                    interval={3}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#a8a29e" }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    formatter={(v) => [`${v} orders`, "Orders"]}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #e7e5e4",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="orders" radius={[4, 4, 0, 0]} maxBarSize={18}>
                    {peakHours.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.orders === peakMax && peakMax > 0 ? "#324F7B" : "#86A6DE"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* All-time order status (always shown) */}
      <div className="rounded-2xl bg-white border border-stone-200 p-4 sm:p-5">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-stone-900">Order status (all time)</h2>
            <p className="text-[11px] text-stone-500">Across the lifetime of your restaurant</p>
          </div>
          <span className="text-[11px] text-stone-500">{fmt(totalStatus)} total</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: "Pending",
              key: "pending" as const,
              tile: "bg-amber-50 text-amber-700 border-amber-200",
              dot: "bg-amber-500",
            },
            {
              label: "Preparing",
              key: "preparing" as const,
              tile: "bg-[#86A6DE]/15 text-[#324F7B] border-[#86A6DE]/40",
              dot: "bg-[#5067AA]",
            },
            {
              label: "Served",
              key: "served" as const,
              tile: "bg-emerald-50 text-emerald-700 border-emerald-200",
              dot: "bg-emerald-500",
            },
          ].map(({ label, key, tile, dot }) => {
            const count = statusBreakdown[key];
            const pct = totalStatus > 0 ? Math.round((count / totalStatus) * 100) : 0;
            return (
              <div key={key} className={`rounded-xl border p-4 text-center ${tile}`}>
                <div className={`w-2 h-2 rounded-full ${dot} mx-auto mb-1.5`} />
                <p className="text-2xl font-bold">{fmt(count)}</p>
                <p className="text-xs font-semibold mt-0.5">{label}</p>
                <p className="text-[10px] opacity-70 mt-0.5">{pct}%</p>
              </div>
            );
          })}
        </div>
        {totalStatus > 0 && (
          <div className="mt-3 h-2 bg-stone-100 rounded-full overflow-hidden flex">
            <div
              className="bg-amber-400 h-full"
              style={{ width: `${(statusBreakdown.pending / totalStatus) * 100}%` }}
            />
            <div
              className="bg-[#5067AA] h-full"
              style={{ width: `${(statusBreakdown.preparing / totalStatus) * 100}%` }}
            />
            <div
              className="bg-emerald-500 h-full"
              style={{ width: `${(statusBreakdown.served / totalStatus) * 100}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
