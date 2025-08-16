import React, { useEffect, useState } from "react";
import axios from "axios";
import Header from "./components/Header.jsx";
import Sidebar from "./components/Sidebar.jsx";
import ChatWindow from "./components/ChatWindow.jsx";
import { BACKEND_URL } from "./config/config.js";
import { socket } from "./socket.js";
import { useNavigate } from "react-router-dom";
import SessionModal from "./components/SessionModal.jsx";

export default function App() {
  const [user, setUser] = useState({
    firstName: localStorage.getItem("firstName") || "",
    lastName: localStorage.getItem("lastName") || "",
    userId: localStorage.getItem("userId") || "",
  });
  const navigate = useNavigate();
  const [showSessionModal, setShowSessionModal] = useState(false);

  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState({});
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [botTyping, setBotTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const token = localStorage.getItem("token");

  // Axios instance with token
  const axiosInstance = axios.create({
    baseURL: BACKEND_URL,
    headers: { Authorization: `Bearer ${token}` },
  });

  // -----------------------
  // Axios interceptor for 401
  // -----------------------
  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response && error.response.status === 401) {
        // Token invalid or expired → logout
        setShowSessionModal(true);
      }
      return Promise.reject(error);
    }
  );

  // -----------------------
  // Fetch chat list
  // -----------------------
  useEffect(() => {
    if (!user.userId) return;

    const fetchChats = async () => {
      try {
        setLoadingMessages(true);
        const res = await axiosInstance.get(`/chat/user/${user.userId}`);
        const formatted =
          res.data?.data?.map((chatId) => ({ chatId, messages: [] })) || [];
        setChats(formatted);
        if (formatted.length > 0) setActiveChat(formatted[0]);
      } catch (e) {
        console.error("Failed to fetch chat list:", e);
      } finally {
        setLoadingMessages(false);
      }
    };
    fetchChats();

    // -----------------------
    // Socket listeners
    // -----------------------
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
  }, [user.userId, token, navigate]);

  // -----------------------
  // Fetch messages for active chat
  // -----------------------
  useEffect(() => {
    if (!user.userId || !activeChat?.chatId) return;

    const loadMessages = async () => {
      try {
        setLoadingMessages(true);
        const res = await axiosInstance.get(
          `/chat/user/${user.userId}/chat/${activeChat.chatId}`
        );
        setActiveChat((prev) => ({ ...prev, messages: res.data?.data || [] }));
        socket.emit("joinRoom", activeChat.chatId);
      } catch (e) {
        console.error("Failed to fetch chat messages:", e);
      } finally {
        setLoadingMessages(false);
      }
    };
    loadMessages();
  }, [activeChat?.chatId, user.userId, token]);

  // -----------------------
  // Handlers
  // -----------------------
  const startNewChat = () => socket.emit("createChat", { userId: user.userId });
  const sendMessage = (chatId, text) => {
    socket.emit("sendMessage", { chatId, userId: user.userId, message: text });
    setBotTyping(true);
  };
  const deleteChat = async (chatId) => {
    try {
      await axiosInstance.delete(`/chat/user/${user.userId}/chat/${chatId}`);
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
      await axiosInstance.delete(`/chat/user/${user.userId}`);
      setChats([]);
      setActiveChat({});
    } catch (error) {
      console.error("Failed to clear chats:", error);
    }
  };

  const handleSessionModalClose = () => {
    localStorage.clear();
    navigate("/login");
  };

  // -----------------------
  // JSX
  // -----------------------
  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <SessionModal
        isOpen={showSessionModal}
        onClose={handleSessionModalClose}
      />
      <Sidebar
        chats={chats}
        activeChat={activeChat}
        setActiveChat={setActiveChat}
        startNewChat={startNewChat}
        deleteChat={deleteChat}
        clearChats={clearAllChats}
        isOpen={sidebarOpen || isOpen}
        setIsOpen={setSidebarOpen}
        setIsOpenset={setIsOpen}
      />

      <div className="flex flex-col flex-1">
        <Header
          user={user}
          setIsOpen={setIsOpen}
          isOpen={isOpen}
          onLogout={() => {
            localStorage.clear();
            navigate("/login");
          }}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
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
