/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import Table from "@/lib/models/Table.js";
import { requireAuth } from "@/lib/utils/apiAuth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!["free", "occupied"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Status must be 'free' or 'occupied'" },
        { status: 400 }
      );
    }

    const update: any =
      status === "occupied"
        ? { status: "occupied", occupiedAt: new Date() }
        : { status: "free", occupiedAt: null, currentOrderId: null };

    const table = await Table.findByIdAndUpdate(id, update, { new: true });

    if (!table) {
      return NextResponse.json(
        { success: false, error: "Table not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, table });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
