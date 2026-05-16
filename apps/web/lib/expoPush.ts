import ExpoPushToken from "@/lib/models/ExpoPushToken.js";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
  channelId?: string;
};

type ExpoTicket = {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
};

/**
 * Send a batch of Expo push messages. Errors are logged but never thrown —
 * a push failure must never break the request that triggered it.
 *
 * Expo accepts up to 100 messages per call; we chunk transparently.
 */
async function sendBatch(messages: ExpoPushMessage[]): Promise<void> {
  if (messages.length === 0) return;
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100);
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
        },
        body: JSON.stringify(chunk),
      });
      const json: { data?: ExpoTicket[] } = await res.json();
      const tickets = Array.isArray(json?.data) ? json.data : [];
      const expired: string[] = [];
      tickets.forEach((t, idx) => {
        if (t.status === "error") {
          console.warn(
            `[expo-push] ticket error: ${t.message ?? ""} (${t.details?.error ?? "?"})`
          );
          if (t.details?.error === "DeviceNotRegistered") {
            expired.push(chunk[idx].to);
          }
        }
      });
      if (expired.length > 0) {
        // Stale tokens — drop them so we don't keep paying the round-trip
        // every order. Fire-and-forget; failure here only affects cleanup.
        ExpoPushToken.deleteMany({ token: { $in: expired } }).catch((err) => {
          console.warn("[expo-push] failed to prune stale tokens:", err?.message);
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown";
      console.warn(`[expo-push] batch failed: ${msg}`);
    }
  }
}

/**
 * Look up every registered Expo push token for a restaurant and send the
 * same notification to all of them. Used by /api/orders POST to alert
 * staff when a new order lands.
 */
export async function notifyRestaurant(input: {
  restaurantId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  const tokens = (await ExpoPushToken.find({
    restaurantId: input.restaurantId,
  })
    .select("token")
    .lean()) as unknown as Array<{ token: string }>;

  if (tokens.length === 0) return;

  const messages: ExpoPushMessage[] = tokens.map((t) => ({
    to: t.token,
    title: input.title,
    body: input.body,
    data: input.data,
    sound: "default",
    channelId: "orders",
  }));

  await sendBatch(messages);
}
