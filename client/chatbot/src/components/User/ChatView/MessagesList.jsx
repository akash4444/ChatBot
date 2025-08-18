import React from "react";
import MessageItem from "./MessageItem";

const MessagesList = ({
  messages,
  userId,
  addReaction,
  addReplyReaction,
  sendReply,
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
      {messages.map((msg) => (
        <MessageItem
          key={msg._id}
          msg={msg}
          userId={userId}
          addReaction={addReaction}
          addReplyReaction={addReplyReaction}
          sendReply={sendReply}
        />
      ))}
    </div>
  );
};

export default MessagesList;
