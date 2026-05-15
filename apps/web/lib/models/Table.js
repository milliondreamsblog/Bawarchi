import pkg from "mongoose";
const { Schema, models, model } = pkg;

const TableSchema = new Schema({
  tableNumber: { type: Number, required: true },
  slug: { type: String, required: true },
  restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
  qrUrl: { type: String },
  status: { type: String, enum: ["free", "occupied"], default: "free" },
  occupiedAt: { type: Date, default: null },
  currentOrderId: { type: Schema.Types.ObjectId, ref: "Order", default: null },
});

// Slug should be unique per restaurant, not globally
TableSchema.index({ slug: 1, restaurantId: 1 }, { unique: true });
TableSchema.index({ restaurantId: 1 });

export default models?.Table || model("Table", TableSchema);
