import { NextResponse } from "next/server";

export async function GET() {
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;

  if (!vapidPublicKey) {
    return NextResponse.json(
      { success: false, error: "VAPID public key not configured" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, vapidPublicKey });
}
