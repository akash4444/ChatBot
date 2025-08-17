import PrivateChat from "../models/privateChatModel.js";
import User from "../models/userModel.js";
import { encryptMessage, decryptMessage } from "../utils/crypto.js";

// REST: fetch all messages (decrypted)
export const getPrivateMessages = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await PrivateChat.findById(chatId).populate(
      "members",
      "firstName lastName"
    );
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    const decryptedMessages = chat.messages.map((msg) => ({
      sender: msg.sender,
      text: decryptMessage({
        iv: msg.iv,
        content: msg.content,
        authTag: msg.authTag,
      }),
      createdAt: msg.createdAt,
    }));

    res.json({ data: decryptedMessages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    // Get current user with their following list
    const currentUser = await User.findById(req.user._id).select("following");

    // Get all other users
    const users = await User.find({ _id: { $ne: req.user._id } }).select(
      "firstName lastName email"
    );

    // Attach follow/unfollow status
    const usersWithStatus = users.map((u) => ({
      _id: u._id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      isFollowing: currentUser.following.includes(u._id), // 👈 true/false
    }));

    res.json({ data: usersWithStatus });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate(
      "following",
      "firstName lastName email"
    );
    res.json({ data: user.following });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3️⃣ Follow user
export const followUser = async (req, res) => {
  try {
    const { targetId } = req.body;

    if (req.user._id.toString() === targetId.toString()) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const user = await User.findById(req.user._id);
    const targetUser = await User.findById(targetId);

    if (!user || !targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Add target to current user's following list
    if (!user.following.includes(targetId)) {
      user.following.push(targetId);
      await user.save();
    }

    // Add current user to target's followers list
    if (!targetUser.followers.includes(req.user._id)) {
      targetUser.followers.push(req.user._id);
      await targetUser.save();
    }

    res.status(200).json({ message: "Followed successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 4️⃣ Unfollow user
export const unfollowUser = async (req, res) => {
  try {
    const { targetId } = req.body;

    const user = await User.findById(req.user._id);
    const targetUser = await User.findById(targetId);

    if (!user || !targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove target from current user's following list
    user.following = user.following.filter(
      (id) => id.toString() !== targetId.toString()
    );
    await user.save();

    // Remove current user from target's followers list
    targetUser.followers = targetUser.followers.filter(
      (id) => id.toString() !== req.user._id.toString()
    );
    await targetUser.save();

    res.status(200).json({ message: "Unfollowed successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
