import React, { useState } from "react";
import { LogOut, Menu, Users, X } from "lucide-react";
import UserList from "./User/UserList";

export default function Header({ user, onLogout, setIsOpen, isOpen }) {
  const [showUsers, setShowUsers] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-20 flex items-center justify-between bg-white p-4 shadow-md">
        {/* Left Side: Mobile Menu */}
        <div className="md:hidden">
          <button
            className="p-2 rounded bg-gray-800 text-white"
            onClick={() => setIsOpen(!isOpen)}
          >
            <Menu size={22} />
          </button>
        </div>

        {/* Title */}
        <h1 className="text-xl font-bold text-gray-800 truncate">ChatBot</h1>

        {/* Right Side */}
        <div className="flex items-center space-x-3">
          {/* Users Button */}
          <button
            onClick={() => setShowUsers(true)}
            className="flex cursor-pointer items-center justify-center bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition"
          >
            <Users size={18} />
            <span className="hidden sm:inline ml-1">Users</span>
          </button>

          {/* Username (hidden on small) */}
          <span className="hidden md:inline font-medium text-gray-700 truncate max-w-[120px]">
            {`${user.firstName} ${user.lastName}`}
          </span>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="flex cursor-pointer items-center justify-center bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
          >
            <span className="sm:hidden">
              <LogOut size={20} />
            </span>
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Right Side User Drawer */}
      {showUsers && (
        <>
          <UserList
            userId={user.userId}
            showUsers={showUsers}
            setShowUsers={setShowUsers}
          />
        </>
      )}
    </>
  );
}
