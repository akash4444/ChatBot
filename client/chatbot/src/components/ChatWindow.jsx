import React, { useState, useRef, useEffect } from "react";

export default function ChatWindow({ activeChat, addMessage }) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => scrollToBottom(), [activeChat]);

  const handleSend = () => {
    if (!input.trim() || !activeChat) return;

    // Use activeChat.id (not chatId)
    addMessage(activeChat.id, input, "user");

    // Simulate bot response
    setTimeout(() => {
      addMessage(activeChat.id, `Bot reply to: "${input}"`, "bot");
    }, 500);

    setInput("");
  };

  if (!activeChat) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        Start a new chat
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="flex-1 p-4 overflow-y-auto flex flex-col space-y-3">
        {activeChat?.messages?.map((msg) => (
          <div
            key={msg._id}
            className={`flex ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`p-3 rounded-lg max-w-[70%] break-words ${
                msg.sender === "user"
                  ? "bg-blue-500 text-white rounded-br-none"
                  : "bg-gray-200 text-gray-900 rounded-bl-none"
              }`}
            >
              {msg.message}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t bg-white flex items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 p-2 border rounded-l-md focus:outline-none focus:ring focus:border-blue-300"
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button
          onClick={handleSend}
          className="ml-2 bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600"
        >
          Send
        </button>
      </div>
    </div>
  );
}
