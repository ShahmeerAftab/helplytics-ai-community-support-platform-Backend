import mongoose from "mongoose";

const requestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, default: "General" },
    tags: { type: [String], default: [] },
    helpers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    responses: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    status: {
      type: String,
      enum: ["open", " in_progress", "solved"],
      default: "open",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Request", requestSchema);
