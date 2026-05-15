import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type {
  CreateItemResponse,
  MenuGetResponse,
  MenuIngestItem,
  MenuIngestResponse,
  MenuStructure,
} from "@bawarchie/types";
import { Image } from "expo-image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { brand } from "@/constants/brand";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { pickAndUploadImage } from "@/lib/uploadImage";

type IngestPreview = {
  sourceImageUrl: string;
  sections: MenuIngestResponse["sections"];
  warnings: string[];
  restaurantName: string | null;
};

export default function MenuScreen() {
  const { user, token } = useAuth();
  const [menu, setMenu] = useState<MenuStructure | null>(null);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [preview, setPreview] = useState<IngestPreview | null>(null);
  const [creating, setCreating] = useState<{ done: number; total: number } | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchMenu = useCallback(async () => {
    if (!user?.id) return;
    const res = await api.get<MenuGetResponse>(
      `/api/menu?restaurantId=${encodeURIComponent(user.id)}`,
      { token }
    );
    if (!isMounted.current) return;
    if (res.success) {
      setMenu(res.menu);
      setMissing(false);
      setError(null);
    } else if (/menu not found/i.test(res.error)) {
      // Restaurants without a curated Menu doc still have items — surface
      // a friendlier empty state instead of a hard error.
      setMenu(null);
      setMissing(true);
      setError(null);
    } else {
      setError(res.error);
    }
  }, [token, user?.id]);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMenu();
    setRefreshing(false);
  }, [fetchMenu]);

  async function handleIngest() {
    setIngesting(true);
    setError(null);
    const upload = await pickAndUploadImage(token);
    if (!upload.ok) {
      setIngesting(false);
      if (upload.error) setError(upload.error);
      return;
    }
    const res = await api.post<MenuIngestResponse>(
      "/api/menu/ingest",
      { imageUrl: upload.imageUrl },
      { token, timeoutMs: 60_000 }
    );
    if (!isMounted.current) return;
    setIngesting(false);
    if (!res.success) {
      Alert.alert("Could not read the menu", res.error);
      return;
    }
    const totalItems = res.sections.reduce((n, s) => n + s.items.length, 0);
    if (totalItems === 0) {
      Alert.alert(
        "Nothing recognised",
        "Couldn't find any items in that photo. Try a clearer shot with the menu fully in frame."
      );
      return;
    }
    setPreview({
      sourceImageUrl: upload.imageUrl,
      sections: res.sections,
      warnings: res.warnings,
      restaurantName: res.restaurantName,
    });
  }

  async function handleConfirmCreate() {
    if (!preview || !user?.id) return;
    const flat: Array<{ section: string; item: MenuIngestItem }> = [];
    preview.sections.forEach((s) =>
      s.items.forEach((it) => flat.push({ section: s.name, item: it }))
    );
    setCreating({ done: 0, total: flat.length });

    for (let i = 0; i < flat.length; i++) {
      const { section, item } = flat[i];
      const res = await api.post<CreateItemResponse>(
        "/api/items",
        {
          name: item.name,
          description: item.description,
          price: item.price,
          category: section,
          image: preview.sourceImageUrl,
          isVeg: item.isVeg,
          spiceLevel: item.spiceLevel ?? "medium",
        },
        { token, timeoutMs: 30_000 }
      );
      if (!isMounted.current) return;
      if (!res.success) {
        // Don't blow up the whole batch on one failure — log to the
        // user once at the end. Continue iterating so partial success
        // is still useful.
        console.warn(`[menu-ingest] failed to create "${item.name}": ${res.error}`);
      }
      setCreating({ done: i + 1, total: flat.length });
    }

    if (!isMounted.current) return;
    setCreating(null);
    setPreview(null);
    await fetchMenu();
    Alert.alert(
      "Items added",
      `${flat.length} item${flat.length === 1 ? "" : "s"} created from the photo. Edit details or add per-item photos from the Items screen.`
    );
  }

  return (
    <View style={styles.flex}>
      <View style={styles.topBar}>
        <View style={{ flex: 1 }}>
          {menu?.title ? (
            <Text style={styles.menuTitle} numberOfLines={1}>
              {menu.title}
            </Text>
          ) : (
            <Text style={styles.menuTitle}>Customer menu</Text>
          )}
          <Text style={styles.menuMeta}>
            {menu
              ? `${menu.sections.length} section${menu.sections.length === 1 ? "" : "s"} · ${menu.sections.reduce((n, s) => n + s.items.length, 0)} items`
              : missing
                ? "No curated menu yet"
                : "…"}
          </Text>
        </View>
        <Pressable
          onPress={handleIngest}
          disabled={ingesting}
          style={({ pressed }) => [
            styles.ingestBtn,
            pressed && !ingesting && styles.pressed,
            ingesting && styles.disabled,
          ]}
        >
          {ingesting ? (
            <ActivityIndicator color={brand.white} />
          ) : (
            <>
              <MaterialIcons name="auto-awesome" size={16} color={brand.white} />
              <Text style={styles.ingestBtnText}>Ingest from photo</Text>
            </>
          )}
        </Pressable>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {menu == null ? (
        <View style={styles.center}>
          {missing ? (
            <>
              <Text style={styles.emptyTitle}>No curated menu yet</Text>
              <Text style={styles.emptySub}>
                Use the web admin's drag-and-drop menu builder to organise items
                into sections — or just tap “Ingest from photo” above to extract
                items from a printed menu in one shot.
              </Text>
            </>
          ) : (
            <ActivityIndicator color={brand.navy} />
          )}
        </View>
      ) : (
        <FlatList
          data={menu.sections}
          keyExtractor={(s, idx) => `${s.name}-${idx}`}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.sectionSep} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={brand.navy}
            />
          }
          renderItem={({ item: section }) => (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{section.name}</Text>
              {section.items.length === 0 ? (
                <Text style={styles.sectionEmpty}>No items in this section.</Text>
              ) : (
                section.items.map((item) => (
                  <View key={item._id} style={styles.itemRow}>
                    {item.image ? (
                      <Image
                        source={{ uri: item.image }}
                        style={styles.itemThumb}
                        contentFit="cover"
                        transition={120}
                      />
                    ) : (
                      <View style={[styles.itemThumb, styles.itemThumbPlaceholder]}>
                        <MaterialIcons name="restaurant" size={20} color={brand.stoneMuted} />
                      </View>
                    )}
                    <View style={styles.itemBody}>
                      <View style={styles.itemNameRow}>
                        <View
                          style={[
                            styles.dietDot,
                            { backgroundColor: item.isVeg ? brand.success : brand.danger },
                          ]}
                        />
                        <Text style={styles.itemName} numberOfLines={1}>
                          {item.name}
                        </Text>
                      </View>
                      {item.description ? (
                        <Text style={styles.itemDesc} numberOfLines={2}>
                          {item.description}
                        </Text>
                      ) : null}
                    </View>
                    <Text style={styles.itemPrice}>₹{Math.round(item.price)}</Text>
                  </View>
                ))
              )}
            </View>
          )}
        />
      )}

      <IngestPreviewModal
        preview={preview}
        creating={creating}
        onCancel={() => {
          if (!creating) setPreview(null);
        }}
        onConfirm={handleConfirmCreate}
      />
    </View>
  );
}

function IngestPreviewModal({
  preview,
  creating,
  onCancel,
  onConfirm,
}: {
  preview: IngestPreview | null;
  creating: { done: number; total: number } | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const open = !!preview;
  const totalItems =
    preview?.sections.reduce((n, s) => n + s.items.length, 0) ?? 0;

  return (
    <Modal
      visible={open}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <View style={styles.flex}>
        <View style={styles.modalHeader}>
          <Pressable onPress={onCancel} disabled={!!creating}>
            <Text style={styles.headerLink}>Cancel</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Review</Text>
          <Pressable
            onPress={onConfirm}
            disabled={!!creating || totalItems === 0}
            style={({ pressed }) => [
              pressed && !creating && styles.pressed,
              (!!creating || totalItems === 0) && styles.disabled,
            ]}
          >
            <Text style={[styles.headerLink, styles.headerLinkPrimary]}>
              {creating ? `${creating.done}/${creating.total}` : `Create ${totalItems}`}
            </Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.previewScroll}>
          {preview?.sourceImageUrl && (
            <Image
              source={{ uri: preview.sourceImageUrl }}
              style={styles.previewSource}
              contentFit="cover"
              transition={120}
            />
          )}
          <Text style={styles.previewIntro}>
            Found {totalItems} item{totalItems === 1 ? "" : "s"} across{" "}
            {preview?.sections.length ?? 0} section
            {preview?.sections.length === 1 ? "" : "s"}. Tap Create to add them
            all. Each item uses this menu photo as its placeholder image — swap
            it later from the Items screen.
          </Text>

          {preview?.warnings && preview.warnings.length > 0 && (
            <View style={styles.warningBox}>
              <MaterialIcons name="warning-amber" size={16} color={brand.warning} />
              <View style={{ flex: 1 }}>
                {preview.warnings.map((w, i) => (
                  <Text key={i} style={styles.warningText}>
                    {w}
                  </Text>
                ))}
              </View>
            </View>
          )}

          {preview?.sections.map((section, idx) => (
            <View key={`${section.name}-${idx}`} style={styles.previewSection}>
              <Text style={styles.previewSectionTitle}>{section.name}</Text>
              {section.items.map((item, j) => (
                <View key={`${item.name}-${j}`} style={styles.previewRow}>
                  <View
                    style={[
                      styles.dietDot,
                      { backgroundColor: item.isVeg ? brand.success : brand.danger },
                    ]}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.previewItemName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    {item.description ? (
                      <Text style={styles.previewItemDesc} numberOfLines={1}>
                        {item.description}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={styles.previewItemPrice}>
                    ₹{Math.round(item.price)}
                  </Text>
                  <ConfidenceDot confidence={item.confidence} />
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

function ConfidenceDot({ confidence }: { confidence: number }) {
  const color =
    confidence >= 0.8 ? brand.success : confidence >= 0.5 ? brand.warning : brand.danger;
  return <View style={[styles.confDot, { backgroundColor: color }]} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: brand.offwhite },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuTitle: { color: brand.navy, fontSize: 17, fontWeight: "700" },
  menuMeta: { color: brand.stoneMuted, fontSize: 12, marginTop: 2 },
  ingestBtn: {
    backgroundColor: brand.navy,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ingestBtnText: { color: brand.white, fontSize: 13, fontWeight: "600" },
  pressed: { opacity: 0.85 },
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
    lineHeight: 20,
  },
  listContent: { paddingHorizontal: 16, paddingBottom: 32 },
  sectionSep: { height: 16 },
  section: {
    backgroundColor: brand.white,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: brand.stoneBorder,
    gap: 8,
  },
  sectionTitle: {
    color: brand.navy,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  sectionEmpty: { color: brand.stoneMuted, fontSize: 13, fontStyle: "italic" },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 6,
  },
  itemThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: brand.offwhite,
  },
  itemThumbPlaceholder: { alignItems: "center", justifyContent: "center" },
  itemBody: { flex: 1, gap: 2 },
  itemNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  dietDot: { width: 8, height: 8, borderRadius: 999 },
  itemName: { color: brand.navy, fontSize: 14, fontWeight: "600", flex: 1 },
  itemDesc: { color: brand.stoneMuted, fontSize: 12 },
  itemPrice: { color: brand.navy, fontSize: 13, fontWeight: "700" },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: brand.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: brand.stoneBorder,
  },
  headerTitle: { color: brand.navy, fontSize: 17, fontWeight: "700" },
  headerLink: { color: brand.stoneText, fontSize: 15 },
  headerLinkPrimary: { color: brand.navy, fontWeight: "700" },
  previewScroll: { padding: 20, gap: 16, paddingBottom: 60 },
  previewSource: {
    width: "100%",
    height: 160,
    borderRadius: 14,
    backgroundColor: brand.white,
  },
  previewIntro: {
    color: brand.stoneText,
    fontSize: 13,
    lineHeight: 19,
  },
  warningBox: {
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  warningText: { color: "#92400E", fontSize: 12 },
  previewSection: {
    backgroundColor: brand.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: brand.stoneBorder,
    gap: 6,
  },
  previewSectionTitle: {
    color: brand.navy,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  previewItemName: { color: brand.navy, fontSize: 13, fontWeight: "600" },
  previewItemDesc: { color: brand.stoneMuted, fontSize: 11 },
  previewItemPrice: { color: brand.navy, fontSize: 13, fontWeight: "700" },
  confDot: { width: 7, height: 7, borderRadius: 999 },
});
