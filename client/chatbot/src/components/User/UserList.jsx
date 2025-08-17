import React, { useEffect, useState } from "react";
import { axiosInstance } from "../../Utils/axiosInstance";
import ChatView from "./ChatView";

export default function UserList({ userId }) {
  const [users, setUsers] = useState([]);
  const [activeChatUser, setActiveChatUser] = useState(null); // ✅ Track selected user for chat
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) return;
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axiosInstance.get(
        `/private/private-chat/userlist/${userId}`
      );
      setUsers(res.data?.data || []);
    } catch (e) {
      console.error("Failed to fetch users:", e);
    }
  };

  const toggleFollow = async (u) => {
    try {
      if (u.isFollowing) {
        await axiosInstance.post(`/private/private-chat/${userId}/unfollow`, {
          targetId: u._id,
        });
      } else {
        await axiosInstance.post(`/private/private-chat/${userId}/follow`, {
          targetId: u._id,
        });
      }
      await fetchUsers();
    } catch (e) {
      console.error("Follow/Unfollow failed:", e);
    }
  };

  // ✅ Open chat
  const handleMessage = (u) => {
    setActiveChatUser(u);
  };

  return (
    <div className="p-4 bg-white shadow rounded-2xl h-full flex flex-col">
      {activeChatUser ? (
        // ✅ Show ChatView
        <ChatView
          userId={userId}
          chatUser={activeChatUser}
          onClose={() => setActiveChatUser(null)}
        />
      ) : (
        // ✅ Show user list
        <ul className="space-y-3 overflow-y-auto">
          {users
            .filter((u) => u._id !== userId)
            .map((u) => (
              <li
                key={u._id}
                className="flex justify-between items-center border-b pb-2"
              >
                <div>
                  <p className="font-medium">
                    {u.firstName} {u.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{u.email}</p>
                </div>

                <div className="flex gap-2">
                  {/* Follow / Unfollow */}
                  <button
                    onClick={() => toggleFollow(u)}
                    className={`px-3 py-1 cursor-pointer rounded-full text-sm ${
                      u.isFollowing
                        ? "bg-red-100 text-red-600"
                        : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    {u.isFollowing ? "Unfollow" : "Follow"}
                  </button>

                  {/* Message */}
                  <button
                    onClick={() => handleMessage(u)}
                    className="px-3 py-1 cursor-pointer rounded-full text-sm bg-green-100 text-green-600"
                  >
                    Message
                  </button>
                </div>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
