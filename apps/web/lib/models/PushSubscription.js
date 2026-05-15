import pkg from "mongoose";
const { Schema, models, model } = pkg;

const PushSubscriptionSchema = new Schema({
  restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
  subscription: {
    endpoint: { type: String, required: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
  },
  userAgent: { type: String },
  createdAt: { type: Date, default: Date.now },
});

PushSubscriptionSchema.index({ restaurantId: 1 });
PushSubscriptionSchema.index({ "subscription.endpoint": 1 }, { unique: true });

export default models?.PushSubscription || model("PushSubscription", PushSubscriptionSchema);
