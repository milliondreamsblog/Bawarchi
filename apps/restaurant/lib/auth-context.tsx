import type { LoginResponse, SessionUser } from "@bawarchie/types";
import { useRouter, useSegments } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Platform } from "react-native";

import { api } from "@/lib/api";

const TOKEN_KEY = "bawarchie.restaurant.token";
const USER_KEY = "bawarchie.restaurant.user";

type AuthState = {
  user: SessionUser | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

async function storageGet(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

async function storageSet(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      // best effort
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function storageDel(key: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      // best effort
    }
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          storageGet(TOKEN_KEY),
          storageGet(USER_KEY),
        ]);
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser) as SessionUser);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function signIn(email: string, password: string) {
    const res = await api.post<LoginResponse>("/api/auth/native", {
      email: email.trim(),
      password,
    });
    if (!res.success) {
      return { ok: false as const, error: res.error };
    }
    await Promise.all([
      storageSet(TOKEN_KEY, res.token),
      storageSet(USER_KEY, JSON.stringify(res.user)),
    ]);
    setToken(res.token);
    setUser(res.user);
    return { ok: true as const };
  }

  async function signOut() {
    await Promise.all([storageDel(TOKEN_KEY), storageDel(USER_KEY)]);
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}

/**
 * Redirect between /login and /(tabs) based on auth state.
 * Mount once at the root, after the segments hook has settled.
 */
export function useProtectedRoute() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const onLoginScreen = segments[0] === "login";
    if (!user && !onLoginScreen) {
      router.replace("/login");
    } else if (user && onLoginScreen) {
      router.replace("/orders");
    }
  }, [user, loading, segments, router]);
}
