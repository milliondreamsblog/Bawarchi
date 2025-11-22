/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import Restaurant from "@/lib/models/Restaurant.js";
import { hashPassword } from "@/lib/utils/password";

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();

    const { name, email, password, owner, phone, address } = body;

    // Validation
    if (!name || !email || !password || !owner || !phone) {
      return NextResponse.json(
        { success: false, error: "All required fields must be provided" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingRestaurant = await Restaurant.findOne({ email }).lean();
    if (existingRestaurant) {
      return NextResponse.json(
        { success: false, error: "Email already registered" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate slug from name
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    
    let slug = baseSlug;
    let counter = 1;
    
    while (await Restaurant.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create restaurant with pending status
    const restaurant = await Restaurant.create({
      name,
      slug,
      email,
      password: hashedPassword,
      owner,
      phone,
      address,
      status: "pending",
    });

    return NextResponse.json({
      success: true,
      message:
        "Registration successful! Your account is pending approval. We'll notify you once approved.",
      restaurantId: restaurant._id,
    });
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Registration failed" },
      { status: 500 }
    );
  }
}
