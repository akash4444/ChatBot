import express from "express";
import Chat from "../models/chatModel.js";
import { authMiddleware } from "../middlewares/authMiddlewares.js";

const router = express.Router();

// 1️⃣ Clear all chats for a user
router.delete("/user/:userId", authMiddleware, async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.userId)
      return res.status(403).json({ message: "Forbidden" });

    const result = await Chat.deleteMany({ userId: req.params.userId });
    res.json({ message: `Deleted ${result.deletedCount} chats` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2️⃣ Get all chat IDs for a user
router.get("/user/:userId", authMiddleware, async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.userId)
      return res.status(403).json({ message: "Forbidden" });

    const chats = await Chat.find({ userId: req.params.userId }).select(
      "chatId -_id"
    );
    res.json({ data: chats.map((c) => c.chatId) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 3️⃣ Get messages for a specific chat
router.get("/user/:userId/chat/:chatId", authMiddleware, async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.userId)
      return res.status(403).json({ message: "Forbidden" });

    const chat = await Chat.findOne({
      userId: req.params.userId,
      chatId: req.params.chatId,
    });

    if (!chat) return res.status(404).json({ message: "Chat not found" });

    res.json({ data: chat.messages });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 4️⃣ Delete a specific chat
router.delete(
  "/user/:userId/chat/:chatId",
  authMiddleware,
  async (req, res) => {
    try {
      if (req.user._id.toString() !== req.params.userId)
        return res.status(403).json({ message: "Forbidden" });

      const deleted = await Chat.findOneAndDelete({
        userId: req.params.userId,
        chatId: req.params.chatId,
      });

      if (!deleted) return res.status(404).json({ message: "Chat not found" });

      res.json({ message: "Chat deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

export default router;
