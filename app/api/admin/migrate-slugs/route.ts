/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import Restaurant from "@/lib/models/Restaurant.js";

export async function GET(request: Request) {
  try {
    await connectDB();
    
    const restaurants = await Restaurant.find({ slug: { $exists: false } });
    
    let updatedCount = 0;
    
    for (const restaurant of restaurants) {
      const baseSlug = restaurant.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      
      let slug = baseSlug;
      let counter = 1;
      
      while (await Restaurant.findOne({ slug })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      
      restaurant.slug = slug;
      await restaurant.save();
      updatedCount++;
    }
    
    return NextResponse.json({ success: true, updated: updatedCount, message: "Slugs migrated successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
