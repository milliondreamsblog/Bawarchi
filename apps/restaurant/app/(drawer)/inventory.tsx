import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { InventoryItem, InventoryListResponse } from "@bawarchie/types";
import { Image } from "expo-image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

type Filter = "all" | "low" | "out";

function isLow(it: InventoryItem): boolean {
  if (typeof it.lowStockThreshold !== "number") return false;
  return it.stock > 0 && it.stock <= it.lowStockThreshold;
}

export default function InventoryScreen() {
  const { user, token } = useAuth();
  const [items, setItems] = useState<InventoryItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [busyIds, setBusyIds] = useState<Record<string, boolean>>({});
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchInventory = useCallback(async () => {
    if (!user?.id) return;
    const res = await api.get<InventoryListResponse>(
      `/api/inventory?restaurantId=${encodeURIComponent(user.id)}`,
      { token }
    );
    if (!isMounted.current) return;
    if (res.success) {
      setItems(res.items);
      setError(null);
    } else {
      setError(res.error);
    }
  }, [token, user?.id]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchInventory();
    setRefreshing(false);
  }, [fetchInventory]);

  const updateStock = useCallback(
    async (itemId: string, nextStock: number) => {
      if (nextStock < 0) return;
      setBusyIds((b) => ({ ...b, [itemId]: true }));
      // Optimistic
      setItems((prev) =>
        prev?.map((i) =>
          i._id === itemId
            ? { ...i, stock: nextStock, available: nextStock !== 0 }
            : i
        ) ?? prev
      );
      const res = await api.patch(
        "/api/inventory",
        { updates: [{ itemId, stock: nextStock }] },
        { token }
      );
      if (!isMounted.current) return;
      setBusyIds((b) => {
        const copy = { ...b };
        delete copy[itemId];
        return copy;
      });
      if (!res.success) {
        // Reconcile from server
        fetchInventory();
      }
    },
    [token, fetchInventory]
  );

  const filtered = useMemo(() => {
    if (!items) return null;
    if (filter === "low") return items.filter(isLow);
    if (filter === "out") return items.filter((i) => i.stock === 0);
    return items;
  }, [items, filter]);

  const counts = useMemo(() => {
    if (!items) return { all: 0, low: 0, out: 0 };
    return {
      all: items.length,
      low: items.filter(isLow).length,
      out: items.filter((i) => i.stock === 0).length,
    };
  }, [items]);

  return (
    <View style={styles.flex}>
      <View style={styles.filterBar}>
        <FilterChip
          label={`All ${counts.all}`}
          active={filter === "all"}
          onPress={() => setFilter("all")}
        />
        <FilterChip
          label={`Low ${counts.low}`}
          active={filter === "low"}
          tone="warning"
          onPress={() => setFilter("low")}
        />
        <FilterChip
          label={`Out ${counts.out}`}
          active={filter === "out"}
          tone="danger"
          onPress={() => setFilter("out")}
        />
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {filtered == null ? (
        <View style={styles.center}>
          <ActivityIndicator color={brand.navy} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>
            {filter === "out"
              ? "Nothing is out of stock"
              : filter === "low"
                ? "Nothing is running low"
                : "No items yet"}
          </Text>
          <Text style={styles.emptySub}>
            {filter === "all"
              ? "Create menu items on the web admin to manage their stock here."
              : "Switch the filter above to see all items."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i._id}
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
            <InventoryCard
              item={item}
              busy={!!busyIds[item._id]}
              onChangeStock={(next) => updateStock(item._id, next)}
            />
          )}
        />
      )}
    </View>
  );
}

function FilterChip({
  label,
  active,
  tone = "default",
  onPress,
}: {
  label: string;
  active: boolean;
  tone?: "default" | "warning" | "danger";
  onPress: () => void;
}) {
  const activeBg =
    tone === "warning" ? "#FEF3C7" : tone === "danger" ? "#FEE2E2" : brand.navy;
  const activeFg =
    tone === "warning" ? "#92400E" : tone === "danger" ? "#991B1B" : brand.white;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active && { backgroundColor: activeBg, borderColor: activeBg },
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.chipText,
          active && { color: activeFg, fontWeight: "700" },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function InventoryCard({
  item,
  busy,
  onChangeStock,
}: {
  item: InventoryItem;
  busy: boolean;
  onChangeStock: (next: number) => void;
}) {
  const lowFlag = isLow(item);
  const outFlag = item.stock === 0;

  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={styles.thumb}
            contentFit="cover"
            transition={120}
          />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]}>
            <MaterialIcons name="restaurant" size={26} color={brand.stoneMuted} />
          </View>
        )}
        <View style={styles.cardBody}>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.name}
          </Text>
          {item.category && (
            <Text style={styles.itemMeta}>{item.category}</Text>
          )}
          <View style={styles.badgeRow}>
            {outFlag && (
              <View style={[styles.badge, { backgroundColor: "#FEE2E2" }]}>
                <Text style={[styles.badgeText, { color: "#991B1B" }]}>
                  Out of stock
                </Text>
              </View>
            )}
            {!outFlag && lowFlag && (
              <View style={[styles.badge, { backgroundColor: "#FEF3C7" }]}>
                <Text style={[styles.badgeText, { color: "#92400E" }]}>
                  Low ({item.stock} left)
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.stepper}>
        <StepperBtn
          icon="remove"
          disabled={busy || item.stock <= 0}
          onPress={() => onChangeStock(item.stock - 1)}
        />
        <View style={styles.stockBox}>
          {busy ? (
            <ActivityIndicator color={brand.navy} />
          ) : (
            <Text style={styles.stockText}>{item.stock}</Text>
          )}
          <Text style={styles.stockLabel}>in stock</Text>
        </View>
        <StepperBtn
          icon="add"
          disabled={busy}
          onPress={() => onChangeStock(item.stock + 1)}
        />
      </View>

      <Pressable
        onPress={() => onChangeStock(outFlag ? 1 : 0)}
        disabled={busy}
        style={({ pressed }) => [
          styles.toggleBtn,
          outFlag && styles.toggleBtnPrimary,
          pressed && !busy && styles.pressed,
          busy && styles.disabled,
        ]}
      >
        <Text
          style={[
            styles.toggleText,
            outFlag && styles.toggleTextPrimary,
          ]}
        >
          {outFlag ? "Restock to 1" : "Mark out of stock"}
        </Text>
      </Pressable>
    </View>
  );
}

function StepperBtn({
  icon,
  disabled,
  onPress,
}: {
  icon: "add" | "remove";
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.stepBtn,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <MaterialIcons name={icon} size={22} color={brand.navy} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: brand.offwhite },
  filterBar: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: brand.white,
    borderWidth: 1,
    borderColor: brand.stoneBorder,
  },
  chipText: { color: brand.stoneText, fontSize: 13, fontWeight: "500" },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.4 },
  errorBox: {
    marginHorizontal: 16,
    marginBottom: 8,
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
  emptyTitle: {
    color: brand.stoneText,
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
  },
  emptySub: {
    color: brand.stoneMuted,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
  },
  listContent: { paddingHorizontal: 16, paddingBottom: 32 },
  sep: { height: 12 },
  card: {
    backgroundColor: brand.white,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: brand.stoneBorder,
    gap: 14,
  },
  cardRow: { flexDirection: "row", gap: 12, alignItems: "center" },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: brand.offwhite,
  },
  thumbPlaceholder: { alignItems: "center", justifyContent: "center" },
  cardBody: { flex: 1, gap: 2 },
  itemName: { color: brand.navy, fontSize: 16, fontWeight: "700" },
  itemMeta: { color: brand.stoneMuted, fontSize: 12 },
  badgeRow: { flexDirection: "row", gap: 6, marginTop: 4 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: "600", letterSpacing: 0.3 },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: brand.offwhite,
    borderRadius: 14,
    padding: 8,
  },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: brand.white,
    borderWidth: 1,
    borderColor: brand.stoneBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  stockBox: { flex: 1, alignItems: "center" },
  stockText: { color: brand.navy, fontSize: 22, fontWeight: "700" },
  stockLabel: { color: brand.stoneMuted, fontSize: 11, marginTop: -2 },
  toggleBtn: {
    paddingVertical: 11,
    borderRadius: 999,
    alignItems: "center",
    backgroundColor: brand.white,
    borderWidth: 1,
    borderColor: brand.stoneBorder,
  },
  toggleBtnPrimary: {
    backgroundColor: brand.navy,
    borderColor: brand.navy,
  },
  toggleText: { color: brand.stoneText, fontSize: 13, fontWeight: "600" },
  toggleTextPrimary: { color: brand.white },
});
