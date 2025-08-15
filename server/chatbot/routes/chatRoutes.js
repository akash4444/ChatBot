import express from "express";
import {
  getChatHistoryByChatId,
  getChatIdsHistoryByUserId,
} from "../controllers/chatControllers.js";

const router = express.Router();

// GET chat history for a specific user and chat session
router.get("/:userId/:chatId", getChatHistoryByChatId);

router.get("/:userId", getChatIdsHistoryByUserId);

export default router;
