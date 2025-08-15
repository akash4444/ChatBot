import React from "react";

export default function Sidebar({
  chats,
  setActiveChat,
  startNewChat,
  activeChat,
}) {
  return (
    <aside className="w-64 bg-white border-r p-4 flex-shrink-0 flex flex-col sticky top-0 h-screen overflow-auto">
      <button
        onClick={startNewChat}
        className="bg-blue-500 text-white py-2 px-3 rounded mb-4 hover:bg-blue-600"
      >
        + New Chat
      </button>
      <h2 className="text-lg font-semibold mb-2">History</h2>
      <ul className="flex-1">
        {chats.length === 0 && <li className="text-gray-500">No chats yet</li>}
        {chats.map((chat) => (
          <li
            key={chat.chatId}
            onClick={() => setActiveChat(chat)}
            className={`p-2 rounded mb-1 cursor-pointer ${
              chat.chatId === activeChat?.chatId
                ? "bg-gray-200"
                : "hover:bg-gray-100"
            }`}
          >
            {chat.chatId.toString().slice(-4)}
          </li>
        ))}
      </ul>
    </aside>
  );
}
