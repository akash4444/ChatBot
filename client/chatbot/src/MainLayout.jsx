import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import { BACKEND_URL } from "./config/config";

export default function App() {
  const [user] = useState({ name: "John Doe", userId: 1 });
  const [chats, setChats] = useState([]); // Array of chat sessions
  const [activeChat, setActiveChat] = useState({});

  useEffect(() => {
    getAllChatHistory();
  }, []);

  useEffect(() => {
    if (activeChat?.chatId) {
      getChatHistoryByChatId();
    }
  }, [activeChat?.chatId]);

  // Fetch chat history from backend
  const getAllChatHistory = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/chat/${user.userId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch chat history");
      }
      const data = await response.json();

      // If backend returns only chat IDs (array of strings)
      const formattedChats =
        data?.data?.map((chatId) => ({
          chatId: chatId,
          messages: [], // initialize empty messages, can fetch later
        })) || [];

      setChats(formattedChats);

      // Set the first chat as active if any exist
      if (formattedChats.length > 0) {
        setActiveChat({ ...formattedChats[0] });
      }
    } catch (error) {
      console.error("Error fetching chat history:", error);
    }
  };

  const getChatHistoryByChatId = async () => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/chat/${user.userId}/${activeChat?.chatId}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch chat history");
      }
      const data = await response.json();

      // Set the first chat as active if any exist
      if (data?.data) {
        setActiveChat({ ...activeChat, messages: data?.data });
      }
    } catch (error) {
      console.error("Error fetching chat history:", error);
    }
  };

  const handleLogout = () => {
    console.log("Logout clicked");
  };

  const startNewChat = () => {
    const newChat = { id: Date.now().toString(), messages: [] };
    setChats([newChat, ...chats]);
    setActiveChat(newChat.id);
  };

  const addMessage = (chatId, message, sender) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId
          ? { ...chat, messages: [...chat.messages, { sender, text: message }] }
          : chat
      )
    );
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar fixed */}
      <Sidebar
        chats={chats}
        setActiveChat={setActiveChat}
        startNewChat={startNewChat}
        activeChat={activeChat}
      />

      {/* Main area */}
      <div className="flex flex-col flex-1">
        {/* Sticky header */}
        <Header user={user} onLogout={handleLogout} />

        {/* Chat window scrolls independently */}
        <div className="flex-1 overflow-auto">
          <ChatWindow activeChat={activeChat} addMessage={addMessage} />
        </div>
      </div>
    </div>
  );
}
