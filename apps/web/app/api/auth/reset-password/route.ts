import { NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "@/lib/db";
import Restaurant from "@/lib/models/Restaurant";
import { hashPassword } from "@/lib/utils/password";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: "Token and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    await connectDB();

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const restaurant = await Restaurant.findOne({
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: new Date() },
    });

    if (!restaurant) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired reset link. Please request a new one." },
        { status: 400 }
      );
    }

    restaurant.password = await hashPassword(password);
    restaurant.resetToken = null;
    restaurant.resetTokenExpiry = null;
    await restaurant.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
