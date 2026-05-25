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

import { brand } from "@/constants/brand";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth-context";

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disabled = submitting || !email.trim() || !password;

  async function handleSubmit() {
    if (disabled) return;
    setSubmitting(true);
    setError(null);
    const result = await signIn(email, password);
    if (!result.ok) {
      setError(result.error);
      setSubmitting(false);
    }
    // On success, useProtectedRoute redirects to /(tabs); no need to clear state.
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.flex}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>BAWARCHIE</Text>
          <Text style={styles.title}>Restaurant Console</Text>
          <Text style={styles.subtitle}>
            Sign in with the same credentials you use on the web admin.
          </Text>
        </View>

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
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={brand.stoneMuted}
              secureTextEntry
              autoComplete="current-password"
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
              <Text style={styles.submitText}>Sign in</Text>
            )}
          </Pressable>
        </View>

        <Pressable
          onPress={() => router.push("/forgot-password")}
          style={styles.forgotButton}
        >
          <Text style={styles.forgotText}>Forgot password?</Text>
        </Pressable>

        <Text style={styles.footnote}>
          Need an account? Register on the web at /auth/signup. Pending
          approvals are handled by the super admin.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: brand.offwhite },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 96,
    paddingBottom: 32,
    backgroundColor: brand.offwhite,
  },
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
  forgotButton: {
    alignSelf: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  forgotText: {
    color: brand.blue,
    fontSize: 14,
    fontWeight: "600",
  },
  footnote: {
    marginTop: "auto",
    color: brand.stoneMuted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
});
