import type { OrderListItem, OrdersListResponse, OrderStatus } from "@bawarchie/types";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { brand } from "@/constants/brand";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const POLL_MS = 5000;

const STATUS_STYLES: Record<OrderStatus, { bg: string; fg: string; label: string }> = {
  pending: { bg: "#FEF3C7", fg: "#92400E", label: "Pending" },
  preparing: { bg: "#DBEAFE", fg: "#1E40AF", label: "Preparing" },
  served: { bg: "#D1FAE5", fg: "#065F46", label: "Served" },
  cancelled: { bg: "#FEE2E2", fg: "#991B1B", label: "Cancelled" },
  refunded: { bg: "#F5F5F4", fg: "#57534E", label: "Refunded" },
};

function formatINR(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function formatRelative(iso: string): string {
  const t = new Date(iso).getTime();
  const diffSec = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return new Date(iso).toLocaleDateString();
}

export default function OrdersScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    const res = await api.get<OrdersListResponse>("/api/orders", { token });
    if (!isMounted.current) return;
    if (res.success) {
      setOrders(res.orders);
      setError(null);
    } else {
      setError(res.error);
    }
  }, [token]);

  useEffect(() => {
    fetchOrders();
    const id = setInterval(fetchOrders, POLL_MS);
    return () => clearInterval(id);
  }, [fetchOrders]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, [fetchOrders]);

  return (
    <View style={styles.flex}>
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {orders == null ? (
        <View style={styles.center}>
          <ActivityIndicator color={brand.navy} />
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptySub}>
            New orders from your tables will appear here automatically.
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o._id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={brand.navy}
            />
          }
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              onPress={() => router.push(`/orders/${item._id}` as never)}
            />
          )}
        />
      )}
    </View>
  );
}

function OrderCard({
  order,
  onPress,
}: {
  order: OrderListItem;
  onPress: () => void;
}) {
  const status = STATUS_STYLES[order.status] ?? STATUS_STYLES.pending;
  const amount = order.finalAmount ?? order.total;
  const lines = order.items
    .map((it) => `${it.qty}× ${it.itemId?.name ?? "Item"}`)
    .join(" · ");

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.cardTop}>
        <View>
          <Text style={styles.cardTable}>Table {order.tableSlug}</Text>
          <Text style={styles.cardTime}>{formatRelative(order.createdAt)}</Text>
        </View>
        <View style={[styles.pill, { backgroundColor: status.bg }]}>
          <Text style={[styles.pillText, { color: status.fg }]}>{status.label}</Text>
        </View>
      </View>
      <Text style={styles.cardItems} numberOfLines={2}>
        {lines || "No items"}
      </Text>
      <View style={styles.cardBottom}>
        <Text style={styles.cardAmount}>{formatINR(amount)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: brand.offwhite },
  errorBox: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorText: { color: brand.danger, fontSize: 13 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyTitle: {
    color: brand.stoneText,
    fontSize: 18,
    fontWeight: "600",
  },
  emptySub: {
    color: brand.stoneMuted,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  listContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 },
  sep: { height: 12 },
  card: {
    backgroundColor: brand.white,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: brand.stoneBorder,
    gap: 10,
  },
  cardPressed: { opacity: 0.75 },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardTable: {
    color: brand.navy,
    fontSize: 16,
    fontWeight: "700",
  },
  cardTime: {
    color: brand.stoneMuted,
    fontSize: 12,
    marginTop: 2,
  },
  cardItems: {
    color: brand.stoneText,
    fontSize: 14,
    lineHeight: 20,
  },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 2,
  },
  cardAmount: {
    color: brand.navy,
    fontSize: 16,
    fontWeight: "700",
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillText: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});
