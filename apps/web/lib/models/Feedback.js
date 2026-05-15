import pkg from "mongoose";
const { Schema, models, model } = pkg;

const FeedbackSchema = new Schema({
  restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
  orderId:      { type: Schema.Types.ObjectId, ref: "Order", required: false },
  tableSlug:    { type: String, required: true },
  rating:       { type: Number, required: true, min: 1, max: 5 },
  text:         { type: String, default: "" },

  // AI-generated sentiment (only present when text is provided)
  sentiment: {
    score:   { type: Number },           // -1.0 to 1.0
    label:   { type: String },           // "positive" | "neutral" | "negative"
    tags:    { type: [String], default: [] }, // e.g. ["food quality", "wait time"]
    summary: { type: String },           // one-line AI summary
  },

  createdAt: { type: Date, default: Date.now },
});

FeedbackSchema.index({ restaurantId: 1, createdAt: -1 });

export default models?.Feedback || model("Feedback", FeedbackSchema);
