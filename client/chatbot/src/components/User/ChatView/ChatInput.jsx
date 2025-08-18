import React, { useState, useRef, useEffect } from "react";
import { Smile, Send } from "lucide-react";
import Picker from "emoji-picker-react";

const ChatInput = ({
  newMessage,
  setNewMessage,
  sendMessage,
  handleTyping,
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef(null);
  const pickerRef = useRef(null);
  const MAX_HEIGHT = 120; // maximum height before scroll

  // Auto resize textarea until max height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      if (textareaRef.current.scrollHeight < MAX_HEIGHT) {
        textareaRef.current.style.height =
          textareaRef.current.scrollHeight + "px";
        textareaRef.current.style.overflowY = "hidden";
      } else {
        textareaRef.current.style.height = MAX_HEIGHT + "px";
        textareaRef.current.style.overflowY = "auto";
      }
    }
  }, [newMessage]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target) &&
        event.target.id !== "emoji-button"
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full bg-white p-3 border-t border-gray-200 shadow-inner rounded-t-2xl">
      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div
          ref={pickerRef}
          className="absolute bottom-full mb-2 left-0 z-50 shadow-2xl rounded-xl overflow-hidden animate-slideUp"
        >
          <Picker
            onEmojiClick={(emoji) => {
              handleTyping();
              setNewMessage((prev) => prev + emoji.emoji);
            }}
            theme="light"
            height={300}
            width={320}
          />
        </div>
      )}

      <div className="flex items-center gap-3">
        {/* Emoji Button */}
        <button
          id="emoji-button"
          onClick={() => setShowEmojiPicker((prev) => !prev)}
          className="text-2xl text-gray-500 hover:text-gray-700 transition-colors"
        >
          <Smile />
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            handleTyping();
          }}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 resize-none p-3 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 placeholder-gray-400 text-gray-800 shadow-sm transition-all duration-200"
          style={{ minHeight: "44px", maxHeight: `${MAX_HEIGHT}px` }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />

        {/* Send Button with Icon */}
        <button
          onClick={sendMessage}
          className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full hover:scale-105 transform transition duration-200 shadow-lg flex items-center justify-center"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      {/* Slide-up animation for emoji picker */}
      <style>
        {`
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-slideUp {
            animation: slideUp 0.15s ease-out forwards;
          }
        `}
      </style>
    </div>
  );
};

export default ChatInput;
