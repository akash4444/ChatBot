import React from "react";

export default function Sidebar({
  chats,
  activeChat,
  setActiveChat,
  startNewChat,
}) {
  return (
    <div className="w-64 bg-white border-r h-screen overflow-auto">
      <div className="p-3 ">
        <button
          className="w-full py-2 cursor-pointer rounded bg-black text-white"
          onClick={startNewChat}
        >
          + New Chat
        </button>
      </div>
      <ul>
        {chats.map((c) => (
          <li
            key={c.chatId}
            onClick={() => setActiveChat(c)}
            className={`px-4 py-3 cursor-pointer border-b hover:bg-gray-50 ${
              activeChat?.chatId === c.chatId ? "bg-gray-100 font-medium" : ""
            }`}
          >
            Chat #{c.chatId}
          </li>
        ))}
        {chats.length === 0 && (
          <li className="px-4 py-3 text-sm text-gray-500">No chats yet</li>
        )}
      </ul>
    </div>
  );
}
