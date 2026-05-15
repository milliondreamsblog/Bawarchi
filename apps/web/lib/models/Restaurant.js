import pkg from "mongoose";
const { Schema, models, model } = pkg;

const RestaurantSchema = new Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    status: {
        type: String,
        enum: ["pending", "approved", "blocked"],
        default: "pending",
    },
    owner: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String },
    razorpayKeyId: { type: String },
    razorpayKeySecret: { type: String },
    gstPercentage: {
        type: Number,
        default: 0,
        enum: [0, 5, 12, 18],
        required: false
    },
    createdAt: { type: Date, default: Date.now },
});

export default models?.Restaurant || model("Restaurant", RestaurantSchema);
