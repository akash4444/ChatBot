import mongoose from "mongoose";

const privateChatSchema = new mongoose.Schema({
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  messages: [
    {
      sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      iv: String,
      content: String,
      authTag: String,
      createdAt: { type: Date, default: Date.now },
      seen: { type: Boolean, default: false },
      seenAt: { type: Date },
      reactions: [
        {
          userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          emoji: { type: String },
        },
      ],
    },
  ],
});

export default mongoose.model("PrivateChat", privateChatSchema);
