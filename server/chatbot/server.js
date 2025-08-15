import dotenv from "dotenv";
dotenv.config();

import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import chatRoutes from "./routes/chatRoutes.js";
import Chat from "./models/chatModel.js";

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN, // your frontend URL
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());

// Connect to MongoDB
connectDB();

// REST routes (for history)
app.use("/chat", chatRoutes);

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Create HTTP + Socket server
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(",") || "*",
    methods: ["GET", "POST"],
  },
});

// ---- Socket handlers ----
io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  // Create new chat (returns id)
  socket.on("createChat", async ({ userId }) => {
    try {
      const chatId = Date.now().toString(); // swap with uuid if you prefer
      await Chat.create({ userId, chatId, messages: [] });
      socket.emit("chatCreated", { chatId, messages: [] });
      console.log(`🆕 Chat created: ${chatId} for user ${userId}`);
    } catch (error) {
      console.error("Error creating chat:", error);
      socket.emit("errorEvent", { message: "Failed to create chat" });
    }
  });

  // Join a room for broadcasting
  socket.on("joinRoom", (chatId) => {
    socket.join(chatId);
    console.log(`📌 ${socket.id} joined room ${chatId}`);
  });

  // Handle sending a message and return a static bot response
  socket.on("sendMessage", async ({ chatId, userId, message }) => {
    try {
      const userMsg = { sender: "user", message, timestamp: new Date() };

      // Ensure chat exists and push user message
      await Chat.findOneAndUpdate(
        { userId, chatId },
        { $push: { messages: userMsg } },
        { upsert: true }
      );

      // Emit user message to the room
      io.to(chatId).emit("newMessage", { chatId, ...userMsg });

      // Create static bot reply
      const botReplyText = "This is a static bot reply.";
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

      // Emit bot message to the room
      io.to(chatId).emit("newMessage", { chatId, ...botMsg });
    } catch (error) {
      console.error("Error sending message:", error);
      socket.emit("errorEvent", { message: "Failed to send message" });
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
