import pkg from "mongoose";
const { Schema, models, model } = pkg;

const ItemSchema = new Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  available: { type: Boolean, default: true },
  category: { type: String, default: "General" },
  image: { type: String, required: true },
  calories: { type: Number },
  restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },

  // Dietary tags
  isVeg:       { type: Boolean, default: false },
  isVegan:     { type: Boolean, default: false },
  isGlutenFree:{ type: Boolean, default: false },
  spiceLevel:  { type: String, enum: ["mild", "medium", "hot", "extra-hot"], default: "medium" },

  // Inventory
  stock:             { type: Number, default: -1 }, // -1 means unlimited
  lowStockThreshold: { type: Number, default: 5 },

  // Vector embedding for RAG (Gemini text-embedding-004, 768 dims).
  // `select: false` keeps the heavy array out of normal item reads.
  embedding:  { type: [Number], default: undefined, select: false },
  embeddedAt: { type: Date,     default: undefined, select: false },
});

// Add index for efficient queries
ItemSchema.index({ restaurantId: 1 });

export default models?.Item || model("Item", ItemSchema);
