import { NextResponse } from "next/server";
import type { ApiResponse, LoginRequest, LoginResponse } from "@bawarchie/types";
import connectDB from "@/lib/db.js";
import Restaurant from "@/lib/models/Restaurant.js";
import { hashPassword, verifyPassword } from "@/lib/utils/password";
import { signNativeToken } from "@/lib/jwt";

type RestaurantDoc = {
  _id: { toString(): string };
  email: string;
  name: string;
  slug: string;
  password: string;
  status: "pending" | "approved" | "blocked";
};

export async function POST(
  req: Request
): Promise<NextResponse<ApiResponse<LoginResponse>>> {
  try {
    const body = (await req.json()) as Partial<LoginRequest>;
    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    const SUPER_ADMIN_EMAIL =
      process.env.SUPER_ADMIN_EMAIL?.toLowerCase() || "admin@bawarchie.com";
    const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || "admin123";

    if (email === SUPER_ADMIN_EMAIL && password === SUPER_ADMIN_PASSWORD) {
      const user = {
        id: "super-admin",
        email: SUPER_ADMIN_EMAIL,
        name: "Super Admin",
        role: "super-admin" as const,
      };
      const token = await signNativeToken({ sub: user.id, ...user });
      return NextResponse.json({ success: true, token, user });
    }

    await connectDB();
    const restaurant = (await Restaurant.findOne({ email })
      .lean()) as RestaurantDoc | null;

    if (!restaurant?.password) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const { valid, needsRehash } = await verifyPassword(
      password,
      restaurant.password
    );
    if (!valid) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (restaurant.status !== "approved") {
      return NextResponse.json(
        { success: false, error: `Account status: ${restaurant.status}` },
        { status: 403 }
      );
    }

    // Self-heal legacy plaintext rows on successful native login.
    if (needsRehash) {
      hashPassword(password)
        .then((hash) =>
          Restaurant.findByIdAndUpdate(restaurant._id, { password: hash })
        )
        .catch((err) => {
          console.warn(
            `[auth-native] failed to rehash password for ${restaurant._id}:`,
            err?.message
          );
        });
    }

    const user = {
      id: restaurant._id.toString(),
      email: restaurant.email,
      name: restaurant.name,
      slug: restaurant.slug,
      role: "restaurant" as const,
    };
    const token = await signNativeToken({ sub: user.id, ...user });
    return NextResponse.json({ success: true, token, user });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Login failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
