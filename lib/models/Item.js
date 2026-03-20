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
});

// Add index for efficient queries
ItemSchema.index({ restaurantId: 1 });

export default models?.Item || model("Item", ItemSchema);
