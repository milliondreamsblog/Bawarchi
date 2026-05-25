import { NextResponse } from "next/server";
import crypto from "crypto";
import { Resend } from "resend";
import connectDB from "@/lib/db";
import Restaurant from "@/lib/models/Restaurant";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const restaurant = await Restaurant.findOne({
      email: email.toLowerCase().trim(),
    });

    // Always return success to avoid leaking whether the email exists
    if (!restaurant) {
      return NextResponse.json({ success: true });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    restaurant.resetToken = hashedToken;
    restaurant.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await restaurant.save();

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || "https://bawarchie.com";
    const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`;

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Bawarchie <noreply@bawarchie.com>",
      to: restaurant.email,
      subject: "Reset your Bawarchie password",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
          <h2 style="color: #324F7B; margin-bottom: 16px;">Reset your password</h2>
          <p style="color: #44403C; font-size: 15px; line-height: 24px;">
            Hi ${restaurant.name || "there"},
          </p>
          <p style="color: #44403C; font-size: 15px; line-height: 24px;">
            We received a request to reset your Bawarchie restaurant account password.
            Click the button below to choose a new password. This link expires in 1 hour.
          </p>
          <a href="${resetUrl}" style="display: inline-block; background: #324F7B; color: #ffffff; padding: 14px 28px; border-radius: 999px; text-decoration: none; font-weight: 600; font-size: 15px; margin: 24px 0;">
            Reset Password
          </a>
          <p style="color: #78716C; font-size: 13px; line-height: 20px; margin-top: 32px;">
            If you didn't request this, you can safely ignore this email. Your password won't change.
          </p>
          <hr style="border: none; border-top: 1px solid #E7E5E4; margin: 24px 0;" />
          <p style="color: #78716C; font-size: 12px;">Bawarchie — QR-based restaurant ordering</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
