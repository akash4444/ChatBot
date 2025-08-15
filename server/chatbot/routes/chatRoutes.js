import express from "express";
import Chat from "../models/chatModel.js";

const router = express.Router();

// Get all chat IDs for a user
router.get("/:userId", async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.params.userId }).select(
      "chatId -_id"
    );
    res.json({ data: chats.map((c) => c.chatId) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get messages for a chat
router.get("/:userId/:chatId", async (req, res) => {
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

export default router;
