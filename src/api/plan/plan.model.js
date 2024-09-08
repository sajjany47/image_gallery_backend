import mongoose from "mongoose";

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      enum: ["Bronze", "Silver", "Gold"],
    },
    price: String,
    description: String,
    features: {
      type: [String],
    },
  },
  {
    timestamps: true,
  }
);

const plan = mongoose.model("plan", planSchema);

export default plan;
