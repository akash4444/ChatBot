import React, { useEffect, useState } from "react";
import Header from "./components/Header.jsx";
import Sidebar from "./components/Sidebar.jsx";
import ChatWindow from "./components/ChatWindow.jsx";
import { BACKEND_URL } from "./config/config.js";
import { socket } from "./socket.js";

export default function App() {
  const [user] = useState({ name: "John Doe", userId: "1" });
  const [chats, setChats] = useState([]); // [{chatId, messages: []}]
  const [activeChat, setActiveChat] = useState({}); // {chatId, messages: []}

  // Initial: fetch chat list, register socket listeners
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/chat/${user.userId}`);
        const data = await res.json();
        const formatted =
          data?.data?.map((chatId) => ({ chatId, messages: [] })) || [];
        setChats(formatted);
        if (formatted.length > 0) setActiveChat(formatted[0]);
      } catch (e) {
        console.error("Failed to fetch chat list:", e);
      }
    })();

    // socket listeners
    socket.on("chatCreated", (newChat) => {
      setChats((prev) => [newChat, ...prev]);
      setActiveChat(newChat);
      socket.emit("joinRoom", newChat.chatId);
    });

    socket.on("newMessage", (msg) => {
      // msg: { chatId, sender, message, timestamp }
      setChats((prev) =>
        prev.map((c) =>
          c.chatId === msg.chatId ? { ...c, messages: [...c.messages, msg] } : c
        )
      );
      setActiveChat((prev) =>
        prev?.chatId === msg.chatId
          ? { ...prev, messages: [...(prev.messages || []), msg] }
          : prev
      );
    });

    return () => {
      socket.off("chatCreated");
      socket.off("newMessage");
    };
  }, []);

  // Load messages when switching chats
  useEffect(() => {
    const load = async () => {
      if (!activeChat?.chatId) return;
      try {
        const res = await fetch(
          `${BACKEND_URL}/chat/${user.userId}/${activeChat.chatId}`
        );
        const data = await res.json();
        const messages = data?.data || [];
        setActiveChat((prev) => ({ ...prev, messages }));
        socket.emit("joinRoom", activeChat.chatId);
      } catch (e) {
        console.error("Failed to fetch chat messages:", e);
      }
    };
    load();
  }, [activeChat?.chatId]);

  const startNewChat = () => {
    socket.emit("createChat", { userId: user.userId });
  };

  const sendMessage = (chatId, text) => {
    socket.emit("sendMessage", { chatId, userId: user.userId, message: text });
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar
        chats={chats}
        activeChat={activeChat}
        setActiveChat={setActiveChat}
        startNewChat={startNewChat}
      />
      <div className="flex flex-col flex-1">
        <Header user={user} onLogout={() => console.log("Logout clicked")} />
        <div className="flex-1 overflow-auto">
          <ChatWindow activeChat={activeChat} onSend={sendMessage} />
        </div>
      </div>
    </div>
  );
}
