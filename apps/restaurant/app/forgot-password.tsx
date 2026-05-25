import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import { brand } from "@/constants/brand";
import { api } from "@/lib/api";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disabled = submitting || !email.trim();

  async function handleSubmit() {
    if (disabled) return;
    setSubmitting(true);
    setError(null);

    const res = await api.post("/api/auth/forgot-password", { email });

    if (res.success) {
      setSent(true);
    } else {
      setError(res.error || "Something went wrong. Please try again.");
    }
    setSubmitting(false);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.flex}
    >
      <View style={styles.container}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>{"< Back to login"}</Text>
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.eyebrow}>BAWARCHIE</Text>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            {sent
              ? "Check your email for a password reset link. You can use the link on any device."
              : "Enter your restaurant email and we'll send you a link to reset your password."}
          </Text>
        </View>

        {sent ? (
          <View style={styles.successBox}>
            <Text style={styles.successText}>
              If an account exists for {email}, a reset link has been sent.
              Check your inbox and spam folder.
            </Text>
          </View>
        ) : (
          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="owner@yourplace.com"
                placeholderTextColor={brand.stoneMuted}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                style={styles.input}
                editable={!submitting}
                onSubmitEditing={handleSubmit}
                returnKeyType="go"
              />
            </View>

            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Pressable
              onPress={handleSubmit}
              disabled={disabled}
              style={({ pressed }) => [
                styles.submit,
                disabled && styles.submitDisabled,
                pressed && !disabled && styles.submitPressed,
              ]}
            >
              {submitting ? (
                <ActivityIndicator color={brand.white} />
              ) : (
                <Text style={styles.submitText}>Send reset link</Text>
              )}
            </Pressable>
          </View>
        )}

        {sent && (
          <Pressable
            onPress={() => router.replace("/login")}
            style={styles.returnButton}
          >
            <Text style={styles.returnText}>Return to login</Text>
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: brand.offwhite },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 64,
    paddingBottom: 32,
    backgroundColor: brand.offwhite,
  },
  backButton: { marginBottom: 24 },
  backText: { color: brand.blue, fontSize: 15, fontWeight: "500" },
  header: { marginBottom: 40 },
  eyebrow: {
    color: brand.sky,
    fontSize: 13,
    letterSpacing: 2,
    fontWeight: "600",
    marginBottom: 8,
  },
  title: {
    color: brand.navy,
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    color: brand.stoneText,
    fontSize: 15,
    lineHeight: 22,
  },
  form: { gap: 20 },
  field: { gap: 6 },
  label: {
    color: brand.stoneText,
    fontSize: 13,
    fontWeight: "600",
  },
  input: {
    backgroundColor: brand.white,
    borderColor: brand.stoneBorder,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: brand.black,
  },
  errorBox: {
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorText: { color: brand.danger, fontSize: 14 },
  successBox: {
    backgroundColor: "#D1FAE5",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  successText: { color: "#065F46", fontSize: 14, lineHeight: 21 },
  submit: {
    backgroundColor: brand.navy,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  submitDisabled: { opacity: 0.5 },
  submitPressed: { opacity: 0.85 },
  submitText: {
    color: brand.white,
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  returnButton: {
    marginTop: 24,
    alignItems: "center",
  },
  returnText: {
    color: brand.blue,
    fontSize: 15,
    fontWeight: "600",
  },
});
