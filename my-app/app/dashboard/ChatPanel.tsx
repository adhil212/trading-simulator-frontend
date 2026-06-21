"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const GUEST_SUGGESTIONS = [
  "What is TradeSim?",
  "How does commission work?",
  "What assets can I trade?",
];

const USER_SUGGESTIONS = [
  "What's my wallet balance?",
  "Show me my portfolio",
  "How does commission work?",
];

type Message = {
  role: "user" | "bot";
  text: string;
};

export default function ChatPanel() {
  const [open, setOpen] = useState(false);
  const isLoggedIn = typeof window !== "undefined" && !!localStorage.getItem("token");
  const SUGGESTIONS = isLoggedIn ? USER_SUGGESTIONS : GUEST_SUGGESTIONS;
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: isLoggedIn
      ? "Hi! I'm your trading assistant. Ask me about your portfolio, trades, or how the platform works."
      : "Hi! I'm your trading assistant. Ask me anything about TradeSim — how it works, supported assets, fees, and more."
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;
    if (!overrideText) setInput("");
    setMessages((prev) => [...prev, { role: "user", text }]);
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${API}/api/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        setMessages((prev) => [...prev, { role: "bot", text: "Sorry, I couldn't process that. Try again later." }]);
      } else {
        setMessages((prev) => [...prev, { role: "bot", text: data.reply }]);
      }
    } catch {
      toast.error("Failed to reach AI assistant");
      setMessages((prev) => [...prev, { role: "bot", text: "Connection error. Please check your internet and try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-green-600 hover:bg-green-500 text-white shadow-xl flex items-center justify-center transition-all hover:scale-105"
          aria-label="Open chat"
        >
          <MessageCircle size={26} />
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 h-[500px] rounded-2xl border border-zinc-700 bg-[#111318] shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
            <div className="flex items-center gap-2">
              <MessageCircle size={18} className="text-green-500" />
              <span className="text-white font-semibold text-sm">AI Assistant</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              aria-label="Close chat"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-green-600 text-white rounded-br-md"
                      : "bg-zinc-800 text-zinc-200 rounded-bl-md"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-zinc-800 rounded-2xl rounded-bl-md px-4 py-3">
                  <Loader2 size={16} className="animate-spin text-zinc-400" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {messages.length === 1 && !loading && (
            <div className="flex flex-wrap gap-2 px-4 pb-2">
              {SUGGESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-xs px-3 py-1.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <div className="border-t border-zinc-800 p-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about trading..."
                className="flex-1 rounded-xl bg-zinc-900 border border-zinc-700 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-green-500/50"
                disabled={loading}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="p-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
