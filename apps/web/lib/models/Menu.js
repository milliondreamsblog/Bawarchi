import pkg from "mongoose";
const { Schema, models, model } = pkg;

const MenuSchema = new Schema({
  title: String,
  sections: [
    {
      name: String,
      items: [{ type: Schema.Types.ObjectId, ref: "Item" }],
    },
  ],
  restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
});

// Add index for efficient queries
MenuSchema.index({ restaurantId: 1 });

export default models?.Menu || model("Menu", MenuSchema);
