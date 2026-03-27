import webpush from "web-push";
import connectDB from "@/lib/db.js";
import PushSubscription from "@/lib/models/PushSubscription.js";

// Configure VAPID keys
webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL || "admin@bawarchie.com"}`,
  process.env.VAPID_PUBLIC_KEY || "",
  process.env.VAPID_PRIVATE_KEY || ""
);

interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

/**
 * Send a push notification to all subscribed devices for a given restaurant.
 * Fire-and-forget — this function never throws.
 */
export async function sendPushNotification(
  restaurantId: string,
  payload: PushPayload
): Promise<void> {
  try {
    await connectDB();

    const subscriptions = await PushSubscription.find({ restaurantId }).lean();

    if (!subscriptions || subscriptions.length === 0) return;

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      data: payload.data || {},
    });

    const sendPromises = subscriptions.map(async (sub: any) => {
      try {
        await webpush.sendNotification(sub.subscription, notificationPayload);
      } catch (err: any) {
        // If the subscription is no longer valid (410 Gone or 404), remove it
        if (err.statusCode === 410 || err.statusCode === 404) {
          await PushSubscription.deleteOne({ _id: sub._id });
        }
        // Silently ignore other errors
      }
    });

    await Promise.allSettled(sendPromises);
  } catch {
    // Fire and forget — never throw
  }
}
