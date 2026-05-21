"use client";

import { useState, useRef, useEffect } from "react";
import { useApp } from "@/lib/providers";

export default function ChatBox() {
  const { currentAnalysis, chats, sendChatMessage, clearChat, isAnalyzing } = useApp();
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const chat = currentAnalysis ? chats[currentAnalysis.id] : null;
  const messages = chat?.messages ?? [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming || !currentAnalysis) return;
    const content = input.trim();
    setInput("");
    setIsStreaming(true);
    try {
      await sendChatMessage(content);
    } finally {
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestions = [
    "What were the main ideas?",
    "Summarize the key takeaways",
    "Create an implementation plan",
    "What action items can I take?",
  ];

  if (!currentAnalysis) return null;

  return (
    <div className="glass rounded-2xl border border-white/5 overflow-hidden flex flex-col h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm">
            💬
          </div>
          <div>
            <h3 className="font-semibold text-sm text-white">Chat with Video</h3>
            <p className="text-xs text-gray-500">
              Ask questions about this video
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
          >
            Clear chat
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-4 text-3xl">
              🎬
            </div>
            <h4 className="text-white font-medium mb-2">Chat with this video</h4>
            <p className="text-gray-500 text-sm max-w-sm mb-6">
              Ask anything about the video content. The AI has access to the full transcript and analysis.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setInput(s);
                    inputRef.current?.focus();
                  }}
                  className="text-xs px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all border border-white/5"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm flex-shrink-0 mt-1">
                  AI
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-blue-600/20 border border-blue-500/20 text-blue-100"
                    : "bg-white/5 border border-white/5 text-gray-200"
                }`}
              >
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                  {msg === messages[messages.length - 1] &&
                    msg.role === "assistant" &&
                    isStreaming && (
                      <span className="inline-block w-2 h-4 bg-blue-400 animate-pulse ml-1" />
                    )}
                </div>
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-lg bg-gray-600/30 flex items-center justify-center text-white text-sm flex-shrink-0 mt-1">
                  U
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/5">
        <div className="flex gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about this video..."
            rows={1}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all resize-none text-sm"
            disabled={isStreaming || isAnalyzing}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming || isAnalyzing}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:from-blue-500 hover:to-purple-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 flex-shrink-0"
          >
            {isStreaming ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
