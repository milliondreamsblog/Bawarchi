import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type {
  CreateTableResponse,
  TableItem,
  TablesListResponse,
} from "@bawarchie/types";
import { Image } from "expo-image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { brand } from "@/constants/brand";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function TablesScreen() {
  const { user, token } = useAuth();
  const [tables, setTables] = useState<TableItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewing, setViewing] = useState<TableItem | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchTables = useCallback(async () => {
    if (!user?.id) return;
    const res = await api.get<TablesListResponse>(
      `/api/tables?restaurantId=${encodeURIComponent(user.id)}`,
      { token }
    );
    if (!isMounted.current) return;
    if (res.success) {
      // Sort by tableNumber ascending so the list is stable
      const sorted = [...res.tables].sort((a, b) => a.tableNumber - b.tableNumber);
      setTables(sorted);
      setError(null);
    } else {
      setError(res.error);
    }
  }, [token, user?.id]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTables();
    setRefreshing(false);
  }, [fetchTables]);

  return (
    <View style={styles.flex}>
      <View style={styles.topBar}>
        <Text style={styles.count}>
          {tables == null ? "…" : `${tables.length} ${tables.length === 1 ? "table" : "tables"}`}
        </Text>
        <Pressable
          onPress={() => setCreateOpen(true)}
          style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
        >
          <MaterialIcons name="add" size={18} color={brand.white} />
          <Text style={styles.addBtnText}>New table</Text>
        </Pressable>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {tables == null ? (
        <View style={styles.center}>
          <ActivityIndicator color={brand.navy} />
        </View>
      ) : tables.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>No tables yet</Text>
          <Text style={styles.emptySub}>
            Tap “New table” to create one. The QR is generated automatically.
          </Text>
        </View>
      ) : (
        <FlatList
          data={tables}
          keyExtractor={(t) => t._id}
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
            <TableCard table={item} onView={() => setViewing(item)} />
          )}
        />
      )}

      <CreateTableModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(t) => {
          setCreateOpen(false);
          setTables((prev) => (prev ? [...prev, t].sort((a, b) => a.tableNumber - b.tableNumber) : [t]));
        }}
        restaurantId={user?.id ?? ""}
        token={token}
        existingSlugs={tables?.map((t) => t.slug) ?? []}
      />

      <ViewQrModal table={viewing} onClose={() => setViewing(null)} />
    </View>
  );
}

function TableCard({ table, onView }: { table: TableItem; onView: () => void }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        {table.qrUrl ? (
          <Image
            source={{ uri: table.qrUrl }}
            style={styles.qrThumb}
            contentFit="contain"
            transition={120}
          />
        ) : (
          <View style={[styles.qrThumb, styles.qrPlaceholder]}>
            <MaterialIcons name="qr-code-2" size={36} color={brand.stoneMuted} />
          </View>
        )}
        <View style={styles.cardBody}>
          <Text style={styles.tableName}>Table {table.tableNumber}</Text>
          <Text style={styles.tableSlug}>/{table.slug}</Text>
          <View
            style={[
              styles.statusPill,
              {
                backgroundColor:
                  table.status === "occupied" ? "#FEF3C7" : "#D1FAE5",
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                {
                  color: table.status === "occupied" ? "#92400E" : "#065F46",
                },
              ]}
            >
              {table.status === "occupied" ? "Occupied" : "Free"}
            </Text>
          </View>
        </View>
      </View>
      <Pressable
        onPress={onView}
        disabled={!table.qrUrl}
        style={({ pressed }) => [
          styles.viewBtn,
          pressed && styles.pressed,
          !table.qrUrl && styles.disabled,
        ]}
      >
        <MaterialIcons name="qr-code-scanner" size={16} color={brand.navy} />
        <Text style={styles.viewBtnText}>View QR</Text>
      </Pressable>
    </View>
  );
}

function CreateTableModal({
  open,
  onClose,
  onCreated,
  restaurantId,
  token,
  existingSlugs,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (t: TableItem) => void;
  restaurantId: string;
  token: string | null;
  existingSlugs: string[];
}) {
  const [tableNumber, setTableNumber] = useState("");
  const [slug, setSlug] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTableNumber("");
      setSlug("");
      setErr(null);
      setSubmitting(false);
    }
  }, [open]);

  // Auto-fill slug from table number when slug hasn't been edited.
  useEffect(() => {
    if (!tableNumber) return;
    setSlug((current) => {
      const auto = `table-${tableNumber.trim()}`;
      // Replace only if current is empty or still auto-generated.
      if (!current || /^table-\d*$/.test(current)) {
        return auto;
      }
      return current;
    });
  }, [tableNumber]);

  const trimmedSlug = slugify(slug);
  const numberValid = Number(tableNumber) > 0;
  const slugTaken = existingSlugs.includes(trimmedSlug);
  const disabled =
    submitting || !numberValid || !trimmedSlug || slugTaken;

  async function handleSubmit() {
    if (disabled || !restaurantId) return;
    setSubmitting(true);
    setErr(null);
    const res = await api.post<CreateTableResponse>(
      "/api/tables",
      {
        tableNumber: Number(tableNumber),
        slug: trimmedSlug,
        restaurantId,
      },
      { token }
    );
    if (!res.success) {
      setErr(res.error);
      setSubmitting(false);
      return;
    }
    onCreated(res.table);
  }

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.modalBackdrop}
      >
        <Pressable style={styles.backdropTouch} onPress={onClose} />
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>New table</Text>
          <Text style={styles.modalSub}>
            The QR code is generated server-side once you save.
          </Text>

          <View style={styles.field}>
            <Text style={styles.label}>Table number</Text>
            <TextInput
              value={tableNumber}
              onChangeText={(v) => setTableNumber(v.replace(/[^0-9]/g, ""))}
              keyboardType="number-pad"
              placeholder="e.g. 5"
              placeholderTextColor={brand.stoneMuted}
              style={styles.input}
              editable={!submitting}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Slug</Text>
            <TextInput
              value={slug}
              onChangeText={setSlug}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="table-5"
              placeholderTextColor={brand.stoneMuted}
              style={styles.input}
              editable={!submitting}
            />
            <Text style={styles.hint}>
              URL will be /r/&lt;restaurant&gt;/t/{trimmedSlug || "…"}
            </Text>
            {slugTaken && (
              <Text style={styles.errorInline}>
                This slug is already in use. Pick a different one.
              </Text>
            )}
          </View>

          {err && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{err}</Text>
            </View>
          )}

          <View style={styles.modalActions}>
            <Pressable
              onPress={onClose}
              disabled={submitting}
              style={({ pressed }) => [
                styles.modalBtn,
                styles.modalBtnGhost,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.modalBtnGhostText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSubmit}
              disabled={disabled}
              style={({ pressed }) => [
                styles.modalBtn,
                styles.modalBtnPrimary,
                pressed && !disabled && styles.pressed,
                disabled && styles.disabled,
              ]}
            >
              {submitting ? (
                <ActivityIndicator color={brand.white} />
              ) : (
                <Text style={styles.modalBtnPrimaryText}>Create</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ViewQrModal({
  table,
  onClose,
}: {
  table: TableItem | null;
  onClose: () => void;
}) {
  const open = !!table;

  async function handleShare() {
    if (!table?.qrUrl) return;
    try {
      await Share.share({
        message: `Table ${table.tableNumber} QR — ${table.qrUrl}`,
        url: table.qrUrl,
      });
    } catch (err) {
      Alert.alert("Could not share", err instanceof Error ? err.message : "Try again.");
    }
  }

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalBackdrop}>
        <Pressable style={styles.backdropTouch} onPress={onClose} />
        <View style={styles.qrModalCard}>
          {table && (
            <>
              <Text style={styles.modalTitle}>Table {table.tableNumber}</Text>
              <Text style={styles.modalSub}>/{table.slug}</Text>
              {table.qrUrl && (
                <Image
                  source={{ uri: table.qrUrl }}
                  style={styles.qrFull}
                  contentFit="contain"
                  transition={120}
                />
              )}
              <View style={styles.modalActions}>
                <Pressable
                  onPress={onClose}
                  style={({ pressed }) => [
                    styles.modalBtn,
                    styles.modalBtnGhost,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.modalBtnGhostText}>Close</Text>
                </Pressable>
                <Pressable
                  onPress={handleShare}
                  style={({ pressed }) => [
                    styles.modalBtn,
                    styles.modalBtnPrimary,
                    pressed && styles.pressed,
                  ]}
                >
                  <MaterialIcons name="share" size={16} color={brand.white} />
                  <Text style={styles.modalBtnPrimaryText}>Share</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
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
  disabled: { opacity: 0.5 },
  errorBox: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorText: { color: brand.danger, fontSize: 13 },
  errorInline: { color: brand.danger, fontSize: 12, marginTop: 4 },
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
  listContent: { paddingHorizontal: 16, paddingBottom: 32 },
  sep: { height: 12 },
  card: {
    backgroundColor: brand.white,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: brand.stoneBorder,
    gap: 12,
  },
  cardRow: { flexDirection: "row", gap: 14, alignItems: "center" },
  qrThumb: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: brand.offwhite,
  },
  qrPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { flex: 1, gap: 4 },
  tableName: { color: brand.navy, fontSize: 17, fontWeight: "700" },
  tableSlug: { color: brand.stoneMuted, fontSize: 12 },
  statusPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 4,
  },
  statusText: { fontSize: 11, fontWeight: "600", letterSpacing: 0.3 },
  viewBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: brand.stoneBorder,
    borderRadius: 999,
    backgroundColor: brand.white,
  },
  viewBtnText: { color: brand.navy, fontSize: 13, fontWeight: "600" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.5)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  backdropTouch: { ...StyleSheet.absoluteFillObject },
  modalCard: {
    backgroundColor: brand.white,
    borderRadius: 24,
    padding: 24,
    gap: 14,
  },
  qrModalCard: {
    backgroundColor: brand.white,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    gap: 14,
  },
  modalTitle: { color: brand.navy, fontSize: 22, fontWeight: "700" },
  modalSub: { color: brand.stoneMuted, fontSize: 13 },
  field: { gap: 6 },
  label: { color: brand.stoneText, fontSize: 13, fontWeight: "600" },
  input: {
    backgroundColor: brand.offwhite,
    borderColor: brand.stoneBorder,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: brand.black,
  },
  hint: { color: brand.stoneMuted, fontSize: 11 },
  qrFull: {
    width: 240,
    height: 240,
    backgroundColor: brand.offwhite,
    borderRadius: 16,
    marginVertical: 8,
  },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  modalBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  modalBtnGhost: {
    backgroundColor: brand.offwhite,
    borderWidth: 1,
    borderColor: brand.stoneBorder,
  },
  modalBtnGhostText: { color: brand.stoneText, fontSize: 14, fontWeight: "600" },
  modalBtnPrimary: { backgroundColor: brand.navy },
  modalBtnPrimaryText: { color: brand.white, fontSize: 14, fontWeight: "600" },
});
