import pkg from "mongoose";
const { Schema, models, model } = pkg;

const ItemSchema = new Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  available: { type: Boolean, default: true },
  category: { type: String, default: "General" },
  image: { type: String },
  calories: { type: Number },
  restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
});

// Add index for efficient queries
ItemSchema.index({ restaurantId: 1 });

export default models?.Item || model("Item", ItemSchema);
