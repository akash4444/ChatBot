import React, { useEffect, useState } from "react";
import Header from "./components/Header.jsx";
import Sidebar from "./components/Sidebar.jsx";
import ChatWindow from "./components/ChatWindow.jsx";
import { BACKEND_URL } from "./config/config.js";
import { socket } from "./socket.js";

export default function App() {
  const [user] = useState({ name: "John Doe", userId: "1" });
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState({});
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [botTyping, setBotTyping] = useState(false);

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

        // Set the latest chat active
        if (formatted.length > 0) {
          setActiveChat(formatted[0]);
        }
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
      setActiveChat(chatData); // new chat is active
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

  // Fetch messages whenever activeChat changes
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

  // Create new chat
  const startNewChat = () => socket.emit("createChat", { userId: user.userId });

  // Send message
  const sendMessage = (chatId, text) => {
    socket.emit("sendMessage", { chatId, userId: user.userId, message: text });
    setBotTyping(true);
  };

  // Delete single chat
  const deleteChat = async (chatId) => {
    try {
      await fetch(`${BACKEND_URL}/chat/user/${user.userId}/chat/${chatId}`, {
        method: "DELETE",
      });
      const remainingChats = chats.filter((c) => c.chatId !== chatId);
      setChats(remainingChats);

      // Set new active chat if deleted chat was active
      if (activeChat?.chatId === chatId) {
        setActiveChat(remainingChats.length > 0 ? remainingChats[0] : {});
      }
    } catch (error) {
      console.error("Failed to delete chat:", error);
    }
  };

  // Clear all chats
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
      <Sidebar
        chats={chats}
        activeChat={activeChat}
        setActiveChat={setActiveChat}
        startNewChat={startNewChat}
        deleteChat={deleteChat}
        clearChats={clearAllChats}
      />
      <div className="flex flex-col flex-1">
        <Header user={user} onLogout={() => console.log("Logout clicked")} />
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
