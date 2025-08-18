import dotenv from "dotenv";
dotenv.config();

import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import mongoose from "mongoose";

import connectDB from "./config/db.js";
import chatRoutes from "./routes/chatRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import privateChatRoutes from "./routes/privateChatRoutes.js";
import Chat from "./models/chatModel.js";
import User from "./models/userModel.js";
import PrivateChat from "./models/privateChatModel.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { encryptMessage, decryptMessage } from "./utils/crypto.js";
import { text } from "stream/consumers";

// --------------------
// Global error handlers
// --------------------
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

// --------------------
// Initialize Gemini client
// --------------------
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --------------------
// Express + Middleware
// --------------------
const app = express();
const allowedOrigins = process.env.CORS_ORIGIN?.split(",") || [];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());

// --------------------
// Connect to MongoDB
// --------------------
connectDB();

// --------------------
// REST routes
// --------------------
app.use("/chat", chatRoutes);
app.use("/api", authRoutes);
app.use("/private", privateChatRoutes);

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// --------------------
// HTTP + Socket.IO Server
// --------------------
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

// --------------------
// Socket.IO handlers
// --------------------
io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  // Keep alive ping
  const pingInterval = setInterval(() => {
    socket.emit("ping");
  }, 25000);

  socket.on("disconnect", () => {
    clearInterval(pingInterval);
    console.log("❌ Client disconnected:", socket.id);
  });

  // Create chat
  socket.on("createChat", async ({ userId }) => {
    try {
      const chatId = Date.now().toString();
      await Chat.create({ userId, chatId, messages: [] });
      socket.emit("chatCreated", { chatId, messages: [] });
      console.log(`🆕 Chat created: ${chatId} for user ${userId}`);
    } catch (error) {
      console.error("Error creating chat:", error);
      socket.emit("errorEvent", { message: "Failed to create chat" });
    }
  });

  // Join room
  socket.on("joinRoom", (chatId) => {
    socket.join(chatId);
    console.log(`📌 ${socket.id} joined room ${chatId}`);
  });

  // Send message
  socket.on("sendMessage", async ({ chatId, userId, message }) => {
    try {
      // Encrypt before saving
      const encryptedMsg = encryptMessage(message);
      const userMsg = {
        sender: "user",
        message: encryptedMsg,
        timestamp: new Date(),
      };

      await Chat.findOneAndUpdate(
        { userId, chatId },
        { $push: { messages: userMsg } },
        { upsert: true }
      );

      // Emit decrypted message back to client
      io.to(chatId).emit("newMessage", {
        chatId,
        sender: "user",
        message,
        timestamp: userMsg.timestamp,
      });

      io.to(chatId).emit("botTyping", { chatId });

      // Gemini AI response
      let botReplyText = "Sorry, I couldn't generate a response.";
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const aiResult = await model.generateContent(message);
        botReplyText = aiResult.response.text();
      } catch (err) {
        console.error("Gemini AI error:", err);
      }

      // Encrypt bot reply before saving
      const encryptedBotMsg = encryptMessage(botReplyText);
      const botMsg = {
        sender: "bot",
        message: encryptedBotMsg,
        timestamp: new Date(),
      };

      await Chat.findOneAndUpdate(
        { userId, chatId },
        { $push: { messages: botMsg } },
        { upsert: true }
      );

      io.to(chatId).emit("newMessage", {
        chatId,
        sender: "bot",
        message: botReplyText,
        timestamp: botMsg.timestamp,
      });

      io.to(chatId).emit("botStoppedTyping", { chatId });
    } catch (error) {
      console.error("Error sending message:", error);
      socket.emit("errorEvent", { message: "Failed to send message" });
    }
  });

  /////////////////////// pRivate chat //////

  // ✅ Create or fetch private chat

  // ✅ Create or get private chat
  socket.on("createPrivateChat", async ({ userId, targetUserId }) => {
    try {
      const members = [userId, targetUserId].sort();

      let chat = await PrivateChat.findOneAndUpdate(
        { members },
        { $setOnInsert: { members, messages: [] } },
        { upsert: true, new: true }
      );

      console.log(`✅ Private chat ready: ${chat._id}`);

      const decryptedMessages = chat.messages.map((m) => ({
        _id: m._id,
        sender: m.sender,
        text: decryptMessage({
          iv: m.iv,
          content: m.content,
          authTag: m.authTag,
        }),
        createdAt: m.createdAt,
        seen: m.seen,
        reactions: m.reactions,
        replies: m.replies.map((r) => ({
          _id: r._id,
          text: decryptMessage({
            iv: r.iv,
            content: r.content,
            authTag: r.authTag,
          }),
          createdAt: r.createdAt,
          reactions: r.reactions,
          sender: r.sender,
        })),
      }));

      socket.emit("chatPrivateCreated", {
        chatId: chat._id,
        messages: decryptedMessages,
      });
    } catch (error) {
      console.error("Error creating private chat:", error);
      socket.emit("errorEvent", { message: "Failed to create chat" });
    }
  });

  io.on("connection", (socket) => {
    console.log(`🔌 ${socket.id} connected`);

    // Rejoin all rooms after reconnect
    socket.on("reconnectChatRooms", async ({ chatIds }) => {
      chatIds.forEach((chatId) => socket.join(chatId));
      console.log(`🔄 ${socket.id} rejoined rooms: ${chatIds}`);
    });
  });

  // ✅ Join private room
  socket.on("joinPrivateRoom", ({ chatId }) => {
    socket.join(chatId);
    console.log(`🔒 ${socket.id} joined private chat room ${chatId}`);
  });

  // ✅ Send private message
  socket.on("sendPrivateMessage", async ({ chatId, senderId, message }) => {
    try {
      const encrypted = encryptMessage(message);

      const chat = await PrivateChat.findById(chatId);
      if (!chat) {
        socket.emit("errorEvent", { message: "Private chat not found" });
        return;
      }

      const msgDoc = {
        sender: senderId,
        iv: encrypted.iv,
        content: encrypted.content,
        authTag: encrypted.authTag,
        createdAt: new Date(),
        seen: false,
        reactions: [],
      };

      chat.messages.push(msgDoc);
      await chat.save();

      const savedMessage = chat.messages[chat.messages.length - 1];

      const decryptedMessage = {
        _id: savedMessage._id,
        sender: savedMessage.sender,
        text: message,
        createdAt: savedMessage.createdAt,
        seen: savedMessage.seen,
        reactions: savedMessage.reactions,
      };

      io.to(chatId).emit("newPrivateMessage", {
        chatId,
        ...decryptedMessage,
      });

      console.log(`💬 Message in chat ${chatId} from ${senderId}`);
    } catch (err) {
      console.error("Error sending private message:", err);
      socket.emit("errorEvent", {
        message: "Failed to send private message",
      });
    }
  });

  // ✅ Typing indicator
  socket.on("typing", ({ chatId, userId }) => {
    socket.to(chatId).emit("userTyping", { chatId, userId });
  });

  socket.on("stopTyping", ({ chatId, userId }) => {
    socket.to(chatId).emit("userStoppedTyping", { chatId, userId });
  });

  // ✅ Mark as seen
  socket.on("markAsSeen", async ({ chatId, userId }) => {
    try {
      const chat = await PrivateChat.findById(chatId);
      if (!chat) return;

      chat.messages = chat.messages.map((m) =>
        m.sender.toString() !== userId.toString() && !m.seen
          ? { ...m.toObject(), seen: true, seenAt: new Date() }
          : m
      );

      await chat.save();

      io.to(chatId).emit("messagesSeen", {
        chatId,
        seenBy: userId,
        messages: chat.messages.map((m) => ({
          _id: m._id,
          sender: m.sender,
          createdAt: m.createdAt,
          seen: m.seen,
          reactions: m.reactions,
          text: decryptMessage({
            iv: m.iv,
            content: m.content,
            authTag: m.authTag,
          }),
          replies: m.replies.map((r) => ({
            _id: r._id,
            text: decryptMessage({
              iv: r.iv,
              content: r.content,
              authTag: r.authTag,
            }),
            createdAt: r.createdAt,
            reactions: r.reactions,
            sender: r.sender,
          })),
        })),
      });

      console.log(`👀 Messages in chat ${chatId} seen by ${userId}`);
    } catch (err) {
      console.error("Error marking messages as seen:", err);
      socket.emit("errorEvent", {
        message: "Failed to mark messages as seen",
      });
    }
  });

  // ✅ Add / update reaction
  socket.on(
    "addMessageReaction",
    async ({ chatId, messageId, userId, emoji }) => {
      try {
        const chat = await PrivateChat.findById(chatId);
        if (!chat) return;

        const message = chat.messages.id(messageId);
        if (!message) return;

        // Remove previous reaction from same user
        message.reactions = message.reactions.filter(
          (r) => r.userId.toString() !== userId.toString()
        );

        // Add new reaction
        message.reactions.push({
          userId: new mongoose.Types.ObjectId(userId),
          emoji,
        });

        await chat.save();

        io.to(chatId).emit("messageReactionUpdated", {
          chatId,
          messageId,
          reactions: message.reactions,
        });
      } catch (err) {
        console.error("Error adding reaction:", err);
        socket.emit("errorEvent", { message: "Failed to add reaction" });
      }
    }
  );

  // Socket handler for adding a reply
  socket.on(
    "addMessageReply",
    async ({ chatId, messageId, userId, replyText }) => {
      try {
        if (!replyText?.trim()) return;

        const chat = await PrivateChat.findById(chatId);
        if (!chat) return;

        const message = chat.messages.id(messageId);
        if (!message) return;

        // Make sure replies array exists
        if (!message.replies) message.replies = [];

        // Encrypt reply
        const { iv, content, authTag } = encryptMessage(replyText);

        // Push reply
        message.replies.push({
          sender: new mongoose.Types.ObjectId(userId),
          content,
          iv,
          authTag,
          createdAt: new Date(),
          reactions: [],
        });

        await chat.save();

        // Send decrypted replies
        io.to(chatId).emit("messageReplyUpdated", {
          chatId,
          messageId,
          replies: message.replies.map((r) => ({
            _id: r._id,
            sender: r.sender,
            text: decryptMessage({
              iv: r.iv,
              content: r.content,
              authTag: r.authTag,
            }),
            createdAt: r.createdAt,
            reactions: r.reactions,
          })),
        });
      } catch (err) {
        console.error("Error adding reply:", err);
        socket.emit("errorEvent", { message: "Failed to add reply" });
      }
    }
  );

  socket.on(
    "addReplyReaction",
    async ({ chatId, messageId, replyId, userId, emoji }) => {
      try {
        const chat = await PrivateChat.findById(chatId);
        if (!chat) return;

        const message = chat.messages.id(messageId);
        if (!message || !message.replies) return;

        const reply = message.replies.id(replyId);
        if (!reply) return;

        // Remove previous reaction from same user
        reply.reactions = reply.reactions.filter(
          (r) => r.userId.toString() !== userId.toString()
        );

        // Add new reaction
        reply.reactions.push({
          userId: new mongoose.Types.ObjectId(userId),
          emoji,
        });

        await chat.save();

        io.to(chatId).emit("replyReactionUpdated", {
          chatId,
          messageId,
          replyId,
          reactions: reply.reactions,
        });
      } catch (err) {
        console.error("Error updating reply reaction:", err);
        socket.emit("errorEvent", {
          message: "Failed to update reply reaction",
        });
      }
    }
  );
});

// --------------------
// Start server
// --------------------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
