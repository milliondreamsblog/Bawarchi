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
    status: {
        type: String,
        enum: ["pending", "preparing", "served"],
        default: "pending",
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    createdAt: { type: Date, default: Date.now },
});

// Add index for efficient queries
OrderSchema.index({ restaurantId: 1 });
OrderSchema.index({ status: 1, restaurantId: 1 });

export default models?.Order || model("Order", OrderSchema);
