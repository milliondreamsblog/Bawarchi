/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { attachPhoneHash } from "@/lib/diner";

// Called from the Razorpay payment handler once a phone is captured.
// Idempotent: attaching the same phone to the same Diner is a no-op.
// If the phone is already bound to a different Diner, returns 409 with
// a merge marker — full merge logic is V1-production scope.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const dinerId: string | undefined = body?.dinerId;
    const phone: string | undefined = body?.phone;
    if (!dinerId || !phone) {
      return NextResponse.json(
        { success: false, error: "dinerId and phone are required" },
        { status: 400 }
      );
    }

    const result = await attachPhoneHash(dinerId, phone);
    if (result.ok && result.diner) {
      return NextResponse.json({
        success: true,
        dinerId: result.diner._id.toString(),
        state: result.diner.state,
      });
    }
    if (result.merge) {
      return NextResponse.json(
        {
          success: false,
          error: "phone already bound to another diner",
          merge: result.merge,
        },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to attach phone" },
      { status: 500 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
