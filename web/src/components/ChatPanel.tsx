"use client";
import { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "@/lib/api";
import { SendIcon } from "./Icons";

interface Message {
  role: "user" | "assistant";
  content: string;
  alerts?: string[];
}

interface ChatPanelProps {
  latitude?: number;
  longitude?: number;
  dark?: boolean;
}

export default function ChatPanel({ latitude, longitude, dark }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm SafePath AI, your travel safety companion. I can help you plan safe routes, check area safety, or answer any safety questions. How can I help?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const res = await sendChatMessage({ message: userMsg, latitude, longitude });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.data.reply, alerts: res.data.safety_alerts },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I'm having trouble connecting. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (dark) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${msg.role === "user" ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white" : "bg-white/5 border border-white/10 text-gray-100"}`}>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                {msg.alerts && msg.alerts.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {msg.alerts.map((alert, j) => (
                      <div key={j} className="bg-red-500/20 border border-red-500/30 rounded-lg px-3 py-1.5 text-xs text-red-200">{alert}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="p-3 border-t border-white/10">
          <div className="flex gap-2">
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Ask about safety, routes, or areas..." className="flex-1 bg-white/5 text-white rounded-xl px-4 py-2.5 text-sm border border-white/10 focus:border-emerald-500/50 focus:outline-none placeholder:text-gray-500 transition-all" />
            <button onClick={send} disabled={loading || !input.trim()} className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-30 text-white rounded-xl px-4 py-2.5 transition-all shadow-lg shadow-emerald-500/20 disabled:shadow-none">
              <SendIcon size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Light mode
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${msg.role === "user" ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/15" : "bg-gray-50 border border-gray-200 text-gray-700"}`}>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              {msg.alerts && msg.alerts.length > 0 && (
                <div className="mt-2 space-y-1">
                  {msg.alerts.map((alert, j) => (
                    <div key={j} className="bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 text-xs text-red-600">{alert}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.15s]" />
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.3s]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Ask about safety, routes, or areas..." className="flex-1 bg-gray-50 text-gray-800 rounded-xl px-4 py-2.5 text-sm border border-gray-200 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 placeholder:text-gray-400 transition-all" />
          <button onClick={send} disabled={loading || !input.trim()} className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-30 text-white rounded-xl px-4 py-2.5 transition-all shadow-md shadow-emerald-500/20 disabled:shadow-none">
            <SendIcon size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
