/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import Table from "@/lib/models/Table.js";

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

export async function POST(request: Request) {
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

    // Check if slug already exists for this restaurant
    const existing = await Table.findOne({ slug, restaurantId });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "A table with this slug already exists" },
        { status: 400 }
      );
    }

    const table = await Table.create({ tableNumber, slug, restaurantId });
    return NextResponse.json({ success: true, table }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
