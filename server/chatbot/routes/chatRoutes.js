import express from "express";
import Chat from "../models/chatModel.js";

const router = express.Router();

// ✅ 1. Clear all chats for a user (more specific route first)
router.delete("/user/:userId", async (req, res) => {
  try {
    const result = await Chat.deleteMany({ userId: req.params.userId });
    res.json({ message: `Deleted ${result.deletedCount} chats` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ 2. Get all chat IDs for a user
router.get("/user/:userId", async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.params.userId }).select(
      "chatId -_id"
    );
    res.json({ data: chats.map((c) => c.chatId) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ 3. Get messages for a specific chat
router.get("/user/:userId/chat/:chatId", async (req, res) => {
  try {
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

// ✅ 4. Delete a specific chat
router.delete("/user/:userId/chat/:chatId", async (req, res) => {
  try {
    const deleted = await Chat.findOneAndDelete({
      userId: req.params.userId,
      chatId: req.params.chatId,
    });
    if (!deleted) return res.status(404).json({ message: "Chat not found" });
    res.json({ message: "Chat deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
