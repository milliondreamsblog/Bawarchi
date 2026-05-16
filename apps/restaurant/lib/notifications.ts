import Constants from "expo-constants";
import { Platform } from "react-native";

import { api } from "@/lib/api";

// expo-notifications has no web implementation, and since SDK 53 it also
// throws at import time when running inside Expo Go on Android/iOS.
// We lazy-load it in a try/catch so the rest of the app can still work
// (push notifications will simply be disabled in unsupported environments).
let Notifications: typeof import("expo-notifications") | null = null;

if (Platform.OS !== "web") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Notifications = require("expo-notifications") as typeof import("expo-notifications");

    /**
     * Foreground notification UX: show the banner, play sound, don't bump
     * the icon badge (badges are for unread counts; we don't track those).
     */
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch (err) {
    console.warn(
      "[push] expo-notifications unavailable (Expo Go?), push disabled:",
      (err as Error).message
    );
    Notifications = null;
  }
}

/**
 * Register the device for push notifications:
 *   1. ensure the Android notification channel exists
 *   2. request permission
 *   3. fetch the Expo push token
 *   4. POST it to /api/native/push/register so the server can fan out
 *      "new order" pings via Expo's push service
 *
 * Returns the Expo push token on success (so the caller can stash it for
 * a clean unregister on sign-out). Returns null when the user denied
 * permission OR when we're running in a context that can't get a token
 * (e.g. iOS simulator in Expo Go).
 */
export async function registerForPushAsync(
  authToken: string | null
): Promise<string | null> {
  if (!authToken || !Notifications) return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("orders", {
      name: "Orders",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      sound: "default",
      lightColor: "#324F7B",
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  let granted = existing.status === "granted";
  if (!granted) {
    const asked = await Notifications.requestPermissionsAsync();
    granted = asked.status === "granted";
  }
  if (!granted) return null;

  // EAS project id, when present, lets Expo target the right push service.
  // Lookups via expoConfig.extra.eas.projectId or easConfig.projectId.
  const projectId =
    (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas
      ?.projectId ??
    (Constants as unknown as { easConfig?: { projectId?: string } }).easConfig
      ?.projectId;

  let pushToken: string;
  try {
    const result = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    pushToken = result.data;
  } catch (err) {
    console.warn("[push] failed to get Expo push token:", (err as Error).message);
    return null;
  }

  const res = await api.post(
    "/api/native/push/register",
    {
      token: pushToken,
      platform: Platform.OS,
      deviceName: Constants.deviceName ?? undefined,
    },
    { token: authToken }
  );
  if (!res.success) {
    console.warn("[push] register failed:", res.error);
    return null;
  }

  return pushToken;
}

/**
 * Drop the device's token on sign-out. Best-effort; failure is logged
 * but never propagated to the caller — sign-out must always complete.
 */
export async function unregisterPushAsync(
  authToken: string | null,
  pushToken: string | null
): Promise<void> {
  if (!authToken || !pushToken) return;
  const res = await api.del(
    `/api/native/push/register?token=${encodeURIComponent(pushToken)}`,
    { token: authToken }
  );
  if (!res.success) {
    console.warn("[push] unregister failed:", res.error);
  }
}
