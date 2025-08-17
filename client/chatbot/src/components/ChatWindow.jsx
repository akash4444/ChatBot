import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";

export default function ChatWindow({
  activeChat,
  onSend,
  loadingMessages,
  botTyping,
  startNewChat,
}) {
  const [input, setInput] = useState("");
  const [copiedIndex, setCopiedIndex] = useState(null);
  const endRef = useRef(null);

  const handleSend = () => {
    if (!input.trim() || !activeChat?.chatId) return;
    onSend(activeChat.chatId, input.trim());
    setInput("");
  };

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1000);
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages?.length, activeChat?.chatId]);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="p-2 sm:p-3 border-b bg-white shadow-sm sticky top-0 z-10">
        <h2 className="font-semibold text-lg sm:text-xl text-gray-800 truncate">
          {activeChat?.chatId ? (
            `Chat #${activeChat.chatId}`
          ) : (
            <div className="">
              <button
                className="py-2 px-3 cursor-pointer rounded bg-black text-white hover:bg-gray-800"
                onClick={startNewChat}
              >
                + New Chat
              </button>
            </div>
          )}
        </h2>
      </div>

      {/* Loading */}
      {loadingMessages && (
        <div className="flex justify-center items-center p-2 text-sm text-gray-500 bg-gray-200 rounded mb-2 animate-pulse">
          Please wait, getting chat...
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-auto p-2 sm:p-4 space-y-4">
        {(activeChat?.messages || []).map((m, idx) => (
          <div
            key={idx}
            className={`max-w-full sm:max-w-[75%] p-2 sm:p-3 rounded-lg shadow-sm prose prose-sm break-words ${
              m.sender === "user"
                ? "ml-auto bg-blue-100"
                : "bg-white border border-gray-200"
            }`}
          >
            {/* Sender */}
            <div
              className={`text-[10px] sm:text-xs font-semibold tracking-wide mb-1 px-2 py-0.5 rounded-full inline-block ${
                m.sender === "bot"
                  ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-sm"
                  : "text-gray-500"
              }`}
            >
              {m.sender === "bot" ? "AK AI" : "You"}
            </div>

            {/* Markdown content */}
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                p: ({ children }) => (
                  <div className="mb-2 leading-relaxed">{children}</div>
                ),
                table: ({ node, children }) => (
                  <div className="overflow-x-auto relative">
                    <button
                      onClick={() => handleCopy(m.message, `table-${idx}`)}
                      className="absolute top-1 right-1 text-xs text-blue-600 underline hover:text-blue-800"
                    >
                      {copiedIndex === `table-${idx}` ? "Copied!" : "Copy"}
                    </button>
                    <table className="border border-gray-300 text-sm w-full border-collapse">
                      {children}
                    </table>
                  </div>
                ),
                th: ({ ...props }) => (
                  <th
                    className="border border-gray-300 px-2 sm:px-3 py-1 sm:py-2 bg-gray-100 font-semibold"
                    {...props}
                  />
                ),
                td: ({ ...props }) => (
                  <td
                    className="border border-gray-300 px-2 sm:px-3 py-1 sm:py-2"
                    {...props}
                  />
                ),
                code({ inline, className, children }) {
                  if (!inline) {
                    const codeText = String(children).trim();
                    return (
                      <div className="relative">
                        <button
                          onClick={() => handleCopy(codeText, `code-${idx}`)}
                          className="absolute top-1 right-1 text-xs text-blue-600 underline hover:text-blue-800"
                        >
                          {copiedIndex === `code-${idx}` ? "Copied!" : "Copy"}
                        </button>
                        <pre className="bg-gray-900 text-white rounded-lg p-2 sm:p-3 overflow-x-auto">
                          <code className={className}>{children}</code>
                        </pre>
                      </div>
                    );
                  }
                  return (
                    <code className="bg-gray-200 px-1 py-0.5 rounded">
                      {children}
                    </code>
                  );
                },
                a: ({ ...props }) => (
                  <a
                    className="text-blue-600 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                    {...props}
                  />
                ),
                img: ({ ...props }) => (
                  <img
                    className="max-w-full rounded-lg shadow-sm"
                    {...props}
                    alt=""
                  />
                ),
              }}
            >
              {m.message}
            </ReactMarkdown>

            {/* Timestamp */}
            <div className="text-[10px] sm:text-xs text-gray-400 mt-1">
              {new Date(m.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}

        {botTyping && (
          <div className="flex items-center space-x-1 text-gray-500 text-sm">
            <span className="animate-bounce">●</span>
            <span className="animate-bounce delay-100">●</span>
            <span className="animate-bounce delay-200">●</span>
            <span>Thinking...</span>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Input */}
      {activeChat?.chatId && (
        <div className="p-2 sm:p-3 bg-white border-t flex gap-2 sticky bottom-0">
          <input
            className="flex-1 border rounded px-2 sm:px-3 py-1.5 sm:py-2 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type your message…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={!activeChat?.chatId}
          />
          <button
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded cursor-pointer bg-black text-white disabled:opacity-50 hover:bg-gray-800"
            onClick={handleSend}
            disabled={!activeChat?.chatId || !input.trim() || botTyping}
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
}
