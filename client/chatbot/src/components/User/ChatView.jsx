import React, { useState, useEffect, useRef } from "react";
import { X, Smile, SmilePlus } from "lucide-react";
import { socket } from "../../socket";
import EmojiPicker from "emoji-picker-react";

export default function ChatView({ userId, chatUser, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatId, setChatId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [activeReactionMsg, setActiveReactionMsg] = useState(null);
  const [showFullPicker, setShowFullPicker] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showInputEmojiPicker, setShowInputEmojiPicker] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const quickEmojis = ["👍", "❤️", "😂", "😮", "😢", "👏"];

  // 🔹 Socket setup
  useEffect(() => {
    if (!chatUser?._id) return;

    socket.emit("createPrivateChat", { userId, targetUserId: chatUser._id });

    socket.on("chatPrivateCreated", ({ chatId, messages }) => {
      setChatId(chatId);
      setMessages(messages);
      socket.emit("joinPrivateRoom", { chatId });
      socket.emit("markAsSeen", { chatId, userId });
    });

    socket.on(
      "newPrivateMessage",
      ({ chatId, sender, text, createdAt, _id }) => {
        setMessages((prev) => [
          ...prev,
          { _id, sender, text: text, createdAt, seen: false, reactions: [] },
        ]);
        socket.emit("markAsSeen", { chatId, userId });
      }
    );

    socket.on("userTyping", ({ userId: typingId }) => {
      if (typingId !== userId)
        setTypingUsers((prev) => [...new Set([...prev, typingId])]);
    });

    socket.on("userStoppedTyping", ({ userId: typingId }) => {
      setTypingUsers((prev) => prev.filter((id) => id !== typingId));
    });

    socket.on("messagesSeen", ({ seenBy }) => {
      if (seenBy !== userId)
        setMessages((prev) => prev.map((m) => ({ ...m, seen: true })));
    });

    socket.on("messageReactionUpdated", ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id.toString() === messageId.toString() ? { ...m, reactions } : m
        )
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
  }, [chatUser, userId]);

  // 🔹 Scroll handling
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    setIsAtBottom(scrollHeight - scrollTop - clientHeight < 50);
  };

  // 🔹 Auto scroll
  useEffect(() => {
    if (isAtBottom) scrollToBottom();
  }, [messages, isAtBottom]);

  // 🔹 First mount scroll
  useEffect(() => {
    scrollToBottom();
  }, []);

  // 🔹 Send message
  const sendMessage = () => {
    if (!newMessage.trim() || !chatId) return;
    socket.emit("sendPrivateMessage", {
      chatId,
      senderId: userId,
      message: newMessage,
    });
    setNewMessage("");
    socket.emit("stopTyping", { chatId, userId });
  };

  // 🔹 Typing handler
  const handleTyping = (e) => {
    setNewMessage(e.target.value);
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

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // 🔹 Add reaction
  const addReaction = (messageId, emoji) => {
    socket.emit("addMessageReaction", { chatId, messageId, userId, emoji });
    setActiveReactionMsg(null);
    setShowFullPicker(false);
  };

  const addEmojiToInput = (emoji) => {
    setNewMessage((prev) => prev + emoji);
    setShowInputEmojiPicker(false);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-xl overflow-hidden relative">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-blue-500 text-white shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg font-semibold">
            {chatUser.firstName[0]}
          </div>
          <div>
            <h2 className="font-semibold text-lg">
              {chatUser.firstName} {chatUser.lastName}
            </h2>
            <p className="text-xs text-blue-100">{chatUser.email}</p>
            {typingUsers.length > 0 && (
              <p className="text-xs text-yellow-200">
                {chatUser.firstName} is typing...
              </p>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-blue-600 transition cursor-pointer"
        >
          <X size={22} />
        </button>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
      >
        {messages.map((msg, idx) => {
          const isSender = msg.sender === userId || msg.sender?._id === userId;
          return (
            <div
              key={msg._id || idx}
              className={`flex flex-col max-w-[70%] ${
                isSender ? "ml-auto items-end" : "mr-auto items-start"
              } relative`}
            >
              <div className="relative group">
                <div
                  className={`relative px-4 py-2 rounded-2xl shadow-sm ${
                    isSender
                      ? "bg-blue-500 text-white rounded-br-none"
                      : "bg-gray-200 text-gray-800 rounded-bl-none"
                  } group`}
                >
                  {msg.text}
                  <button
                    onClick={() => setActiveReactionMsg(msg._id)}
                    className={`absolute -bottom-6 opacity-0 group-hover:opacity-100 transition text-gray-500 hover:text-blue-500 cursor-pointer ${
                      isSender ? "left-0" : "right-0"
                    }`}
                  >
                    <SmilePlus size={18} />
                  </button>
                </div>

                {/* Reaction picker */}
                {activeReactionMsg === msg._id && (
                  <div
                    className={`absolute bottom-2 p-0 rounded-2xl shadow-xl backdrop-blur-sm flex
        bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500
        transform transition-transform duration-300
        ${isSender ? "right-2 translate-x-0" : "left-2 translate-x-0"}`}
                  >
                    {quickEmojis.map((emoji, i) => (
                      <button
                        key={i}
                        onClick={() => addReaction(activeReactionMsg, emoji)}
                        className="text-2xl p-2 hover:bg-white/30 transition-colors duration-200 rounded-full"
                      >
                        {emoji}
                      </button>
                    ))}
                    <button
                      className="text-2xl p-2 hover:bg-white/30 transition-colors duration-200 rounded-full"
                      onClick={() => setShowFullPicker(!showFullPicker)}
                    >
                      ➕
                    </button>
                  </div>
                )}
              </div>

              {/* Reactions */}
              {msg.reactions?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {msg.reactions.map((r, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 text-sm bg-gray-100 rounded-full shadow"
                    >
                      {r.emoji}
                    </span>
                  ))}
                </div>
              )}

              {/* Time + Seen */}
              <div
                className={`flex items-center gap-2 text-xs mt-1 ${
                  isSender ? "text-gray-400 justify-end" : "text-gray-500"
                }`}
              >
                <span>
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {isSender && msg.seen && (
                  <span className="text-blue-500 font-medium">✔✔</span>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll-to-bottom button */}
      {!isAtBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-20 right-4 bg-blue-500 text-white p-2 rounded-full shadow-lg hover:bg-blue-600 transition z-50"
        >
          ⬇
        </button>
      )}

      {/* Input + bottom picker */}
      <div className="relative">
        {/* Bottom reaction picker */}
        {activeReactionMsg && (
          <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 z-50 flex flex-wrap gap-1 p-2 bg-white rounded-xl shadow-lg min-w-max max-w-[90vw]">
            {showFullPicker && (
              <div className="absolute bottom-full mb-14 left-1/2 transform -translate-x-1/2 z-50 shadow-lg bg-white rounded-xl w-[250px] max-w-[90vw]">
                <EmojiPicker
                  onEmojiClick={(emoji) =>
                    addReaction(activeReactionMsg, emoji.emoji)
                  }
                  theme="light"
                />
              </div>
            )}
          </div>
        )}

        {showInputEmojiPicker && (
          <div className="absolute bottom-full mb-14 left-4 z-50 shadow-lg bg-white rounded-xl w-[250px] max-w-[90vw]">
            <EmojiPicker
              onEmojiClick={(emoji) => addEmojiToInput(emoji.emoji)}
              theme="light"
            />
          </div>
        )}

        {/* Input area */}
        <div className="p-3 border-t bg-white flex items-center gap-2">
          <button
            onClick={() => setShowInputEmojiPicker(!showInputEmojiPicker)}
            className="text-2xl"
          >
            <Smile />
          </button>
          <textarea
            value={newMessage}
            onChange={handleTyping}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 resize-none p-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50"
            style={{ minHeight: "40px", maxHeight: "120px" }}
          />
          <button
            onClick={sendMessage}
            className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition font-medium cursor-pointer"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
