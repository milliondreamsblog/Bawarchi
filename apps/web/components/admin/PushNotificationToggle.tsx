"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, BellOff } from "lucide-react";

interface PushNotificationToggleProps {
  restaurantId: string;
}

type PushState = "loading" | "unsupported" | "denied" | "enabled" | "disabled";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotificationToggle({ restaurantId }: PushNotificationToggleProps) {
  const [state, setState] = useState<PushState>("loading");
  const [busy, setBusy] = useState(false);

  const checkCurrentState = useCallback(async () => {
    // Check browser support
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }

    // Check notification permission
    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setState(subscription ? "enabled" : "disabled");
    } catch {
      setState("disabled");
    }
  }, []);

  useEffect(() => {
    checkCurrentState();
  }, [checkCurrentState]);

  const handleEnable = async () => {
    setBusy(true);
    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState("denied");
        return;
      }

      // Fetch VAPID public key
      const vapidRes = await fetch("/api/push/vapid-key");
      const vapidData = await vapidRes.json();
      if (!vapidData.success) throw new Error("Failed to fetch VAPID key");

      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push manager
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidData.vapidPublicKey) as any,
      });

      // Send subscription to backend
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId,
          subscription: subscription.toJSON(),
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error("Failed to save subscription");

      setState("enabled");
    } catch (err) {
      console.error("Push subscription failed:", err);
      setState("disabled");
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async () => {
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Notify backend
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });

        // Unsubscribe from push manager
        await subscription.unsubscribe();
      }

      setState("disabled");
    } catch (err) {
      console.error("Push unsubscribe failed:", err);
    } finally {
      setBusy(false);
    }
  };

  if (state === "loading") {
    return (
      <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
        <Bell className="h-4 w-4 animate-pulse" />
        <span>Checking notifications...</span>
      </div>
    );
  }

  if (state === "unsupported") {
    return (
      <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
        <BellOff className="h-4 w-4" />
        <span>Push notifications not supported</span>
      </div>
    );
  }

  if (state === "denied") {
    return (
      <div className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 dark:text-red-400">
        <BellOff className="h-4 w-4" />
        <span>Notifications blocked by browser</span>
      </div>
    );
  }

  return (
    <button
      onClick={state === "enabled" ? handleDisable : handleEnable}
      disabled={busy}
      className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
        state === "enabled"
          ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
      }`}
    >
      {state === "enabled" ? (
        <>
          <Bell className="h-4 w-4" />
          <span>{busy ? "Disabling..." : "Notifications On"}</span>
        </>
      ) : (
        <>
          <BellOff className="h-4 w-4" />
          <span>{busy ? "Enabling..." : "Enable Notifications"}</span>
        </>
      )}
    </button>
  );
}
