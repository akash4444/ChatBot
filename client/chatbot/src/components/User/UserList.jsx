import React, { useEffect, useState } from "react";
import { axiosInstance } from "../../Utils/axiosInstance";
import ChatView from "./ChatView/ChatView";
import { X } from "lucide-react";

export default function UserList({ userId, setShowUsers, showUsers }) {
  const [users, setUsers] = useState([]);
  const [activeChatUser, setActiveChatUser] = useState(null);
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

  const handleMessage = (u) => {
    setActiveChatUser(u);
  };

  return (
    <div className="fixed inset-0 z-30 flex justify-end">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black bg-opacity-40"
        onClick={() => setShowUsers(false)}
      ></div>

      {/* Drawer */}
      <div
        className={`relative w-full sm:w-[500px] h-full bg-white shadow-xl flex flex-col transition-transform duration-300 ease-in-out ${
          activeChatUser ? "p-0" : "p-4"
        }`}
      >
        {/* Close Button */}
        {!activeChatUser && (
          <>
            <button
              className="absolute cursor-pointer top-3 right-3 text-gray-600 hover:text-gray-900"
              onClick={() => setShowUsers(false)}
            >
              <X size={26} />
            </button>

            {/* User List */}
            <h2 className="text-lg font-semibold mb-4">People</h2>
          </>
        )}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 bg-white shadow-xl rounded-2xl h-full flex flex-col transition-all duration-300">
            {activeChatUser ? (
              <ChatView
                userId={userId}
                chatUser={activeChatUser}
                onClose={() => setActiveChatUser(null)}
              />
            ) : (
              <ul className="space-y-3 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {users
                  .filter((u) => u._id !== userId)
                  .map((u) => (
                    <li
                      key={u._id}
                      className="flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition rounded-xl p-3 shadow-sm"
                    >
                      {/* Avatar + Info */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-green-400 flex items-center justify-center text-white font-semibold">
                          {u.firstName[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">
                            {u.firstName} {u.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                          <button
                            onClick={() => handleMessage(u)}
                            className="px-3 py-1.5 cursor-pointer rounded-full text-sm font-medium bg-green-100 text-green-600 hover:bg-green-200 transition"
                          >
                            Message
                          </button>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleFollow(u)}
                          className={`px-3 py-1.5 cursor-pointer rounded-full text-sm font-medium transition ${
                            u.isFollowing
                              ? "bg-red-100 text-red-600 hover:bg-red-200"
                              : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                          }`}
                        >
                          {u.isFollowing ? "Unfollow" : "Follow"}
                        </button>
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
