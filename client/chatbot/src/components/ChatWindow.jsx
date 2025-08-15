import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";

export default function ChatWindow({ activeChat, onSend }) {
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
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="p-3 border-b bg-white shadow-sm sticky top-0 z-10">
        <h2 className="font-semibold text-lg text-gray-800">
          {activeChat?.chatId
            ? `Chat #${activeChat.chatId}`
            : "Select or create a chat"}
        </h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {(activeChat?.messages || []).map((m, idx) => (
          <div
            key={idx}
            className={`max-w-[75%] p-3 rounded-lg shadow-sm prose prose-sm break-words ${
              m.sender === "user"
                ? "ml-auto bg-blue-100"
                : "bg-white border border-gray-200"
            }`}
          >
            {/* Sender */}
            <div className="text-xs text-gray-500 capitalize mb-1">
              {m.sender}
            </div>

            {/* Message */}
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                p: ({ node, children }) => (
                  <div className="mb-2 leading-relaxed">{children}</div>
                ),

                /* Table with copy button */
                table: ({ node, children, ...props }) => (
                  <div className="overflow-x-auto relative">
                    <button
                      onClick={() =>
                        handleCopy(
                          node.position
                            ? m.message.slice(
                                node.position.start.offset,
                                node.position.end.offset
                              )
                            : "",
                          `table-${idx}`
                        )
                      }
                      className="absolute cursor-pointer top-1 right-1 text-xs text-blue-600 underline hover:text-blue-800"
                    >
                      {copiedIndex === `table-${idx}` ? "Copied!" : "Copy"}
                    </button>
                    <table
                      className="border border-gray-300 text-sm w-full border-collapse"
                      {...props}
                    >
                      {children}
                    </table>
                  </div>
                ),
                th: ({ node, ...props }) => (
                  <th
                    className="border border-gray-300 px-3 py-2 bg-gray-100 font-semibold"
                    {...props}
                  />
                ),
                td: ({ node, ...props }) => (
                  <td className="border border-gray-300 px-3 py-2" {...props} />
                ),

                /* Code block with copy button */
                code({ inline, className, children, ...props }) {
                  if (!inline) {
                    const codeText = String(children).trim();
                    return (
                      <div className="relative">
                        <button
                          onClick={() => handleCopy(codeText, `code-${idx}`)}
                          className="absolute cursor-pointer top-1 right-1 text-xs text-blue-600 underline hover:text-blue-800"
                        >
                          {copiedIndex === `code-${idx}` ? "Copied!" : "Copy"}
                        </button>
                        <pre className="bg-gray-900 text-white rounded-lg p-3 overflow-x-auto">
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </pre>
                      </div>
                    );
                  }
                  return (
                    <code
                      className="bg-gray-200 px-1 py-0.5 rounded"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },

                a: ({ node, ...props }) => (
                  <a
                    className="text-blue-600 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                    {...props}
                  />
                ),
                img: ({ node, ...props }) => (
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
            <div className="text-[10px] text-gray-400 mt-1">
              {new Date(m.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t flex gap-2 sticky bottom-0">
        <input
          className="flex-1 border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type your message…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={!activeChat?.chatId}
        />
        <button
          className="px-4 py-2 rounded cursor-pointer bg-black text-white disabled:opacity-50 hover:bg-gray-800"
          onClick={handleSend}
          disabled={!activeChat?.chatId || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}
