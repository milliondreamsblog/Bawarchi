/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import type { ApiResponse } from "@bawarchie/types";
import connectDB from "@/lib/db.js";
import ExpoPushToken from "@/lib/models/ExpoPushToken.js";
import { requireAuth } from "@/lib/utils/apiAuth";

/**
 * POST /api/native/push/register
 * Body: { token, platform?, deviceName? }
 *
 * Records (or refreshes) an Expo push token against the calling
 * restaurant's id. Upserted on token so re-registering the same device
 * just bumps lastUsedAt instead of inserting a duplicate.
 */
export async function POST(req: Request): Promise<NextResponse<ApiResponse>> {
  const { error, session } = await requireAuth();
  if (error) return error;

  const role = (session!.user as any).role as string | undefined;
  const restaurantId = (session!.user as any).id as string | undefined;
  if (role !== "restaurant" || !restaurantId) {
    return NextResponse.json(
      { success: false, error: "Only restaurant accounts can register devices" },
      { status: 403 }
    );
  }

  try {
    await connectDB();
    const body = await req.json();
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    const platform = ["ios", "android", "web"].includes(body?.platform)
      ? body.platform
      : undefined;
    const deviceName =
      typeof body?.deviceName === "string" ? body.deviceName.slice(0, 100) : undefined;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "token is required" },
        { status: 400 }
      );
    }
    if (!/^ExponentPushToken\[.+\]$|^ExpoPushToken\[.+\]$/.test(token)) {
      return NextResponse.json(
        { success: false, error: "token does not look like an Expo push token" },
        { status: 400 }
      );
    }

    await ExpoPushToken.findOneAndUpdate(
      { token },
      {
        restaurantId,
        token,
        platform,
        deviceName,
        lastUsedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message ?? "Failed to register token" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/native/push/register?token=ExponentPushToken[...]
 *
 * Drops a token on sign-out / app uninstall hint. Idempotent — deleting an
 * unknown token still returns success. Token in the query string so native
 * clients can use plain DELETE without a body (fetch on RN doesn't carry
 * DELETE bodies reliably across runtimes).
 */
export async function DELETE(req: Request): Promise<NextResponse<ApiResponse>> {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    await connectDB();
    const url = new URL(req.url);
    const token = (url.searchParams.get("token") ?? "").trim();
    if (!token) {
      return NextResponse.json(
        { success: false, error: "token query param is required" },
        { status: 400 }
      );
    }
    await ExpoPushToken.deleteOne({ token });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message ?? "Failed to unregister token" },
      { status: 500 }
    );
  }
}
