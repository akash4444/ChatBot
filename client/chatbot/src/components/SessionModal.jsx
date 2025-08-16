import React, { useEffect } from "react";

export default function SessionModal({ isOpen, onClose }) {
  // Disable background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-3xl p-8 w-96 shadow-2xl transform transition-all duration-300 scale-100">
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">
          Session Expired
        </h2>
        <p className="text-gray-600 mb-6 text-center text-sm">
          Your session has expired due to inactivity. Please login again to
          continue.
        </p>
        <button
          onClick={onClose}
          className="w-full cursor-pointer bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 text-white font-medium py-2 rounded-xl transition-all shadow-md hover:shadow-lg"
        >
          Login Again
        </button>
      </div>
    </div>
  );
}
