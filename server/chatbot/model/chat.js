import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  sender: { type: String, enum: ["user", "bot"], required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const chatSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    chatId: { type: String, required: true },
    messages: [messageSchema],
  },
  { timestamps: true } // adds createdAt and updatedAt
);

// Compound index for faster queries per user & chat session
chatSchema.index({ userId: 1, chatId: 1 }, { unique: true });

export default mongoose.model("Chats", chatSchema);
