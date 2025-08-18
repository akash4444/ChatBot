import React from "react";
import { X } from "lucide-react";

const ChatHeader = ({ chatUser, typingUsers, onClose }) => (
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
    <button onClick={onClose} className="p-1 rounded-lg hover:bg-blue-600">
      <X size={22} />
    </button>
  </div>
);

export default ChatHeader;
