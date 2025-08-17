import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { socket } from "../../socket"; // ✅ import your socket instance

export default function ChatView({ userId, chatUser, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatId, setChatId] = useState(null);

  useEffect(() => {
    if (!chatUser?._id) return;

    // 1️⃣ Ask server to create/get private chat
    socket.emit("createPrivateChat", { userId, targetUserId: chatUser._id });

    // 2️⃣ Receive chatId + old messages
    socket.on("chatPrivateCreated", ({ chatId, messages }) => {
      setChatId(chatId);
      setMessages(messages);

      // Join room
      socket.emit("joinPrivateRoom", { chatId });
    });

    // 3️⃣ Listen for new incoming messages
    socket.on("newPrivateMessage", ({ chatId, sender, message, createdAt }) => {
      setMessages((prev) => [...prev, { sender, text: message, createdAt }]);
    });

    // Cleanup listeners on unmount
    return () => {
      socket.off("chatPrivateCreated");
      socket.off("newPrivateMessage");
    };
  }, [chatUser, userId]);

  const sendMessage = () => {
    if (!newMessage.trim() || !chatId) return;

    // Send to backend
    socket.emit("sendPrivateMessage", {
      chatId,
      senderId: userId,
      message: newMessage,
    });

    setNewMessage("");
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-lg shadow">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-blue-500 text-white rounded-t-lg">
        <h2 className="font-semibold">
          Chat with {chatUser.firstName} {chatUser.lastName}
        </h2>
        <button
          onClick={onClose}
          className="p-1 cursor-pointer hover:bg-blue-600 rounded"
        >
          <X size={22} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${
              msg.sender === userId ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`px-3 py-2 rounded-xl max-w-[70%] ${
                msg.sender === userId
                  ? "bg-blue-500 text-white rounded-br-none"
                  : "bg-gray-200 text-gray-800 rounded-bl-none"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-3 border-t bg-white flex items-end gap-2">
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 resize-none p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          style={{ minHeight: "40px", maxHeight: "120px" }}
        />
        <button
          onClick={sendMessage}
          className="px-4 cursor-pointer py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
        >
          Send
        </button>
      </div>
    </div>
  );
}
