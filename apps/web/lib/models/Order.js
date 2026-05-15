import pkg from "mongoose";
const { Schema, models, model } = pkg;

const OrderSchema = new Schema(
    {
        tableSlug: { type: String, required: true },
        items: [
            {
                itemId: { type: Schema.Types.ObjectId, ref: "Item", required: true },
                qty: { type: Number, required: true, min: 1 },
            },
        ],
        // Legacy single total — kept in sync with finalAmount for backward compat
        // with code paths that still read `order.total`. Once all callers migrate
        // to `finalAmount`, this can be dropped.
        total: { type: Number, required: true },
        // Authoritative billing fields (computed server-side by lib/billing.ts;
        // never trust values arriving from the client).
        baseTotal: { type: Number, required: false },
        gstPercentage: { type: Number, required: false, default: 0 },
        gstAmount: { type: Number, required: false, default: 0 },
        platformFee: { type: Number, required: false, default: 0 },
        finalAmount: { type: Number, required: false },
        restaurantEarnings: { type: Number, required: false },
        myEarnings: { type: Number, required: false },
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
        // Pillar 3 prep — populated by Step 1 onwards. Optional/sparse so
        // pre-existing orders without a diner reference remain valid.
        dinerId: { type: Schema.Types.ObjectId, ref: "Diner", default: null },
        customerPhone: { type: String, default: null },
        createdAt: { type: Date, default: Date.now },
    },
    { timestamps: { createdAt: false, updatedAt: true } }
);

OrderSchema.index({ restaurantId: 1 });
OrderSchema.index({ status: 1, restaurantId: 1 });
// Dual-index for Pillar 3 §4.2 — taste-graph reads scan by diner across tenants;
// restaurant reads stay on the restaurantId index above.
OrderSchema.index({ dinerId: 1, createdAt: -1 }, { sparse: true });

export default models?.Order || model("Order", OrderSchema);
