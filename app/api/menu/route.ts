/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import Menu from "@/lib/models/Menu.js";
import Item from "@/lib/models/Item.js"; // Import Item model for populate to work

export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get("restaurantId");

    if (!restaurantId) {
      return NextResponse.json(
        { success: false, error: "restaurantId is required" },
        { status: 400 }
      );
    }

    const query: any = { restaurantId };

    console.log('Fetching menu for restaurantId:', restaurantId);

    // Fetch menu and populate items
    let menu;
    try {
      menu = await Menu.findOne(query).populate({
        path: 'sections.items',
        options: { strictPopulate: false }
      }).lean() as any;
    } catch (populateError: any) {
      console.error('Error populating menu items:', populateError);
      // If populate fails, try fetching without populate
      menu = await Menu.findOne(query).lean() as any;
    }

    if (!menu) {
      console.log('Menu not found for restaurantId:', restaurantId);
      return NextResponse.json(
        { success: false, error: "Menu not found" },
        { status: 404 }
      );
    }

    console.log('Menu found, processing sections...');

    // Filter out unavailable items from each section
    if (menu.sections && Array.isArray(menu.sections)) {
      menu.sections = menu.sections.map((section: any) => ({
        ...section,
        items: Array.isArray(section.items)
          ? section.items.filter((item: any) => item && item.available !== false)
          : []
      }));
    }

    return NextResponse.json({ success: true, menu });
  } catch (error: any) {
    console.error('Menu API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
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
