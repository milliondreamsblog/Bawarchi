/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import Table from "@/lib/models/Table.js";
import { requireAuth } from "@/lib/utils/apiAuth";

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error } = await requireAuth();
    if (error) return error;

    try {
        await connectDB();
        const { id } = await params;
        const body = await request.json();
        const { restaurantId } = body;

        // Verify table belongs to restaurant
        const existingTable = await Table.findById(id);

        if (!existingTable) {
            return NextResponse.json(
                { success: false, error: "Table not found" },
                { status: 404 }
            );
        }

        if (restaurantId && existingTable.restaurantId.toString() !== restaurantId) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 403 }
            );
        }

        await Table.findByIdAndDelete(id);

        return NextResponse.json({
            success: true,
            message: 'Table deleted successfully'
        });
    } catch (error: any) {
        console.error("Error deleting table:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
