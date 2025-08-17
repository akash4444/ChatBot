import React, { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { socket } from "../../socket";

export default function ChatView({ userId, chatUser, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatId, setChatId] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!chatUser?._id) return;

    socket.emit("createPrivateChat", { userId, targetUserId: chatUser._id });

    socket.on("chatPrivateCreated", ({ chatId, messages }) => {
      setChatId(chatId);
      setMessages(messages);
      socket.emit("joinPrivateRoom", { chatId });
    });

    socket.on("newPrivateMessage", ({ chatId, sender, message, createdAt }) => {
      setMessages((prev) => [...prev, { sender, text: message, createdAt }]);
    });

    return () => {
      socket.off("chatPrivateCreated");
      socket.off("newPrivateMessage");
    };
  }, [chatUser, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim() || !chatId) return;
    socket.emit("sendPrivateMessage", {
      chatId,
      senderId: userId,
      message: newMessage,
    });
    setNewMessage("");
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-blue-500 text-white shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg font-semibold">
            {chatUser.firstName[0]}
          </div>
          <div>
            <h2 className="font-semibold text-lg">
              {chatUser.firstName} {chatUser.lastName}
            </h2>
            <p className="text-xs text-blue-100">{chatUser.email}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 cursor-pointer rounded-lg hover:bg-blue-600 transition"
        >
          <X size={22} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg, idx) => {
          const isSender = msg.sender === userId;
          return (
            <div
              key={idx}
              className={`flex flex-col ${
                isSender ? "items-end" : "items-start"
              }`}
            >
              {/* Bubble */}
              <div
                className={`px-4 py-2 rounded-2xl max-w-[70%] shadow-sm ${
                  isSender
                    ? "bg-blue-500 text-white rounded-br-none"
                    : "bg-gray-200 text-gray-800 rounded-bl-none"
                }`}
              >
                {msg.text}
              </div>
              {/* Time below */}
              <span
                className={`text-xs mt-1 ${
                  isSender ? "text-gray-400 pr-1" : "text-gray-500 pl-1"
                }`}
              >
                {new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t bg-white flex items-center gap-2">
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 resize-none p-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50"
          style={{ minHeight: "40px", maxHeight: "120px" }}
        />
        <button
          onClick={sendMessage}
          className="px-4 cursor-pointer py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition font-medium"
        >
          Send
        </button>
      </div>
    </div>
  );
}
