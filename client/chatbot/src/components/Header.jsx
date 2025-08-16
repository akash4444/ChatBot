import React from "react";
import { LogOut, Menu } from "lucide-react"; // npm install lucide-react

export default function Header({ user, onLogout, setIsOpen, isOpen }) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between bg-white p-4 shadow-md">
      <div className="md:hidden p-2 bg-gray-100 border-b flex items-center justify-between">
        <button
          className="p-1 cursor-pointer rounded bg-black text-white"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Menu size={20} />
        </button>
      </div>
      {/* Title */}
      <h1 className="text-xl font-bold text-gray-800 truncate">ChatBot</h1>

      {/* User Info */}
      <div className="flex items-center space-x-4">
        {/* Hide name on small screens */}
        <span className="hidden sm:inline font-medium text-gray-700">
          {`${user.firstName} ${user.lastName}`}
        </span>

        {/* Logout button: text on md+, icon only on mobile */}
        <button
          onClick={onLogout}
          className="flex cursor-pointer items-center justify-center bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
        >
          <span className="sm:hidden">
            <LogOut size={18} />
          </span>
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
