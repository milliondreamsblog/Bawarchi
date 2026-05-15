/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getOrCreateDinerByUuid } from "@/lib/diner";

// Called by the customer page on first mount with the device's localStorage
// UUID. Idempotent — safe to invoke on every page load. Returns the diner's
// dinerId, identity state, and (eventually) anything Layer D needs to know
// before retrieval (taste confidence, dietary prefs).
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const uuid: string | undefined = body?.uuid;
    if (!uuid || typeof uuid !== "string" || uuid.length < 8) {
      return NextResponse.json(
        { success: false, error: "uuid is required" },
        { status: 400 }
      );
    }

    const diner = await getOrCreateDinerByUuid(uuid);
    return NextResponse.json({
      success: true,
      dinerId: diner._id.toString(),
      state: diner.state,
      tasteConfidence: diner.tasteConfidence || 0,
      dietaryPrefs: diner.dietaryPrefs || null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
