import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type {
  ItemRecord,
  ItemFormPayload,
  SpiceLevel,
} from "@bawarchie/types";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { brand } from "@/constants/brand";
import { pickAndUploadImage } from "@/lib/uploadImage";

const SPICE_LEVELS: SpiceLevel[] = ["mild", "medium", "hot", "extra-hot"];

type Mode = "create" | "edit";

export type ItemFormSubmit = {
  payload: ItemFormPayload;
};

export function ItemFormModal({
  open,
  mode,
  initial,
  busy,
  onClose,
  onSubmit,
  onDelete,
  token,
}: {
  open: boolean;
  mode: Mode;
  initial?: ItemRecord;
  busy: boolean;
  onClose: () => void;
  onSubmit: (payload: ItemFormPayload) => void;
  onDelete?: () => void;
  token: string | null;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [calories, setCalories] = useState("");
  const [image, setImage] = useState("");
  const [isVeg, setIsVeg] = useState(true);
  const [isVegan, setIsVegan] = useState(false);
  const [isGlutenFree, setIsGlutenFree] = useState(false);
  const [spiceLevel, setSpiceLevel] = useState<SpiceLevel>("medium");
  const [available, setAvailable] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Reset form whenever the modal opens with a different item
  useEffect(() => {
    if (!open) return;
    setFormError(null);
    setUploading(false);
    if (initial) {
      setName(initial.name);
      setDescription(initial.description ?? "");
      setPrice(String(initial.price));
      setCategory(initial.category ?? "");
      setCalories(initial.calories != null ? String(initial.calories) : "");
      setImage(initial.image ?? "");
      setIsVeg(initial.isVeg);
      setIsVegan(initial.isVegan);
      setIsGlutenFree(initial.isGlutenFree);
      setSpiceLevel(initial.spiceLevel ?? "medium");
      setAvailable(initial.available);
    } else {
      setName("");
      setDescription("");
      setPrice("");
      setCategory("");
      setCalories("");
      setImage("");
      setIsVeg(true);
      setIsVegan(false);
      setIsGlutenFree(false);
      setSpiceLevel("medium");
      setAvailable(true);
    }
  }, [open, initial]);

  async function handlePickImage() {
    setUploading(true);
    setFormError(null);
    const res = await pickAndUploadImage(token);
    setUploading(false);
    if (!res.ok) {
      if (res.error) setFormError(res.error); // empty error => user cancelled
      return;
    }
    setImage(res.imageUrl);
  }

  const priceNum = Number(price);
  const caloriesNum = calories ? Number(calories) : undefined;
  const submitDisabled =
    busy ||
    uploading ||
    !name.trim() ||
    !image ||
    !Number.isFinite(priceNum) ||
    priceNum <= 0;

  function handleSubmit() {
    if (submitDisabled) return;
    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      price: priceNum,
      category: category.trim() || "General",
      calories: caloriesNum,
      image,
      isVeg,
      isVegan,
      isGlutenFree,
      spiceLevel,
      available,
    });
  }

  function handleDelete() {
    if (!onDelete) return;
    Alert.alert(
      "Delete this item?",
      "This cannot be undone. Customers will no longer see it on the menu.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: onDelete },
      ]
    );
  }

  return (
    <Modal
      visible={open}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <View style={styles.modalHeader}>
          <Pressable
            onPress={onClose}
            disabled={busy}
            style={({ pressed }) => [pressed && styles.pressed]}
          >
            <Text style={styles.headerLink}>Cancel</Text>
          </Pressable>
          <Text style={styles.headerTitle}>
            {mode === "edit" ? "Edit item" : "New item"}
          </Text>
          <Pressable
            onPress={handleSubmit}
            disabled={submitDisabled}
            style={({ pressed }) => [pressed && !submitDisabled && styles.pressed]}
          >
            <Text
              style={[
                styles.headerLink,
                styles.headerLinkPrimary,
                submitDisabled && styles.disabled,
              ]}
            >
              {busy ? "Saving…" : "Save"}
            </Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable
            onPress={handlePickImage}
            disabled={uploading || busy}
            style={styles.imagePicker}
          >
            {image ? (
              <Image
                source={{ uri: image }}
                style={styles.imagePreview}
                contentFit="cover"
                transition={120}
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <MaterialIcons
                  name="add-photo-alternate"
                  size={32}
                  color={brand.navy}
                />
                <Text style={styles.imagePlaceholderText}>Add photo</Text>
              </View>
            )}
            {uploading && (
              <View style={styles.imageOverlay}>
                <ActivityIndicator color={brand.white} />
                <Text style={styles.imageOverlayText}>Uploading…</Text>
              </View>
            )}
            {image && !uploading && (
              <View style={styles.imageChangeBadge}>
                <MaterialIcons name="edit" size={14} color={brand.white} />
                <Text style={styles.imageChangeBadgeText}>Change</Text>
              </View>
            )}
          </Pressable>

          <Field label="Name">
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Paneer Tikka"
              placeholderTextColor={brand.stoneMuted}
              style={styles.input}
              editable={!busy}
              returnKeyType="next"
            />
          </Field>

          <Field label="Description">
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Marinated cottage cheese cubes grilled in a tandoor"
              placeholderTextColor={brand.stoneMuted}
              style={[styles.input, styles.inputMulti]}
              editable={!busy}
              multiline
              numberOfLines={3}
            />
          </Field>

          <View style={styles.row}>
            <View style={styles.rowField}>
              <Field label="Price (₹)">
                <TextInput
                  value={price}
                  onChangeText={(v) => setPrice(v.replace(/[^0-9.]/g, ""))}
                  placeholder="0"
                  placeholderTextColor={brand.stoneMuted}
                  keyboardType="decimal-pad"
                  style={styles.input}
                  editable={!busy}
                />
              </Field>
            </View>
            <View style={styles.rowField}>
              <Field label="Calories">
                <TextInput
                  value={calories}
                  onChangeText={(v) => setCalories(v.replace(/[^0-9]/g, ""))}
                  placeholder="Optional"
                  placeholderTextColor={brand.stoneMuted}
                  keyboardType="number-pad"
                  style={styles.input}
                  editable={!busy}
                />
              </Field>
            </View>
          </View>

          <Field label="Category">
            <TextInput
              value={category}
              onChangeText={setCategory}
              placeholder="Starters"
              placeholderTextColor={brand.stoneMuted}
              style={styles.input}
              editable={!busy}
              autoCapitalize="words"
            />
          </Field>

          <Field label="Spice level">
            <View style={styles.segment}>
              {SPICE_LEVELS.map((level) => (
                <Pressable
                  key={level}
                  onPress={() => setSpiceLevel(level)}
                  disabled={busy}
                  style={[
                    styles.segmentBtn,
                    spiceLevel === level && styles.segmentBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      spiceLevel === level && styles.segmentTextActive,
                    ]}
                  >
                    {level === "extra-hot" ? "Extra" : level.charAt(0).toUpperCase() + level.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Field>

          <View style={styles.toggleBlock}>
            <ToggleRow label="Vegetarian" value={isVeg} onChange={setIsVeg} disabled={busy} />
            <ToggleRow label="Vegan" value={isVegan} onChange={setIsVegan} disabled={busy} />
            <ToggleRow
              label="Gluten-free"
              value={isGlutenFree}
              onChange={setIsGlutenFree}
              disabled={busy}
            />
            <ToggleRow
              label="Available on menu"
              value={available}
              onChange={setAvailable}
              disabled={busy}
            />
          </View>

          {formError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{formError}</Text>
            </View>
          )}

          {mode === "edit" && onDelete && (
            <Pressable
              onPress={handleDelete}
              disabled={busy}
              style={({ pressed }) => [
                styles.deleteBtn,
                pressed && !busy && styles.pressed,
                busy && styles.disabled,
              ]}
            >
              <MaterialIcons name="delete-outline" size={18} color={brand.danger} />
              <Text style={styles.deleteText}>Delete item</Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ true: brand.sky, false: brand.stoneBorder }}
        thumbColor={value ? brand.navy : brand.white}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: brand.offwhite },
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
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 60, gap: 18 },
  imagePicker: {
    height: 200,
    borderRadius: 18,
    backgroundColor: brand.white,
    borderWidth: 1,
    borderColor: brand.stoneBorder,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  imagePreview: { width: "100%", height: "100%" },
  imagePlaceholder: { alignItems: "center", gap: 6 },
  imagePlaceholderText: {
    color: brand.navy,
    fontSize: 14,
    fontWeight: "600",
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,23,42,0.55)",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  imageOverlayText: { color: brand.white, fontSize: 13, fontWeight: "600" },
  imageChangeBadge: {
    position: "absolute",
    right: 12,
    bottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(15,23,42,0.7)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  imageChangeBadgeText: {
    color: brand.white,
    fontSize: 11,
    fontWeight: "600",
  },
  field: { gap: 6 },
  label: { color: brand.stoneText, fontSize: 13, fontWeight: "600" },
  input: {
    backgroundColor: brand.white,
    borderColor: brand.stoneBorder,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: brand.black,
  },
  inputMulti: { minHeight: 80, textAlignVertical: "top" },
  row: { flexDirection: "row", gap: 12 },
  rowField: { flex: 1 },
  segment: {
    flexDirection: "row",
    backgroundColor: brand.white,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: brand.stoneBorder,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: "center",
    borderRadius: 9,
  },
  segmentBtnActive: { backgroundColor: brand.navy },
  segmentText: { color: brand.stoneText, fontSize: 13, fontWeight: "500" },
  segmentTextActive: { color: brand.white, fontWeight: "700" },
  toggleBlock: {
    backgroundColor: brand.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: brand.stoneBorder,
    paddingHorizontal: 14,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: brand.stoneBorder,
  },
  toggleLabel: { color: brand.stoneText, fontSize: 15 },
  errorBox: {
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorText: { color: brand.danger, fontSize: 13 },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: brand.danger,
    borderRadius: 999,
    marginTop: 6,
  },
  deleteText: { color: brand.danger, fontSize: 14, fontWeight: "600" },
});
