import React from "react";

export default function Header({ user, onLogout }) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between bg-white p-4 shadow-md">
      <h1 className="text-xl font-bold text-gray-800">ChatBot</h1>
      <div className="flex items-center space-x-4">
        <span className="font-medium text-gray-700">{user.name}</span>
        <button
          onClick={onLogout}
          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
