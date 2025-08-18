import React, { useState, useEffect, useRef } from "react";
import TimeDisplay from "./TimeDisplay";

const MessageItem = ({ msg, userId, addReaction, sendReply }) => {
  const isSender = msg.sender === userId || msg.sender?._id === userId;
  const [showReactions, setShowReactions] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showReplyInput, setShowReplyInput] = useState(false);
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
              setShowReplyInput((prev) => !prev);
              setShowReactions(false);
            }}
          >
            Reply
          </button>
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
          <input
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply..."
            className="flex-1 p-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-400"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendReply(msg._id, replyText);
                setReplyText("");
              }
            }}
          />
          <button
            onClick={() => {
              sendReply(msg._id, replyText);
              setReplyText("");
            }}
            className="px-3 py-1 bg-blue-500 text-white rounded-xl"
          >
            Send
          </button>
        </div>
      )}

      {msg.replies?.length > 0 && (
        <div className="ml-4 mt-2 flex flex-col gap-1">
          {msg.replies.map((reply) => (
            <div
              key={reply._id}
              className={`flex flex-col max-w-[80%] ${
                reply.sender === userId ? "ml-auto" : "mr-auto"
              }`}
            >
              <div
                className={`px-3 py-1 rounded-xl shadow-sm ${
                  reply.sender === userId
                    ? "bg-blue-400 text-white"
                    : "bg-gray-200 text-gray-800"
                }`}
              >
                {reply.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessageItem;
