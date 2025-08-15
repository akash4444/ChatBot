import React, { useEffect, useState } from "react";
import Header from "./components/Header.jsx";
import Sidebar from "./components/Sidebar.jsx";
import ChatWindow from "./components/ChatWindow.jsx";
import { BACKEND_URL } from "./config/config.js";
import { socket } from "./socket.js";
import { Trash2, Menu } from "lucide-react";

export default function App() {
  const [user] = useState({ name: "John Doe", userId: "1" });
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState({});
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [botTyping, setBotTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar toggle

  const [isOpen, setIsOpen] = useState(false);

  // Fetch chat list on mount
  useEffect(() => {
    const fetchChats = async () => {
      try {
        setLoadingMessages(true);
        const res = await fetch(`${BACKEND_URL}/chat/user/${user.userId}`);
        const data = await res.json();
        const formatted =
          data?.data?.map((chatId) => ({ chatId, messages: [] })) || [];
        setChats(formatted);

        if (formatted.length > 0) setActiveChat(formatted[0]);
      } catch (e) {
        console.error("Failed to fetch chat list:", e);
      } finally {
        setLoadingMessages(false);
      }
    };
    fetchChats();

    // Socket listeners
    socket.on("chatCreated", (newChat) => {
      const chatData = { chatId: newChat.chatId, messages: [] };
      setChats((prev) => [chatData, ...prev]);
      setActiveChat(chatData);
      socket.emit("joinRoom", newChat.chatId);
    });

    socket.on("newMessage", (msg) => {
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

      if (msg.sender === "bot") setBotTyping(false);
    });

    socket.on("botTyping", () => setBotTyping(true));

    return () => {
      socket.off("chatCreated");
      socket.off("newMessage");
      socket.off("botTyping");
    };
  }, [user.userId]);

  // Fetch messages when activeChat changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!activeChat?.chatId) return;
      try {
        setLoadingMessages(true);
        const res = await fetch(
          `${BACKEND_URL}/chat/user/${user.userId}/chat/${activeChat.chatId}`
        );
        const data = await res.json();
        setActiveChat((prev) => ({ ...prev, messages: data?.data || [] }));
        socket.emit("joinRoom", activeChat.chatId);
      } catch (e) {
        console.error("Failed to fetch chat messages:", e);
      } finally {
        setLoadingMessages(false);
      }
    };
    loadMessages();
  }, [activeChat?.chatId, user.userId]);

  // Handlers
  const startNewChat = () => socket.emit("createChat", { userId: user.userId });
  const sendMessage = (chatId, text) => {
    socket.emit("sendMessage", { chatId, userId: user.userId, message: text });
    setBotTyping(true);
  };
  const deleteChat = async (chatId) => {
    try {
      await fetch(`${BACKEND_URL}/chat/user/${user.userId}/chat/${chatId}`, {
        method: "DELETE",
      });
      const remainingChats = chats.filter((c) => c.chatId !== chatId);
      setChats(remainingChats);
      if (activeChat?.chatId === chatId) {
        setActiveChat(remainingChats.length > 0 ? remainingChats[0] : {});
      }
    } catch (error) {
      console.error("Failed to delete chat:", error);
    }
  };
  const clearAllChats = async () => {
    try {
      await fetch(`${BACKEND_URL}/chat/user/${user.userId}`, {
        method: "DELETE",
      });
      setChats([]);
      setActiveChat({});
    } catch (error) {
      console.error("Failed to clear chats:", error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        chats={chats}
        activeChat={activeChat}
        setActiveChat={setActiveChat}
        startNewChat={startNewChat}
        deleteChat={deleteChat}
        clearChats={clearAllChats}
        isOpen={sidebarOpen || isOpen}
        setIsOpen={setSidebarOpen}
        setIsOpenset={setIsOpen} // Pass toggle to sidebar
      />

      {/* Main Area */}
      <div className="flex flex-col flex-1">
        <Header
          user={user}
          setIsOpen={setIsOpen}
          isOpen={isOpen}
          onLogout={() => console.log("Logout clicked")}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} // Optional toggle for mobile
        />
        <div className="flex-1 overflow-auto">
          <ChatWindow
            activeChat={activeChat}
            onSend={sendMessage}
            loadingMessages={loadingMessages}
            botTyping={botTyping}
          />
        </div>
      </div>
    </div>
  );
}
