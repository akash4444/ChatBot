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
import Chat from "./models/chatModel.js";
import User from "./models/userModel.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
// REST routes (history)
// --------------------
app.use("/chat", chatRoutes);
app.use("/api", authRoutes);

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
      const chatId = Date.now().toString(); // or use UUID
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
      const userMsg = { sender: "user", message, timestamp: new Date() };

      // Save user message
      await Chat.findOneAndUpdate(
        { userId, chatId },
        { $push: { messages: userMsg } },
        { upsert: true }
      );

      io.to(chatId).emit("newMessage", { chatId, ...userMsg });
      io.to(chatId).emit("botTyping", { chatId });

      // --------------------
      // Gemini AI response
      // --------------------
      let botReplyText = "Sorry, I couldn't generate a response.";
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const aiResult = await model.generateContent(message);
        botReplyText = aiResult.response.text();
      } catch (err) {
        console.error("Gemini AI error:", err);
      }

      const botMsg = {
        sender: "bot",
        message: botReplyText,
        timestamp: new Date(),
      };

      // Save bot message
      await Chat.findOneAndUpdate(
        { userId, chatId },
        { $push: { messages: botMsg } },
        { upsert: true }
      );

      io.to(chatId).emit("newMessage", { chatId, ...botMsg });
      io.to(chatId).emit("botStoppedTyping", { chatId });
    } catch (error) {
      console.error("Error sending message:", error);
      socket.emit("errorEvent", { message: "Failed to send message" });
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
