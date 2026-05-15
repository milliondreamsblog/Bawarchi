import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type {
  CreateItemResponse,
  ItemFormPayload,
  ItemRecord,
  ItemsListResponse,
  UpdateItemResponse,
} from "@bawarchie/types";
import { Image } from "expo-image";
import { useCallback, useEffect, useRef, useState } from "react";
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

import { ItemFormModal } from "@/components/ItemFormModal";
import { brand } from "@/constants/brand";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function ItemsScreen() {
  const { user, token } = useAuth();
  const [items, setItems] = useState<ItemRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal] = useState<
    | { mode: "create" }
    | { mode: "edit"; item: ItemRecord }
    | null
  >(null);
  const [submitting, setSubmitting] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchItems = useCallback(async () => {
    if (!user?.id) return;
    const res = await api.get<ItemsListResponse>(
      `/api/items?restaurantId=${encodeURIComponent(user.id)}`,
      { token }
    );
    if (!isMounted.current) return;
    if (res.success) {
      const sorted = [...res.items].sort((a, b) => a.name.localeCompare(b.name));
      setItems(sorted);
      setError(null);
    } else {
      setError(res.error);
    }
  }, [token, user?.id]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchItems();
    setRefreshing(false);
  }, [fetchItems]);

  async function handleSubmit(payload: ItemFormPayload) {
    if (!user?.id) return;
    setSubmitting(true);
    if (modal?.mode === "edit") {
      const res = await api.patch<UpdateItemResponse>(
        `/api/items/${modal.item._id}`,
        { ...payload, restaurantId: user.id },
        { token }
      );
      if (!isMounted.current) return;
      setSubmitting(false);
      if (!res.success) {
        Alert.alert("Could not save", res.error);
        return;
      }
      setItems((prev) =>
        prev?.map((i) => (i._id === res.item._id ? res.item : i)) ?? prev
      );
      setModal(null);
    } else {
      const res = await api.post<CreateItemResponse>(
        "/api/items",
        { ...payload, restaurantId: user.id },
        { token }
      );
      if (!isMounted.current) return;
      setSubmitting(false);
      if (!res.success) {
        Alert.alert("Could not create", res.error);
        return;
      }
      setItems((prev) =>
        prev
          ? [...prev, res.item].sort((a, b) => a.name.localeCompare(b.name))
          : [res.item]
      );
      setModal(null);
    }
  }

  async function handleDelete() {
    if (modal?.mode !== "edit" || !user?.id) return;
    const id = modal.item._id;
    setSubmitting(true);
    const res = await api.del(`/api/items/${id}`, { token });
    if (!isMounted.current) return;
    setSubmitting(false);
    if (!res.success) {
      Alert.alert("Could not delete", res.error);
      return;
    }
    setItems((prev) => prev?.filter((i) => i._id !== id) ?? prev);
    setModal(null);
  }

  return (
    <View style={styles.flex}>
      <View style={styles.topBar}>
        <Text style={styles.count}>
          {items == null
            ? "…"
            : `${items.length} ${items.length === 1 ? "item" : "items"}`}
        </Text>
        <Pressable
          onPress={() => setModal({ mode: "create" })}
          style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
        >
          <MaterialIcons name="add" size={18} color={brand.white} />
          <Text style={styles.addBtnText}>New item</Text>
        </Pressable>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {items == null ? (
        <View style={styles.center}>
          <ActivityIndicator color={brand.navy} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>No items yet</Text>
          <Text style={styles.emptySub}>
            Tap “New item” to add your first dish.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
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
            <ItemCard
              item={item}
              onEdit={() => setModal({ mode: "edit", item })}
            />
          )}
        />
      )}

      <ItemFormModal
        open={modal !== null}
        mode={modal?.mode === "edit" ? "edit" : "create"}
        initial={modal?.mode === "edit" ? modal.item : undefined}
        busy={submitting}
        token={token}
        onClose={() => {
          if (!submitting) setModal(null);
        }}
        onSubmit={handleSubmit}
        onDelete={modal?.mode === "edit" ? handleDelete : undefined}
      />
    </View>
  );
}

function ItemCard({
  item,
  onEdit,
}: {
  item: ItemRecord;
  onEdit: () => void;
}) {
  return (
    <Pressable
      onPress={onEdit}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Image
        source={{ uri: item.image }}
        style={styles.thumb}
        contentFit="cover"
        transition={120}
      />
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <View style={[styles.dietDot, { backgroundColor: item.isVeg ? brand.success : brand.danger }]} />
          <Text style={styles.itemName} numberOfLines={1}>
            {item.name}
          </Text>
        </View>
        {item.category ? <Text style={styles.itemMeta}>{item.category}</Text> : null}
        <View style={styles.cardBottomRow}>
          <Text style={styles.price}>₹{Math.round(item.price)}</Text>
          {!item.available && (
            <View style={styles.offBadge}>
              <Text style={styles.offBadgeText}>Off menu</Text>
            </View>
          )}
        </View>
      </View>
      <MaterialIcons name="chevron-right" size={22} color={brand.stoneMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: brand.offwhite },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  count: { color: brand.stoneMuted, fontSize: 13 },
  addBtn: {
    backgroundColor: brand.navy,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  addBtnText: { color: brand.white, fontSize: 13, fontWeight: "600" },
  pressed: { opacity: 0.8 },
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
  emptyTitle: { color: brand.stoneText, fontSize: 17, fontWeight: "600" },
  emptySub: {
    color: brand.stoneMuted,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
  },
  listContent: { paddingHorizontal: 16, paddingBottom: 32 },
  sep: { height: 10 },
  card: {
    backgroundColor: brand.white,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: brand.stoneBorder,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: brand.offwhite,
  },
  cardBody: { flex: 1, gap: 3 },
  cardTopRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dietDot: { width: 10, height: 10, borderRadius: 999 },
  itemName: { color: brand.navy, fontSize: 15, fontWeight: "700", flex: 1 },
  itemMeta: { color: brand.stoneMuted, fontSize: 12 },
  cardBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  price: { color: brand.navy, fontSize: 14, fontWeight: "700" },
  offBadge: {
    backgroundColor: brand.stoneBorder,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  offBadgeText: {
    color: brand.stoneText,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});
