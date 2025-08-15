import React from "react";
import { Trash2 } from "lucide-react"; // npm install lucide-react

export default function Sidebar({
  chats,
  activeChat,
  setActiveChat,
  startNewChat,
  clearChats,
  deleteChat,
}) {
  return (
    <div className="w-64 bg-white border-r h-screen flex flex-col">
      {/* Sticky Top */}
      <div className="p-3 sticky top-0 bg-white border-b z-10">
        <button
          className="w-full py-2 cursor-pointer rounded bg-black text-white hover:bg-gray-800"
          onClick={startNewChat}
        >
          + New Chat
        </button>
      </div>

      {/* Scrollable Middle */}
      <ul className="flex-1 overflow-auto">
        {chats.map((c) => (
          <li
            key={c.chatId}
            className={`group flex items-center justify-between px-4 py-3 cursor-pointer border-b hover:bg-gray-50 ${
              activeChat?.chatId === c.chatId ? "bg-gray-100 font-medium" : ""
            }`}
          >
            {/* Chat Name */}
            <span onClick={() => setActiveChat(c)} className="truncate flex-1">
              Chat #{c.chatId}
            </span>

            {/* Delete Button - shown only on hover */}
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent opening chat on delete click
                deleteChat(c.chatId);
              }}
              className="opacity-0 cursor-pointer group-hover:opacity-100 text-gray-400 hover:text-red-500 transition"
            >
              <Trash2 size={16} />
            </button>
          </li>
        ))}
        {chats.length === 0 && (
          <li className="px-4 py-3 text-sm text-gray-500">No chats yet</li>
        )}
      </ul>

      {/* Sticky Bottom */}
      {chats?.length > 0 && (
        <div className="p-3 sticky bottom-0 bg-white border-t z-10">
          <button
            className="w-full py-2 cursor-pointer rounded bg-red-500 text-white hover:bg-red-600"
            onClick={clearChats}
          >
            Clear Chats
          </button>
        </div>
      )}
    </div>
  );
}
