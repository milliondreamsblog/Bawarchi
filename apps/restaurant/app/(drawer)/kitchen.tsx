import type { OrderListItem, OrdersListResponse, OrderStatus } from "@bawarchie/types";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
const ACTIVE_STATES: OrderStatus[] = ["pending", "preparing"];

const STATUS_LABEL: Record<OrderStatus, { bg: string; fg: string; label: string }> = {
  pending: { bg: "#FEF3C7", fg: "#92400E", label: "Pending" },
  preparing: { bg: "#DBEAFE", fg: "#1E40AF", label: "Preparing" },
  served: { bg: "#D1FAE5", fg: "#065F46", label: "Served" },
  cancelled: { bg: "#FEE2E2", fg: "#991B1B", label: "Cancelled" },
  refunded: { bg: "#F5F5F4", fg: "#57534E", label: "Refunded" },
};

function formatRelative(iso: string): string {
  const t = new Date(iso).getTime();
  const diffSec = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (diffSec < 60) return `${diffSec}s`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.round(diffMin / 60);
  return `${diffHr}h`;
}

export default function KitchenScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState<Record<string, boolean>>({});
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

  const updateStatus = useCallback(
    async (orderId: string, next: OrderStatus) => {
      setUpdating((u) => ({ ...u, [orderId]: true }));
      // Optimistic update
      setOrders((prev) =>
        prev?.map((o) => (o._id === orderId ? { ...o, status: next } : o)) ?? prev
      );
      const res = await api.patch(`/api/orders/${orderId}`, { status: next }, { token });
      if (!isMounted.current) return;
      setUpdating((u) => {
        const copy = { ...u };
        delete copy[orderId];
        return copy;
      });
      if (!res.success) {
        // Roll back by re-fetching authoritative state
        Alert.alert("Update failed", res.error);
        fetchOrders();
      }
    },
    [token, fetchOrders]
  );

  const active = useMemo(
    () => orders?.filter((o) => ACTIVE_STATES.includes(o.status)) ?? null,
    [orders]
  );

  return (
    <View style={styles.flex}>
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {active == null ? (
        <View style={styles.center}>
          <ActivityIndicator color={brand.navy} />
        </View>
      ) : active.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Kitchen is clear</Text>
          <Text style={styles.emptySub}>
            No pending or preparing orders. New tickets show up here automatically.
          </Text>
        </View>
      ) : (
        <FlatList
          data={active}
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
            <KitchenCard
              order={item}
              busy={!!updating[item._id]}
              onAction={(next) => updateStatus(item._id, next)}
              onOpen={() => router.push(`/orders/${item._id}` as never)}
            />
          )}
        />
      )}
    </View>
  );
}

function KitchenCard({
  order,
  busy,
  onAction,
  onOpen,
}: {
  order: OrderListItem;
  busy: boolean;
  onAction: (next: OrderStatus) => void;
  onOpen: () => void;
}) {
  const status = STATUS_LABEL[order.status] ?? STATUS_LABEL.pending;

  return (
    <View style={styles.card}>
      <Pressable
        onPress={onOpen}
        style={({ pressed }) => [styles.cardTop, pressed && styles.cardTopPressed]}
      >
        <View>
          <Text style={styles.cardTable}>Table {order.tableSlug}</Text>
          <Text style={styles.cardTime}>
            {formatRelative(order.createdAt)} · {order.items.length} item
            {order.items.length === 1 ? "" : "s"}
          </Text>
        </View>
        <View style={[styles.pill, { backgroundColor: status.bg }]}>
          <Text style={[styles.pillText, { color: status.fg }]}>{status.label}</Text>
        </View>
      </Pressable>

      <View style={styles.itemsBlock}>
        {order.items.map((it, idx) => (
          <View key={`${order._id}-${idx}`} style={styles.itemRow}>
            <Text style={styles.itemQty}>{it.qty}×</Text>
            <Text style={styles.itemName} numberOfLines={1}>
              {it.itemId?.name ?? "Item"}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        {order.status === "pending" && (
          <ActionButton
            label="Start preparing"
            variant="primary"
            busy={busy}
            onPress={() => onAction("preparing")}
          />
        )}
        {order.status === "preparing" && (
          <ActionButton
            label="Mark served"
            variant="success"
            busy={busy}
            onPress={() => onAction("served")}
          />
        )}
        <ActionButton
          label="Cancel"
          variant="ghost"
          busy={busy}
          onPress={() =>
            Alert.alert("Cancel this order?", "This cannot be undone.", [
              { text: "Keep order", style: "cancel" },
              {
                text: "Cancel order",
                style: "destructive",
                onPress: () => onAction("cancelled"),
              },
            ])
          }
        />
      </View>
    </View>
  );
}

function ActionButton({
  label,
  variant,
  busy,
  onPress,
}: {
  label: string;
  variant: "primary" | "success" | "ghost";
  busy: boolean;
  onPress: () => void;
}) {
  const palette =
    variant === "primary"
      ? { bg: brand.navy, fg: brand.white, border: brand.navy }
      : variant === "success"
        ? { bg: brand.success, fg: brand.white, border: brand.success }
        : { bg: "transparent", fg: brand.stoneText, border: brand.stoneBorder };

  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      style={({ pressed }) => [
        styles.actionBtn,
        { backgroundColor: palette.bg, borderColor: palette.border },
        pressed && !busy && styles.actionPressed,
        busy && styles.actionDisabled,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={palette.fg} size="small" />
      ) : (
        <Text style={[styles.actionText, { color: palette.fg }]}>{label}</Text>
      )}
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
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyTitle: { color: brand.stoneText, fontSize: 18, fontWeight: "600" },
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
    gap: 14,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardTopPressed: { opacity: 0.7 },
  cardTable: { color: brand.navy, fontSize: 16, fontWeight: "700" },
  cardTime: { color: brand.stoneMuted, fontSize: 12, marginTop: 2 },
  itemsBlock: { gap: 6 },
  itemRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  itemQty: {
    color: brand.navy,
    fontSize: 14,
    fontWeight: "700",
    width: 28,
  },
  itemName: { color: brand.stoneText, fontSize: 14, flex: 1 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  pillText: { fontSize: 11, fontWeight: "600", letterSpacing: 0.3 },
  actions: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  actionBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
    flexBasis: 0,
    minHeight: 42,
  },
  actionPressed: { opacity: 0.8 },
  actionDisabled: { opacity: 0.55 },
  actionText: { fontSize: 14, fontWeight: "600" },
});
