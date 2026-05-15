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


    // Fetch menu and populate items
    let menu;
    let populateSuccessful = true;

    try {
      menu = await Menu.findOne(query).populate({
        path: 'sections.items',
        options: { strictPopulate: false }
      }).lean() as any;
    } catch (populateError: any) {
      console.error('Error populating menu items:', populateError);
      populateSuccessful = false;
      // If populate fails, try fetching without populate
      menu = await Menu.findOne(query).lean() as any;
    }

    if (!menu) {
      return NextResponse.json(
        { success: false, error: "Menu not found" },
        { status: 404 }
      );
    }


    // If populate failed, manually fetch items
    if (!populateSuccessful && menu.sections && Array.isArray(menu.sections)) {
      console.log('Manually populating items...');

      for (const section of menu.sections) {
        if (section.items && Array.isArray(section.items)) {
          // Fetch all items for this section
          const itemIds = section.items;
          const populatedItems = await Item.find({
            _id: { $in: itemIds }
          }).lean();

          // Replace ObjectIds with actual items
          section.items = populatedItems;
        }
      }
    }

    // Filter out unavailable items from each section
    if (menu.sections && Array.isArray(menu.sections)) {
      menu.sections = menu.sections.map((section: any) => ({
        ...section,
        items: Array.isArray(section.items)
          ? section.items.filter((item: any) => {
            // Check if item is an object (not just an ID) and is available
            if (typeof item === 'object' && item !== null) {
              return item.available !== false;
            }
            // If it's just an ID string, filter it out
            return false;
          })
          : []
      }));

      // Remove sections with no items
      menu.sections = menu.sections.filter((section: any) =>
        section.items && section.items.length > 0
      );
    }

    console.log('Returning menu with sections:', menu.sections?.length || 0);

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
