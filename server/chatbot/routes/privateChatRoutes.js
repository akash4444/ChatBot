import express from "express";
import { authMiddleware } from "../middlewares/authMiddlewares.js";
import {
  getAllUsers,
  getPrivateMessages,
  unfollowUser,
  followUser,
  getFollowing,
} from "../controllers/privateChatController.js";

const router = express.Router();

router.post("/private-chat/chat/:chatId", authMiddleware, getPrivateMessages);

router.get("/private-chat/userlist/:userId", authMiddleware, getAllUsers);

router.get("/private-chat/:userId/following", authMiddleware, getFollowing);
router.post("/private-chat/:userId/follow", authMiddleware, followUser);
router.post("/private-chat/:userId/unfollow", authMiddleware, unfollowUser);

export default router;
