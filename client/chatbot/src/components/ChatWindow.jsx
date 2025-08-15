import React, { useEffect, useRef, useState } from "react";

export default function ChatWindow({ activeChat, onSend }) {
  const [input, setInput] = useState("");
  const endRef = useRef(null);

  const handleSend = () => {
    if (!input.trim() || !activeChat?.chatId) return;
    onSend(activeChat.chatId, input.trim());
    setInput("");
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages?.length, activeChat?.chatId]);

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b bg-white">
        <h2 className="font-semibold">
          {activeChat?.chatId
            ? `Chat #${activeChat.chatId}`
            : "Select or create a chat"}
        </h2>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3">
        {(activeChat?.messages || []).map((m, idx) => (
          <div
            key={idx}
            className={`max-w-[70%] p-2 rounded ${
              m.sender === "user" ? "ml-auto bg-blue-100" : "bg-gray-200"
            }`}
          >
            <div className="text-xs text-gray-500 mb-1">{m.sender}</div>
            <div>{m.message}</div>
            <div className="text-[10px] text-gray-400 mt-1">
              {new Date(m.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="p-3 bg-white border-t flex gap-2">
        <input
          className="flex-1 border rounded px-3 py-2"
          placeholder="Type your message…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={!activeChat?.chatId}
        />
        <button
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
          onClick={handleSend}
          disabled={!activeChat?.chatId}
        >
          Send
        </button>
      </div>
    </div>
  );
}
