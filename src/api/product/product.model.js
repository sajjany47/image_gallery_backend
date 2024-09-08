import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: String,
    type: { type: String, enum: ["free", "premium"] },
    url: String,
  },
  {
    timestamps: true,
  }
);

const product = mongoose.model("product", productSchema);

export default product;
