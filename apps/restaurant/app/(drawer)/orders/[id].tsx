import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { OrderListItem, OrderStatus } from "@bawarchie/types";
import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { brand } from "@/constants/brand";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type OrderDetail = OrderListItem & {
  gstPercentage?: number;
  restaurantEarnings?: number;
  myEarnings?: number;
  razorpayPaymentId?: string;
  refundStatus?: "pending" | "processed" | "failed";
  refundAmount?: number;
  refundId?: string;
};

const STATUS_LABEL: Record<OrderStatus, { bg: string; fg: string; label: string }> = {
  pending: { bg: "#FEF3C7", fg: "#92400E", label: "Pending" },
  preparing: { bg: "#DBEAFE", fg: "#1E40AF", label: "Preparing" },
  served: { bg: "#D1FAE5", fg: "#065F46", label: "Served" },
  cancelled: { bg: "#FEE2E2", fg: "#991B1B", label: "Cancelled" },
  refunded: { bg: "#F5F5F4", fg: "#57534E", label: "Refunded" },
};

function formatINR(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchOrder = useCallback(async () => {
    if (!id || !token) return;
    const res = await api.get<{ order: OrderDetail }>(`/api/orders/${id}`, { token });
    if (!isMounted.current) return;
    if (res.success) {
      setOrder(res.order);
      setError(null);
    } else {
      setError(res.error);
    }
  }, [id, token]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  async function updateStatus(next: OrderStatus) {
    if (!id) return;
    setUpdating(true);
    const res = await api.patch<{ order: OrderDetail }>(
      `/api/orders/${id}`,
      { status: next },
      { token }
    );
    if (!isMounted.current) return;
    setUpdating(false);
    if (!res.success) {
      Alert.alert("Update failed", res.error);
      return;
    }
    // Re-fetch — server may have side-effects we want reflected (e.g. table freed)
    fetchOrder();
  }

  if (order == null) {
    return (
      <>
        <Stack.Screen options={{ title: "Order" }} />
        <View style={styles.center}>
          {error ? (
            <>
              <Text style={styles.errorTitle}>Couldn't load order</Text>
              <Text style={styles.errorSub}>{error}</Text>
            </>
          ) : (
            <ActivityIndicator color={brand.navy} />
          )}
        </View>
      </>
    );
  }

  const status = STATUS_LABEL[order.status] ?? STATUS_LABEL.pending;
  const amount = order.finalAmount ?? order.total;
  const isActive = order.status === "pending" || order.status === "preparing";

  return (
    <>
      <Stack.Screen options={{ title: `Table ${order.tableSlug}` }} />
      <ScrollView style={styles.flex} contentContainerStyle={styles.scroll}>
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.tableLabel}>Table {order.tableSlug}</Text>
              <Text style={styles.timeLabel}>
                Placed {formatDateTime(order.createdAt)}
              </Text>
            </View>
            <View style={[styles.pill, { backgroundColor: status.bg }]}>
              <Text style={[styles.pillText, { color: status.fg }]}>
                {status.label}
              </Text>
            </View>
          </View>
          {order.customerPhone && (
            <View style={styles.contactRow}>
              <MaterialIcons name="call" size={14} color={brand.stoneMuted} />
              <Text style={styles.contactText}>{order.customerPhone}</Text>
            </View>
          )}
        </View>

        {isActive && (
          <View style={styles.actions}>
            {order.status === "pending" && (
              <ActionBtn
                label="Start preparing"
                tone="primary"
                busy={updating}
                onPress={() => updateStatus("preparing")}
              />
            )}
            {order.status === "preparing" && (
              <ActionBtn
                label="Mark served"
                tone="success"
                busy={updating}
                onPress={() => updateStatus("served")}
              />
            )}
            <ActionBtn
              label="Cancel"
              tone="ghost"
              busy={updating}
              onPress={() =>
                Alert.alert("Cancel this order?", "This cannot be undone.", [
                  { text: "Keep", style: "cancel" },
                  {
                    text: "Cancel order",
                    style: "destructive",
                    onPress: () => updateStatus("cancelled"),
                  },
                ])
              }
            />
          </View>
        )}

        <SectionCard title="Items">
          {order.items.map((it, idx) => {
            const unit = it.itemId?.price ?? 0;
            const line = unit * it.qty;
            return (
              <View key={`${order._id}-${idx}`} style={styles.itemRow}>
                <Text style={styles.itemQty}>{it.qty}×</Text>
                <View style={styles.itemBody}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {it.itemId?.name ?? "Item"}
                  </Text>
                  <Text style={styles.itemUnit}>{formatINR(unit)} each</Text>
                </View>
                <Text style={styles.itemLine}>{formatINR(line)}</Text>
              </View>
            );
          })}
        </SectionCard>

        <SectionCard title="Billing">
          <BillRow label="Subtotal" value={formatINR(order.baseTotal ?? amount)} />
          {typeof order.gstAmount === "number" && order.gstAmount > 0 && (
            <BillRow
              label={`GST${order.gstPercentage ? ` (${order.gstPercentage}%)` : ""}`}
              value={formatINR(order.gstAmount)}
            />
          )}
          {typeof order.platformFee === "number" && order.platformFee > 0 && (
            <BillRow label="Platform fee" value={formatINR(order.platformFee)} />
          )}
          <View style={styles.billDivider} />
          <BillRow label="Total" value={formatINR(amount)} emphasised />
          {typeof order.restaurantEarnings === "number" && (
            <Text style={styles.billHint}>
              Your share: {formatINR(order.restaurantEarnings)}
            </Text>
          )}
        </SectionCard>

        {order.status === "cancelled" && (
          <SectionCard title="Cancellation">
            <Text style={styles.metaLine}>
              By {order.cancelledBy ?? "—"}
              {order.cancelledAt ? ` · ${formatDateTime(order.cancelledAt)}` : ""}
            </Text>
            {order.cancellationReason && (
              <Text style={styles.metaLine}>{order.cancellationReason}</Text>
            )}
            {order.refundStatus && (
              <View style={[styles.refundPill, refundPalette(order.refundStatus)]}>
                <Text style={[styles.refundPillText, refundPalette(order.refundStatus)]}>
                  Refund {order.refundStatus}
                  {typeof order.refundAmount === "number"
                    ? ` · ${formatINR(order.refundAmount)}`
                    : ""}
                </Text>
              </View>
            )}
          </SectionCard>
        )}

        {(order.razorpayOrderId || order.razorpayPaymentId) && (
          <SectionCard title="Payment">
            {order.razorpayOrderId && (
              <Text style={styles.metaMono} selectable>
                Order: {order.razorpayOrderId}
              </Text>
            )}
            {order.razorpayPaymentId && (
              <Text style={styles.metaMono} selectable>
                Payment: {order.razorpayPaymentId}
              </Text>
            )}
          </SectionCard>
        )}
      </ScrollView>
    </>
  );
}

function refundPalette(status: "pending" | "processed" | "failed") {
  if (status === "processed") return { backgroundColor: "#D1FAE5", color: "#065F46" };
  if (status === "failed") return { backgroundColor: "#FEE2E2", color: "#991B1B" };
  return { backgroundColor: "#FEF3C7", color: "#92400E" };
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function BillRow({
  label,
  value,
  emphasised,
}: {
  label: string;
  value: string;
  emphasised?: boolean;
}) {
  return (
    <View style={styles.billRow}>
      <Text style={[styles.billLabel, emphasised && styles.billLabelEmphasised]}>
        {label}
      </Text>
      <Text style={[styles.billValue, emphasised && styles.billValueEmphasised]}>
        {value}
      </Text>
    </View>
  );
}

function ActionBtn({
  label,
  tone,
  busy,
  onPress,
}: {
  label: string;
  tone: "primary" | "success" | "ghost";
  busy: boolean;
  onPress: () => void;
}) {
  const palette =
    tone === "primary"
      ? { bg: brand.navy, fg: brand.white, border: brand.navy }
      : tone === "success"
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
  scroll: { padding: 16, gap: 12, paddingBottom: 40 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 8,
    backgroundColor: brand.offwhite,
  },
  errorTitle: { color: brand.stoneText, fontSize: 17, fontWeight: "600" },
  errorSub: { color: brand.stoneMuted, fontSize: 13, textAlign: "center" },
  headerCard: {
    backgroundColor: brand.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: brand.stoneBorder,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  tableLabel: { color: brand.navy, fontSize: 18, fontWeight: "700" },
  timeLabel: { color: brand.stoneMuted, fontSize: 12, marginTop: 2 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  pillText: { fontSize: 11, fontWeight: "600", letterSpacing: 0.3 },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: brand.stoneBorder,
  },
  contactText: { color: brand.stoneText, fontSize: 13 },
  actions: { flexDirection: "row", gap: 8 },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 42,
  },
  actionPressed: { opacity: 0.8 },
  actionDisabled: { opacity: 0.55 },
  actionText: { fontSize: 13, fontWeight: "600" },
  section: {
    backgroundColor: brand.white,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: brand.stoneBorder,
    gap: 10,
  },
  sectionTitle: {
    color: brand.navy,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 6,
  },
  itemQty: {
    color: brand.navy,
    fontSize: 14,
    fontWeight: "700",
    width: 30,
  },
  itemBody: { flex: 1 },
  itemName: { color: brand.stoneText, fontSize: 14, fontWeight: "500" },
  itemUnit: { color: brand.stoneMuted, fontSize: 11, marginTop: 1 },
  itemLine: { color: brand.navy, fontSize: 14, fontWeight: "600" },
  billRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  billLabel: { color: brand.stoneText, fontSize: 13 },
  billLabelEmphasised: { color: brand.navy, fontSize: 15, fontWeight: "700" },
  billValue: { color: brand.stoneText, fontSize: 13 },
  billValueEmphasised: { color: brand.navy, fontSize: 15, fontWeight: "700" },
  billDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: brand.stoneBorder,
    marginVertical: 4,
  },
  billHint: { color: brand.stoneMuted, fontSize: 11, marginTop: 2 },
  metaLine: { color: brand.stoneText, fontSize: 13 },
  metaMono: { color: brand.stoneText, fontSize: 12, fontFamily: "Menlo" },
  refundPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: 4,
  },
  refundPillText: { fontSize: 11, fontWeight: "600" },
});
