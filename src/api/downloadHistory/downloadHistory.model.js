import mongoose from "mongoose";

const downloadHistorySchema = new mongoose.Schema(
  {
    userId: mongoose.Schema.Types.ObjectId,
    productId: mongoose.Schema.Types.ObjectId,
    date: Date,
  },
  {
    timestamps: true,
  }
);

const history = mongoose.model("downloadHistory", downloadHistorySchema);

export default history;
