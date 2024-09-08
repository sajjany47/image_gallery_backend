import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: String,
    username: String,
    password: String,
    email: { type: String, trim: true, lowercase: true },
    subscription: mongoose.Schema.Types.ObjectId,
  },
  {
    timestamps: true,
  }
);

const user = mongoose.model("user", userSchema);

export default user;
