/* eslint-disable @typescript-eslint/no-explicit-any */
import connectDB from "@/lib/db.js";
import Order from "@/lib/models/Order.js";
import { requireAuth } from "@/lib/utils/apiAuth";

// Force Node.js runtime — SSE requires persistent connections, not edge
export const runtime = "nodejs";

async function fetchActiveOrders(restaurantId: string) {
  await connectDB();
  return Order.find({
    restaurantId,
    status: { $in: ["pending", "preparing"] },
  })
    .populate({ path: "items.itemId", select: "name price category" })
    .sort({ createdAt: 1 }) // oldest first so kitchen sees them in order
    .lean();
}

export async function GET(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get("restaurantId");

  if (!restaurantId) {
    return new Response(JSON.stringify({ error: "restaurantId required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let active = true;

      const send = (data: unknown) => {
        if (!active) return;
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          active = false;
        }
      };

      // Send initial snapshot immediately
      try {
        const orders = await fetchActiveOrders(restaurantId);
        send({ orders, timestamp: new Date().toISOString() });
      } catch (e: any) {
        send({ error: e.message });
      }

      // Poll every 3 seconds and push to client
      const interval = setInterval(async () => {
        if (!active) {
          clearInterval(interval);
          return;
        }
        try {
          const orders = await fetchActiveOrders(restaurantId);
          send({ orders, timestamp: new Date().toISOString() });
        } catch {
          // keep streaming; transient DB errors shouldn't kill the connection
        }
      }, 3000);

      // Clean up when client disconnects
      request.signal.addEventListener("abort", () => {
        active = false;
        clearInterval(interval);
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // disable nginx buffering for SSE
    },
  });
}
