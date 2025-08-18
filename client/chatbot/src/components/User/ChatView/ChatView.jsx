import React, { useState, useEffect, useRef } from "react";
import ChatHeader from "./ChatHeader";
import MessagesList from "./MessagesList";
import ChatInput from "./ChatInput";
import { socket } from "../../../socket";
import { ChevronDown } from "lucide-react";

export default function ChatView({ userId, chatUser, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatId, setChatId] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const userSentMessageRef = useRef(false);

  // ----------------- SOCKET SETUP -----------------
  useEffect(() => {
    if (!chatUser?._id) return;

    socket.emit("createPrivateChat", { userId, targetUserId: chatUser._id });

    socket.on("chatPrivateCreated", ({ chatId, messages }) => {
      setChatId(chatId);
      setMessages(messages);
      socket.emit("joinPrivateRoom", { chatId });
      markMessagesSeen(chatId); // mark as seen on open
    });

    socket.on("newPrivateMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);

      const container = messagesContainerRef.current;
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;

      // Scroll if user sent this message or near bottom
      if (msg.senderId === userId || distanceFromBottom < 50) {
        userSentMessageRef.current = true;
        markMessagesSeen(chatId); // mark as seen when user is near bottom
      }
    });

    socket.on("userTyping", ({ userId: typingId }) => {
      if (typingId !== userId)
        setTypingUsers((prev) => [...new Set([...prev, typingId])]);
    });

    socket.on("userStoppedTyping", ({ userId: typingId }) =>
      setTypingUsers((prev) => prev.filter((id) => id !== typingId))
    );

    socket.on("messagesSeen", ({ messages: updatedMessages }) => {
      setMessages(updatedMessages);
    });

    socket.on("messageReactionUpdated", ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((msg) => (msg._id === messageId ? { ...msg, reactions } : msg))
      );
    });

    return () => {
      socket.off("chatPrivateCreated");
      socket.off("newPrivateMessage");
      socket.off("userTyping");
      socket.off("userStoppedTyping");
      socket.off("messagesSeen");
      socket.off("messageReactionUpdated");
    };
  }, [chatUser, userId, chatId]);

  // ----------------- MESSAGE FUNCTIONS -----------------
  const sendMessage = () => {
    if (!newMessage.trim() || !chatId) return;
    socket.emit("sendPrivateMessage", {
      chatId,
      senderId: userId,
      message: newMessage,
    });
    setNewMessage("");
    socket.emit("stopTyping", { chatId, userId });
    userSentMessageRef.current = true;
  };

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      socket.emit("typing", { chatId, userId });
    }
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit("stopTyping", { chatId, userId });
    }, 1500);
  };

  // ----------------- SCROLL -----------------
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } =
      messagesContainerRef.current;

    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    setShowScrollBtn(distanceFromBottom > 200);

    // mark messages as seen if user scrolls near bottom
    if (distanceFromBottom < 50) {
      markMessagesSeen(chatId);
    }
  };

  const markMessagesSeen = (chatId) => {
    if (!chatId) return;
    socket.emit("markAsSeen", { chatId, userId });
  };

  const addReaction = (messageId, emoji) => {
    if (!chatId) return;
    socket.emit("addMessageReaction", { chatId, messageId, userId, emoji });
  };

  // Auto-scroll only if user sent message or near bottom
  useEffect(() => {
    if (userSentMessageRef.current) {
      scrollToBottom();
      userSentMessageRef.current = false;
    }
    handleScroll();
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-xl overflow-hidden relative">
      <ChatHeader
        chatUser={chatUser}
        typingUsers={typingUsers}
        onClose={onClose}
      />

      <div
        className="flex-1 overflow-y-auto px-3 py-2 space-y-2"
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        <MessagesList
          messages={messages}
          userId={userId}
          addReaction={addReaction}
          addReplyReaction={() => {}}
          sendReply={() => {}}
        />
        <div ref={messagesEndRef} />
      </div>

      {showScrollBtn && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg flex items-center justify-center z-50 animate-bounce"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      )}

      <ChatInput
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        sendMessage={sendMessage}
        handleTyping={handleTyping}
      />
    </div>
  );
}
