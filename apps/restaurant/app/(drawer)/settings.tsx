import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type {
  GetSettingsResponse,
  GstPercentage,
  RestaurantSettings,
} from "@bawarchie/types";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { brand } from "@/constants/brand";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const GST_OPTIONS: GstPercentage[] = [0, 5, 12, 18];

export default function SettingsScreen() {
  const { user, token } = useAuth();
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const [keyId, setKeyId] = useState("");
  const [keySecret, setKeySecret] = useState("");
  const [secretVisible, setSecretVisible] = useState(false);
  const [gst, setGst] = useState<GstPercentage>(0);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchSettings = useCallback(async () => {
    if (!user?.id) return;
    const res = await api.get<GetSettingsResponse>(
      `/api/restaurant/${encodeURIComponent(user.id)}/settings`,
      { token }
    );
    if (!isMounted.current) return;
    if (res.success) {
      setSettings(res.settings);
      setKeyId(res.settings.razorpayKeyId ?? "");
      setKeySecret(res.settings.razorpayKeySecret ?? "");
      setGst((res.settings.gstPercentage ?? 0) as GstPercentage);
      setError(null);
    } else {
      setError(res.error);
    }
  }, [token, user?.id]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const dirty =
    settings != null &&
    (keyId !== (settings.razorpayKeyId ?? "") ||
      keySecret !== (settings.razorpayKeySecret ?? "") ||
      gst !== ((settings.gstPercentage ?? 0) as GstPercentage));

  async function handleSave() {
    if (!user?.id || !dirty) return;
    setSaving(true);
    setError(null);
    const res = await api.patch(
      `/api/restaurant/${encodeURIComponent(user.id)}/settings`,
      {
        razorpayKeyId: keyId.trim(),
        razorpayKeySecret: keySecret.trim(),
        gstPercentage: gst,
      },
      { token }
    );
    if (!isMounted.current) return;
    setSaving(false);
    if (!res.success) {
      Alert.alert("Could not save", res.error);
      return;
    }
    setSettings({
      razorpayKeyId: keyId.trim(),
      razorpayKeySecret: keySecret.trim(),
      gstPercentage: gst,
    });
    setSavedFlash(true);
    setTimeout(() => {
      if (isMounted.current) setSavedFlash(false);
    }, 1500);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.flex}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.profileCard}>
          <Text style={styles.eyebrow}>Signed in as</Text>
          <Text style={styles.profileName}>{user?.name ?? "—"}</Text>
          <Text style={styles.profileEmail}>{user?.email ?? "—"}</Text>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {settings == null && !error ? (
          <View style={styles.loading}>
            <ActivityIndicator color={brand.navy} />
          </View>
        ) : (
          <>
            <SectionHeader title="GST" icon="receipt" />
            <Text style={styles.helper}>
              Applied to every order's subtotal. Pick the slab that matches
              your registration.
            </Text>
            <View style={styles.segment}>
              {GST_OPTIONS.map((rate) => (
                <Pressable
                  key={rate}
                  onPress={() => setGst(rate)}
                  disabled={saving}
                  style={[styles.segmentBtn, gst === rate && styles.segmentBtnActive]}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      gst === rate && styles.segmentTextActive,
                    ]}
                  >
                    {rate}%
                  </Text>
                </Pressable>
              ))}
            </View>

            <SectionHeader title="Razorpay" icon="payments" />
            <Text style={styles.helper}>
              Your live keys override the platform-wide defaults so payouts go
              directly to your linked bank account.
            </Text>

            <View style={styles.field}>
              <Text style={styles.label}>Key ID</Text>
              <TextInput
                value={keyId}
                onChangeText={setKeyId}
                placeholder="rzp_live_..."
                placeholderTextColor={brand.stoneMuted}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
                editable={!saving}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Key Secret</Text>
              <View style={styles.secretRow}>
                <TextInput
                  value={keySecret}
                  onChangeText={setKeySecret}
                  placeholder="•••••••••••••"
                  placeholderTextColor={brand.stoneMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry={!secretVisible}
                  style={[styles.input, styles.secretInput]}
                  editable={!saving}
                />
                <Pressable
                  onPress={() => setSecretVisible((v) => !v)}
                  disabled={saving}
                  style={({ pressed }) => [styles.eyeBtn, pressed && styles.pressed]}
                >
                  <MaterialIcons
                    name={secretVisible ? "visibility-off" : "visibility"}
                    size={20}
                    color={brand.stoneText}
                  />
                </Pressable>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {savedFlash && (
          <View style={styles.savedFlash}>
            <MaterialIcons name="check-circle" size={16} color={brand.success} />
            <Text style={styles.savedFlashText}>Saved</Text>
          </View>
        )}
        <Pressable
          onPress={handleSave}
          disabled={!dirty || saving || !settings}
          style={({ pressed }) => [
            styles.saveBtn,
            (!dirty || saving || !settings) && styles.disabled,
            pressed && dirty && !saving && styles.pressed,
          ]}
        >
          {saving ? (
            <ActivityIndicator color={brand.white} />
          ) : (
            <Text style={styles.saveBtnText}>{dirty ? "Save changes" : "Up to date"}</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function SectionHeader({
  title,
  icon,
}: {
  title: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}) {
  return (
    <View style={styles.sectionHeader}>
      <MaterialIcons name={icon} size={18} color={brand.sky} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: brand.offwhite },
  scroll: { padding: 20, paddingBottom: 120, gap: 8 },
  profileCard: {
    backgroundColor: brand.white,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: brand.stoneBorder,
    marginBottom: 16,
  },
  eyebrow: {
    color: brand.sky,
    fontSize: 11,
    letterSpacing: 1.8,
    fontWeight: "600",
    marginBottom: 6,
  },
  profileName: { color: brand.navy, fontSize: 18, fontWeight: "700" },
  profileEmail: { color: brand.stoneMuted, fontSize: 13, marginTop: 2 },
  errorBox: {
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  errorText: { color: brand.danger, fontSize: 13 },
  loading: { alignItems: "center", paddingVertical: 30 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    marginBottom: 6,
  },
  sectionTitle: { color: brand.navy, fontSize: 15, fontWeight: "700" },
  helper: { color: brand.stoneMuted, fontSize: 12, lineHeight: 18, marginBottom: 10 },
  segment: {
    flexDirection: "row",
    backgroundColor: brand.white,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: brand.stoneBorder,
    marginBottom: 8,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 11,
    alignItems: "center",
    borderRadius: 9,
  },
  segmentBtnActive: { backgroundColor: brand.navy },
  segmentText: { color: brand.stoneText, fontSize: 14, fontWeight: "500" },
  segmentTextActive: { color: brand.white, fontWeight: "700" },
  field: { gap: 6, marginTop: 6 },
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
  secretRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  secretInput: { flex: 1 },
  eyeBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: brand.white,
    borderWidth: 1,
    borderColor: brand.stoneBorder,
  },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.5 },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    backgroundColor: brand.offwhite,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: brand.stoneBorder,
    gap: 10,
  },
  savedFlash: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  savedFlashText: { color: brand.success, fontSize: 12, fontWeight: "600" },
  saveBtn: {
    backgroundColor: brand.navy,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
  },
  saveBtnText: { color: brand.white, fontSize: 15, fontWeight: "700" },
});
