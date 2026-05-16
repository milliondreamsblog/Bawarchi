import pkg from "mongoose";
const { Schema, models, model } = pkg;

const ExpoPushTokenSchema = new Schema({
  restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
  token: { type: String, required: true, unique: true },
  platform: { type: String, enum: ["ios", "android", "web"] },
  deviceName: { type: String },
  createdAt: { type: Date, default: Date.now },
  lastUsedAt: { type: Date, default: Date.now },
});

ExpoPushTokenSchema.index({ restaurantId: 1 });

export default models?.ExpoPushToken || model("ExpoPushToken", ExpoPushTokenSchema);
