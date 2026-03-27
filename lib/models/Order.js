import pkg from "mongoose";
const { Schema, models, model } = pkg;

const OrderSchema = new Schema({
    tableSlug: { type: String, required: true },
    items: [
        {
            itemId: { type: Schema.Types.ObjectId, ref: "Item", required: true },
            qty: { type: Number, required: true, min: 1 },
        },
    ],
    total: { type: Number, required: true },
    // New billing fields for GST + Platform Fee
    baseTotal: { type: Number, required: false }, // Sum of (item price × qty)
    gstPercentage: { type: Number, required: false, default: 0 }, // Snapshot of restaurant's GST % at order time
    gstAmount: { type: Number, required: false, default: 0 }, // Calculated GST amount
    platformFee: { type: Number, required: false, default: 0 }, // 2% of (baseTotal + gstAmount)
    finalAmount: { type: Number, required: false }, // baseTotal + gstAmount + platformFee
    restaurantEarnings: { type: Number, required: false }, // finalAmount - platformFee
    myEarnings: { type: Number, required: false }, // platformFee (for platform owner)
    status: {
        type: String,
        enum: ["pending", "preparing", "served", "cancelled", "refunded"],
        default: "pending",
    },
    cancelledAt: { type: Date },
    cancelledBy: { type: String, enum: ["customer", "admin"] },
    cancellationReason: { type: String },
    refundId: { type: String },
    refundStatus: { type: String, enum: ["pending", "processed", "failed"] },
    refundAmount: { type: Number },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    createdAt: { type: Date, default: Date.now },
});

// Add index for efficient queries
OrderSchema.index({ restaurantId: 1 });
OrderSchema.index({ status: 1, restaurantId: 1 });

export default models?.Order || model("Order", OrderSchema);
