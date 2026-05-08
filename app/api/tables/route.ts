/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import Table from "@/lib/models/Table.js";
import QRCode from "qrcode";
import { v2 as cloudinary } from "cloudinary";
import Restaurant from "@/lib/models/Restaurant";
import { requireAuth } from "@/lib/utils/apiAuth";

export interface RestaurantType {
  _id: string;
  name: string;
  slug: string;
  email: string;
  owner: string;
  phone: string;
  address: string;
  status: string;
  gstPercentage?: number;
}

export async function GET(request: Request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get("restaurantId");
    const slug = searchParams.get("slug");
    
    const query: any = {};
    
    // For customer access by slug
    if (slug) {
      query.slug = slug;
    }
    // For restaurant admin listing
    else if (restaurantId) {
      query.restaurantId = restaurantId;
    } else {
      return NextResponse.json(
        { success: false, error: "restaurantId or slug is required" },
        { status: 400 }
      );
    }
    
    const tables = await Table.find(query).lean();
    return NextResponse.json({ success: true, tables });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


export async function POST(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    await connectDB();
    const body = await request.json();
    const { tableNumber, slug, restaurantId } = body;

    if (!tableNumber || !slug || !restaurantId) {
      return NextResponse.json(
        { success: false, error: "Table number, slug, and restaurantId are required" },
        { status: 400 }
      );
    }

    const restaurant = await Restaurant.findById(restaurantId).lean<RestaurantType>();

    if (!restaurant) {
      return NextResponse.json(
        { success: false, error: "Restaurant not found" },
        { status: 404 }
      );
    }


    // Check duplicate slug within same restaurant
    const existing = await Table.findOne({ slug, restaurantId });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "A table with this slug already exists" },
        { status: 400 }
      );
    }

    const restaurantSlug = restaurant.slug;

    // --- 1. Generate table URL ---
    const domain = process.env.NEXT_PUBLIC_BASE_URL
    const tableUrl = `${domain}/r/${restaurantSlug}/t/${slug}`;

    // --- 2. Create QR Code (base64) ---
    const qrBase64 = await QRCode.toDataURL(tableUrl);

    // --- 3. Upload QR to Cloudinary ---
    const uploadResult = await cloudinary.uploader.upload(qrBase64, {
      folder: `restaurants/${restaurantId}/tables`,
      public_id: slug, // keeps table-slug.png
      overwrite: true,
    });

    // --- 4. Create table in DB with qrUrl ---
    const table = await Table.create({
      tableNumber,
      slug,
      restaurantId,
      qrUrl: uploadResult.secure_url, // store Cloudinary URL
    });

    return NextResponse.json({ success: true, table }, { status: 201 });

  } catch (error: any) {
    console.error("Error creating table:", error);
    
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
