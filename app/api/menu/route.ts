/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import Menu from "@/lib/models/Menu.js";

export async function GET(request: Request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get("restaurantId");
    
    const query: any = {};
    if (restaurantId) {
      query.restaurantId = restaurantId;
    }
    
    const menu = await Menu.findOne(query).populate("sections.items").lean() as any;
    
    if (!menu) {
      return NextResponse.json(
        { success: false, error: "Menu not found" },
        { status: 404 }
      );
    }
    
    // Filter out unavailable items from each section
    menu.sections = menu.sections.map((section: any) => ({
      ...section,
      items: section.items.filter((item: any) => item.available !== false)
    }));
    
    return NextResponse.json({ success: true, menu });
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
    
    const { title, sections, restaurantId } = body;
    
    if (!title || !sections || !restaurantId) {
      return NextResponse.json(
        { success: false, error: "Title, sections, and restaurantId are required" },
        { status: 400 }
      );
    }

    // Delete existing menu for this restaurant (single menu per restaurant)
    await Menu.deleteMany({ restaurantId });

    const menu = await Menu.create({ title, sections, restaurantId });

    return NextResponse.json({ success: true, menu });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
