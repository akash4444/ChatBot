import dotenv from "dotenv";
dotenv.config();

import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";

import connectDB from "./config/db.js";
import chatRoutes from "./routes/chatRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import privateChatRoutes from "./routes/privateChatRoutes.js";
import Chat from "./models/chatModel.js";
import User from "./models/userModel.js";
import PrivateChat from "./models/privateChatModel.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { encryptMessage, decryptMessage } from "./utils/crypto.js";

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
  socket.on("createPrivateChat", async ({ userId, targetUserId }) => {
    try {
      // Always sort members so [A,B] == [B,A]
      const members = [userId, targetUserId].sort();

      // Find or create chat atomically
      let chat = await PrivateChat.findOneAndUpdate(
        { members }, // unique pair
        { $setOnInsert: { members, messages: [] } },
        { upsert: true, new: true }
      );

      console.log(`✅ Private chat ready: ${chat._id}`);

      // Decrypt messages before sending to client
      const decryptedMessages = chat.messages.map((m) => ({
        sender: m.sender,
        text: decryptMessage({
          iv: m.iv,
          content: m.content,
          authTag: m.authTag,
        }),
        createdAt: m.createdAt,
      }));

      // Emit back to creator
      socket.emit("chatPrivateCreated", {
        chatId: chat._id,
        messages: decryptedMessages,
      });
    } catch (error) {
      console.error("Error creating private chat:", error);
      socket.emit("errorEvent", { message: "Failed to create chat" });
    }
  });

  // ✅ Join private chat room
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
      };

      chat.messages.push(msgDoc);
      await chat.save();

      // Broadcast decrypted message to all in room
      io.to(chatId).emit("newPrivateMessage", {
        chatId,
        sender: senderId,
        message, // decrypted plain text
        createdAt: msgDoc.createdAt,
      });

      console.log(`💬 Message in chat ${chatId} from ${senderId}`);
    } catch (err) {
      console.error("Error sending private message:", err);
      socket.emit("errorEvent", { message: "Failed to send private message" });
    }
  });
});

// --------------------
// Start server
// --------------------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
