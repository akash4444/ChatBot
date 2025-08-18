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
  const hasMountedRef = useRef(false);

  // ----------------- SOCKET SETUP -----------------
  useEffect(() => {
    if (!chatUser?._id) return;

    socket.emit("createPrivateChat", { userId, targetUserId: chatUser._id });

    socket.on("chatPrivateCreated", ({ chatId, messages }) => {
      setChatId(chatId);
      setMessages(messages);
      socket.emit("joinPrivateRoom", { chatId });
    });

    socket.on("newPrivateMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
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

    socket.on("messageReplyUpdated", ({ messageId, replies }) => {
      setMessages((prev) =>
        prev.map((msg) => (msg._id === messageId ? { ...msg, replies } : msg))
      );
    });

    return () => {
      socket.off("chatPrivateCreated");
      socket.off("newPrivateMessage");
      socket.off("userTyping");
      socket.off("userStoppedTyping");
      socket.off("messagesSeen");
      socket.off("messageReactionUpdated");
      socket.off("messageReplyUpdated");
    };
  }, [chatUser?._id, userId]);

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
    userSentMessageRef.current = true; // mark so we auto-scroll
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
    socket.emit("markAsSeen", { userId, chatId });
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } =
      messagesContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    setShowScrollBtn(distanceFromBottom > 200);
  };

  // ----------------- AUTO SCROLL BEHAVIOR -----------------
  useEffect(() => {
    if (!messagesContainerRef.current || messages.length === 0) return;

    const container = messagesContainerRef.current;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    // On first mount → scroll to bottom
    if (!hasMountedRef.current) {
      scrollToBottom();
      hasMountedRef.current = true;
      return;
    }

    // If I sent the message → always scroll
    if (userSentMessageRef.current) {
      scrollToBottom();
      userSentMessageRef.current = false;
    }

    // If another user sent → don't auto scroll
    setShowScrollBtn(distanceFromBottom > 100);
  }, [messages]);

  // ----------------- RENDER -----------------
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
          addReaction={(id, emoji) =>
            socket.emit("addMessageReaction", {
              chatId,
              messageId: id,
              userId,
              emoji,
            })
          }
          addReplyReaction={() => {}}
          sendReply={({ messageId, replyText }) => {
            if (!replyText.trim()) return;
            socket.emit("addMessageReply", {
              chatId,
              messageId,
              userId,
              replyText,
            });
          }}
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
