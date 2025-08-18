import React, { useState, useEffect, useRef } from "react";
import TimeDisplay from "./TimeDisplay";
import Picker from "emoji-picker-react";
import ChatInput from "./ChatInput";
import { CornerUpRight } from "lucide-react";

const MessageItem = ({ msg, userId, addReaction, sendReply }) => {
  const isSender = msg.sender === userId || msg.sender?._id === userId;
  const [showReactions, setShowReactions] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const pickerRef = useRef(null);

  const quickEmojis = ["👍", "❤️", "😂", "😮", "😢", "👏"];

  const reactionsRef = useRef(null);

  // Check if message is seen by others (for sender)
  const isSeen = isSender && msg.seen;

  // Close reactions popup on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        reactionsRef.current &&
        !reactionsRef.current.contains(event.target)
      ) {
        setShowReactions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
    <div
      className={`flex flex-col max-w-[70%] relative ${
        isSender ? "ml-auto items-end" : "mr-auto items-start"
      }`}
    >
      <div className="text-right text-[10px] text-gray-500 opacity-50">
        <TimeDisplay createdAt={msg.createdAt} />
      </div>

      <div
        className={`px-4 py-1 rounded-2xl relative cursor-pointer ${
          isSender ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"
        } ${isSeen && isSender ? "pr-[32px]" : "pr-[24px]"}`}
        onClick={() => setShowReactions((prev) => !prev)}
      >
        {msg.text}

        {/* Seen indicator */}
        {isSender && (
          <span className="absolute bottom-1 right-2 text-xs text-gray-300">
            {isSeen ? "✓✓" : "✓"}
          </span>
        )}
      </div>

      {/* Reactions popup */}
      {showReactions && (
        <div
          ref={reactionsRef}
          className={`absolute z-50 flex items-center gap-2 px-2 py-1 rounded-2xl shadow-lg bg-white border 
                ${isSender ? "right-0 -top-5" : "left-0 -top-2"}`}
          onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
        >
          {quickEmojis.map((emoji, i) => (
            <span
              key={i}
              className="cursor-pointer text-xl"
              onClick={() => {
                addReaction(msg._id, emoji);
                setShowReactions(false);
              }}
            >
              {emoji}
            </span>
          ))}

          <button
            className="ml-2 px-2 py-1 text-sm bg-blue-500 text-white rounded-xl"
            onClick={() => {
              setShowEmojiPicker((prev) => !prev);
              setShowReactions(false);
            }}
          >
            +
          </button>

          <button
            className="ml-2 px-2 py-1 text-sm bg-blue-500 text-white rounded-xl"
            onClick={() => {
              setShowReplyInput((prev) => !prev);
              setShowReactions(false);
            }}
          >
            Reply
          </button>
        </div>
      )}

      {showEmojiPicker && (
        <div
          ref={pickerRef}
          style={{ position: "sticky", bottom: "50px" }} // center horizontally
        >
          <Picker
            onEmojiClick={(emoji) => {
              addReaction(msg._id, emoji?.emoji);
              setShowEmojiPicker(false);
            }}
            theme="light"
            height={400}
            width={320}
          />
        </div>
      )}

      <div className="flex gap-1 mt-1 flex-wrap">
        {msg.reactions.map((r, i) => (
          <span
            key={i}
            className={`px-2 py-0.5 text-sm rounded-full shadow cursor-pointer ${
              r.userId === msg.sender
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-black"
            }`}
          >
            {r.emoji}
          </span>
        ))}
      </div>

      {showReplyInput && (
        <div className="flex gap-2 mt-1">
          <ChatInput
            newMessage={replyText}
            setNewMessage={setReplyText}
            sendMessage={() => {
              sendReply({ messageId: msg._id, replyText });
              setReplyText("");
              setShowReplyInput(false);
            }}
            handleTyping={() => {}}
          />
        </div>
      )}

      {msg.replies?.length > 0 && (
        <div className="ml-6 mt-2 flex flex-col gap-2">
          {msg.replies.map((reply) => {
            const isOwnReply = reply.sender === userId;

            return (
              <div
                key={reply._id}
                className={`flex items-start gap-2 ${
                  isOwnReply ? "justify-end" : "justify-start"
                }`}
              >
                {!isOwnReply && (
                  <CornerUpRight size={14} className="mt-1 text-gray-500" />
                )}

                <div
                  className={`max-w-[75%] px-3 py-2 rounded-2xl shadow-sm text-sm ${
                    isOwnReply
                      ? "bg-blue-500 text-white rounded-br-none"
                      : "bg-gray-100 text-gray-900 rounded-bl-none"
                  }`}
                >
                  {reply.text}
                </div>

                {isOwnReply && (
                  <CornerUpRight
                    size={14}
                    className="mt-1 text-gray-400 rotate-180"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MessageItem;
