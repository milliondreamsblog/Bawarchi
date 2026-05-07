"use client";

import React, { useEffect, useState } from "react";
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

/* â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

/* â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);

const RANGE_OPTIONS = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
];

const BAR_COLORS = [
  "#16a34a", "#22c55e", "#4ade80", "#86efac",
  "#bbf7d0", "#059669", "#10b981", "#34d399",
];

/* â”€â”€â”€ Stat Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function StatCard({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${accent}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

/* â”€â”€â”€ Custom Tooltip â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function RevenueTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl p-3 shadow-lg text-sm">
      <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">{label}</p>
      <p className="text-[#324F7B]">Revenue: â‚¹{fmt(payload[0]?.value ?? 0)}</p>
      <p className="text-blue-600">Orders: {payload[1]?.value ?? 0}</p>
    </div>
  );
}

/* â”€â”€â”€ Main Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export default function AnalyticsPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [range, setRange] = useState(30);

  useEffect(() => {
    if (!slug) return;

    const fetchAnalytics = async () => {
      setLoading(true);
      setError("");
      try {
        // Resolve restaurantId from slug
        const restRes = await fetch(`/api/restaurant/by-slug/${slug}`);
        const restData = await restRes.json();
        if (!restData.success) throw new Error("Restaurant not found");

        const res = await fetch(
          `/api/analytics?restaurantId=${restData.restaurant._id}&range=${range}`
        );
        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Failed to fetch analytics");
        setData(json.data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [slug, range]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#324F7B] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 dark:text-gray-400">Crunching your numbers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center border border-red-100">
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const { summary, dailyRevenue, topItems, peakHours, statusBreakdown } = data;

  // Format date labels for chart (show only day/month)
  const chartData = dailyRevenue.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    }),
  }));

  const totalStatusOrders =
    statusBreakdown.pending + statusBreakdown.preparing + statusBreakdown.served;

  return (
    <div className="space-y-8">
      {/* â”€â”€ Header â”€â”€ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Business intelligence for your restaurant</p>
        </div>
        <div className="flex gap-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRange(opt.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                range === opt.value
                  ? "bg-white text-[#324F7B] shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* â”€â”€ Summary Cards â”€â”€ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Revenue"
          value={`â‚¹${fmt(summary.totalRevenue)}`}
          sub={`Last ${range} days`}
          accent="bg-[#86A6DE]/20"
          icon={
            <svg className="w-6 h-6 text-[#324F7B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Total Orders"
          value={fmt(summary.totalOrders)}
          sub={`Avg â‚¹${fmt(summary.avgOrderValue)} / order`}
          accent="bg-blue-100"
          icon={
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          }
        />
        <StatCard
          label="Restaurant Earnings"
          value={`â‚¹${fmt(summary.totalRestaurantEarnings)}`}
          sub="After GST & platform fee"
          accent="bg-purple-100"
          icon={
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
        <StatCard
          label="GST Collected"
          value={`â‚¹${fmt(summary.totalGst)}`}
          sub={`Platform fee: â‚¹${fmt(summary.totalPlatformFee)}`}
          accent="bg-orange-100"
          icon={
            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          }
        />
      </div>

      {/* â”€â”€ Revenue Over Time â”€â”€ */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Revenue Trend</h2>
        <p className="text-sm text-gray-400 mb-6">Daily revenue and order volume</p>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={false}
              interval={range === 7 ? 0 : range === 30 ? 4 : 13}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `â‚¹${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
            />
            <Tooltip content={<RevenueTooltip />} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#16a34a"
              strokeWidth={2.5}
              fill="url(#revGrad)"
              dot={false}
              activeDot={{ r: 5, fill: "#16a34a" }}
            />
            <Area
              type="monotone"
              dataKey="orders"
              stroke="#3b82f6"
              strokeWidth={1.5}
              fill="none"
              strokeDasharray="4 3"
              dot={false}
              activeDot={{ r: 4, fill: "#3b82f6" }}
            />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex gap-6 mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-6 border-t-2 border-[#324F7B] inline-block" />
            Revenue (â‚¹)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-6 border-t-2 border-blue-500 border-dashed inline-block" />
            Orders
          </span>
        </div>
      </div>

      {/* â”€â”€ Top Items + Peak Hours â”€â”€ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Items */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Top Selling Items</h2>
          <p className="text-sm text-gray-400 mb-6">By quantity ordered</p>
          {topItems.length === 0 ? (
            <p className="text-gray-400 text-center py-10">No order data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={topItems}
                layout="vertical"
                margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={110}
                  tick={{ fontSize: 11, fill: "#374151" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(v) => [`${v} orders`, "Qty"]}
                  contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }}
                />
                <Bar dataKey="totalQty" radius={[0, 6, 6, 0]}>
                  {topItems.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Peak Hours */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Peak Hours</h2>
          <p className="text-sm text-gray-400 mb-6">Order volume by hour of day</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={peakHours} margin={{ top: 0, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
                interval={3}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                formatter={(v) => [`${v} orders`, "Orders"]}
                contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }}
              />
              <Bar dataKey="orders" fill="#16a34a" radius={[4, 4, 0, 0]} maxBarSize={20}>
                {peakHours.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.orders === Math.max(...peakHours.map((h) => h.orders))
                      ? "#15803d"
                      : "#86efac"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* â”€â”€ Order Status Breakdown â”€â”€ */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">All-Time Order Status</h2>
        <p className="text-sm text-gray-400 mb-6">Total orders across all time by fulfillment stage</p>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Pending", key: "pending", color: "bg-yellow-100 text-yellow-800", dot: "bg-yellow-500" },
            { label: "Preparing", key: "preparing", color: "bg-blue-100 text-blue-800", dot: "bg-blue-500" },
            { label: "Served", key: "served", color: "bg-[#86A6DE]/20 text-[#324F7B]", dot: "bg-[#86A6DE]/100" },
          ].map(({ label, key, color, dot }) => {
            const count = statusBreakdown[key as keyof typeof statusBreakdown];
            const pct = totalStatusOrders > 0 ? Math.round((count / totalStatusOrders) * 100) : 0;
            return (
              <div key={key} className={`rounded-xl p-5 text-center ${color}`}>
                <div className={`w-3 h-3 rounded-full ${dot} mx-auto mb-2`} />
                <p className="text-3xl font-bold">{fmt(count)}</p>
                <p className="text-sm font-medium mt-1">{label}</p>
                <p className="text-xs opacity-70 mt-0.5">{pct}% of total</p>
              </div>
            );
          })}
        </div>
        {/* Progress bar */}
        {totalStatusOrders > 0 && (
          <div className="mt-4 h-2.5 bg-gray-100 rounded-full overflow-hidden flex">
            <div
              className="bg-yellow-400 h-full transition-all"
              style={{ width: `${(statusBreakdown.pending / totalStatusOrders) * 100}%` }}
            />
            <div
              className="bg-blue-500 h-full transition-all"
              style={{ width: `${(statusBreakdown.preparing / totalStatusOrders) * 100}%` }}
            />
            <div
              className="bg-[#86A6DE]/100 h-full transition-all"
              style={{ width: `${(statusBreakdown.served / totalStatusOrders) * 100}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
