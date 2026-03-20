"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";

/* ─── Types ───────────────────────────────────────────────── */
interface OrderItem {
  itemId: { _id: string; name: string; price: number; category: string } | null;
  qty: number;
}

interface Order {
  _id: string;
  tableSlug: string;
  items: OrderItem[];
  total: number;
  finalAmount?: number;
  status: "pending" | "preparing";
  createdAt: string;
}

/* ─── Urgency helpers ─────────────────────────────────────── */
function getElapsedSeconds(createdAt: string) {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
}

function formatElapsed(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

type Urgency = "fresh" | "warn" | "critical";

function getUrgency(seconds: number): Urgency {
  if (seconds < 300) return "fresh";   // < 5 min
  if (seconds < 600) return "warn";    // 5–10 min
  return "critical";                    // > 10 min
}

const urgencyStyles: Record<Urgency, { border: string; timer: string; badge: string; pulse: boolean }> = {
  fresh: {
    border: "border-l-green-500",
    timer: "text-green-600 bg-green-50",
    badge: "bg-green-100 text-green-700",
    pulse: false,
  },
  warn: {
    border: "border-l-yellow-500",
    timer: "text-yellow-700 bg-yellow-50",
    badge: "bg-yellow-100 text-yellow-700",
    pulse: false,
  },
  critical: {
    border: "border-l-red-500",
    timer: "text-red-700 bg-red-50",
    badge: "bg-red-100 text-red-700",
    pulse: true,
  },
};

/* ─── Web Audio notification ─────────────────────────────── */
function playNewOrderSound() {
  try {
    const ctx = new AudioContext();
    [0, 0.18, 0.36].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = delay === 0 ? 880 : delay === 0.18 ? 1100 : 880;
      gain.gain.setValueAtTime(0.25, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.3);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.3);
    });
  } catch {
    // AudioContext blocked before user gesture — silent fail
  }
}

/* ─── Order Card ──────────────────────────────────────────── */
function OrderCard({
  order,
  elapsed,
  onAction,
  updating,
}: {
  order: Order;
  elapsed: number;
  onAction: (id: string, status: "preparing" | "served") => void;
  updating: boolean;
}) {
  const urgency = getUrgency(elapsed);
  const styles = urgencyStyles[urgency];
  const amount = order.finalAmount ?? order.total;

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 border-l-4 ${styles.border} ${
        styles.pulse ? "animate-pulse-border" : ""
      } p-5 flex flex-col gap-4`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Table
          </span>
          <p className="text-2xl font-bold text-gray-900 leading-tight">
            {order.tableSlug}
          </p>
        </div>
        <div className={`text-xs font-bold px-2.5 py-1.5 rounded-lg tabular-nums ${styles.timer}`}>
          ⏱ {formatElapsed(elapsed)}
        </div>
      </div>

      {/* Items */}
      <div className="space-y-1.5">
        {order.items.map((item, i) => (
          <div key={i} className="flex items-center justify-between">
            {item.itemId ? (
              <>
                <span className="text-sm text-gray-800 font-medium">
                  {item.itemId.name}
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${styles.badge}`}>
                  ×{item.qty}
                </span>
              </>
            ) : (
              <span className="text-sm text-red-400 italic">Item removed ×{item.qty}</span>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <p className="text-lg font-bold text-green-600">₹{amount}</p>
        {order.status === "pending" ? (
          <button
            onClick={() => onAction(order._id, "preparing")}
            disabled={updating}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm"
          >
            {updating ? "..." : "Accept Order"}
          </button>
        ) : (
          <button
            onClick={() => onAction(order._id, "served")}
            disabled={updating}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm"
          >
            {updating ? "..." : "Mark Ready ✓"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Column ──────────────────────────────────────────────── */
function Column({
  title,
  count,
  accent,
  dot,
  children,
}: {
  title: string;
  count: number;
  accent: string;
  dot: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl ${accent}`}>
        <span className={`w-3 h-3 rounded-full ${dot}`} />
        <h2 className="font-bold text-gray-900 text-lg flex-1">{title}</h2>
        <span className="bg-white/70 text-gray-700 font-bold text-sm px-2.5 py-0.5 rounded-full">
          {count}
        </span>
      </div>
      {count === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 text-sm">
          <svg className="w-10 h-10 mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          No orders here
        </div>
      ) : (
        children
      )}
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────── */
export default function KitchenDisplayPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [connected, setConnected] = useState(false);
  const [tick, setTick] = useState(0);          // forces re-render every second for timers
  const [soundOn, setSoundOn] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [lastOrderIds, setLastOrderIds] = useState<Set<string>>(new Set());

  const esRef = useRef<EventSource | null>(null);

  // Tick every second to update elapsed timers
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Resolve restaurant ID from slug
  useEffect(() => {
    if (!slug) return;
    fetch(`/api/restaurant/by-slug/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setRestaurantId(d.restaurant._id);
      });
  }, [slug]);

  // Open SSE connection once we have restaurantId
  useEffect(() => {
    if (!restaurantId) return;

    const es = new EventSource(
      `/api/orders/stream?restaurantId=${restaurantId}`
    );
    esRef.current = es;

    es.onopen = () => setConnected(true);

    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (!data.orders) return;

      const incoming: Order[] = data.orders;
      const incomingIds = new Set(incoming.map((o) => o._id));

      // Detect truly new orders (IDs that weren't there before)
      setLastOrderIds((prev) => {
        const isFirst = prev.size === 0;
        if (!isFirst) {
          const hasNew = incoming.some((o) => !prev.has(o._id));
          if (hasNew && soundOn) playNewOrderSound();
        }
        return incomingIds;
      });

      setOrders(incoming);
    };

    es.onerror = () => setConnected(false);

    return () => {
      es.close();
      setConnected(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  // Keep soundOn ref in sync for the SSE callback
  const soundOnRef = useRef(soundOn);
  useEffect(() => { soundOnRef.current = soundOn; }, [soundOn]);

  const handleAction = useCallback(
    async (orderId: string, newStatus: "preparing" | "served") => {
      if (!restaurantId) return;
      setUpdatingId(orderId);
      try {
        await fetch(`/api/orders/${orderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus, restaurantId }),
        });
        // SSE will push the update automatically within 3s
        // Optimistically remove served orders from view
        if (newStatus === "served") {
          setOrders((prev) => prev.filter((o) => o._id !== orderId));
        } else {
          setOrders((prev) =>
            prev.map((o) =>
              o._id === orderId ? { ...o, status: "preparing" } : o
            )
          );
        }
      } finally {
        setUpdatingId(null);
      }
    },
    [restaurantId]
  );

  const pending = orders.filter((o) => o.status === "pending");
  const preparing = orders.filter((o) => o.status === "preparing");

  if (!restaurantId) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-gray-900">Kitchen Display</h1>
            <span
              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                connected
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  connected ? "bg-green-500 animate-pulse" : "bg-red-500"
                }`}
              />
              {connected ? "Live" : "Reconnecting..."}
            </span>
          </div>
          <p className="text-gray-500 text-sm">
            Real-time order queue • updates every 3 seconds
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Sound toggle */}
          <button
            onClick={() => setSoundOn((s) => !s)}
            title={soundOn ? "Mute notifications" : "Enable notifications"}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
              soundOn
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-gray-200 bg-gray-50 text-gray-500"
            }`}
          >
            {soundOn ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6v12m-3.536-9.536a5 5 0 000 7.072M6.343 6.343a8 8 0 000 11.314" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            )}
            {soundOn ? "Sound On" : "Sound Off"}
          </button>

          {/* Fullscreen */}
          <button
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
              } else {
                document.exitFullscreen();
              }
            }}
            className="px-4 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors text-sm font-medium"
            title="Toggle fullscreen"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Urgency Legend ── */}
      <div className="flex flex-wrap gap-3 text-xs font-medium">
        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg border border-green-200">
          <span className="w-2 h-2 rounded-full bg-green-500" /> Fresh (&lt;5 min)
        </span>
        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-200">
          <span className="w-2 h-2 rounded-full bg-yellow-500" /> Waiting (5–10 min)
        </span>
        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg border border-red-200">
          <span className="w-2 h-2 rounded-full bg-red-500" /> Urgent (&gt;10 min)
        </span>
      </div>

      {/* ── Two-column Kanban ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Column
          title="New Orders"
          count={pending.length}
          accent="bg-yellow-50"
          dot="bg-yellow-500"
        >
          <div className="space-y-4">
            {pending.map((order) => {
              const elapsed = getElapsedSeconds(order.createdAt);
              void tick; // consume tick to trigger re-render
              return (
                <OrderCard
                  key={order._id}
                  order={order}
                  elapsed={elapsed}
                  onAction={handleAction}
                  updating={updatingId === order._id}
                />
              );
            })}
          </div>
        </Column>

        <Column
          title="In Kitchen"
          count={preparing.length}
          accent="bg-blue-50"
          dot="bg-blue-500"
        >
          <div className="space-y-4">
            {preparing.map((order) => {
              const elapsed = getElapsedSeconds(order.createdAt);
              void tick;
              return (
                <OrderCard
                  key={order._id}
                  order={order}
                  elapsed={elapsed}
                  onAction={handleAction}
                  updating={updatingId === order._id}
                />
              );
            })}
          </div>
        </Column>
      </div>

      {/* ── All clear state ── */}
      {orders.length === 0 && connected && (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-gray-500">All clear!</p>
          <p className="text-sm mt-1">No pending or in-progress orders right now.</p>
        </div>
      )}
    </div>
  );
}
