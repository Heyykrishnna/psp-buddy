"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AiTutorPage() {
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I am **Lumora AI Tutor** powered by AI. \n\nAsk me anything about your CS concepts, data structures, algorithms, or test preparation!",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState("Data Structures & Algorithms");

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");

    const newHistory: Message[] = [
      ...messages,
      { role: "user", content: userMsg },
    ];
    setMessages(newHistory);
    setLoading(true);

    try {
      const res = await apiFetch<any>("/ai/tutor-chat", {
        method: "POST",
        body: JSON.stringify({
          message: userMsg,
          conversationHistory: newHistory.slice(0, -1),
          topic,
        }),
      });

      const aiReply = res?.reply || "No response from AI.";
      setMessages([...newHistory, { role: "assistant", content: aiReply }]);
    } catch (err: any) {
      setMessages([
        ...newHistory,
        {
          role: "assistant",
          content: `Error connecting to AI: ${err.message}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9FB] text-[#111111] font-sans flex flex-col selection:bg-[#111111] selection:text-white">
      {/* Top Header */}
      <div className="border-b border-zinc-200 bg-white p-6 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <span className="text-xs font-mono font-bold text-purple-600 uppercase tracking-widest block">
              AI SERVICE • INTERACTIVE TUTOR
            </span>
            <h1 className="font-serif text-2xl font-normal text-[#111111] mt-0.5">
              Lumora AI Study Buddy
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="px-3 py-1.5 bg-[#F4F4F6] text-xs font-medium text-[#111111] rounded-md border border-zinc-200"
            >
              <option value="Data Structures & Algorithms">
                Data Structures & Algorithms
              </option>
              <option value="Object Oriented Programming">
                Object Oriented Programming
              </option>
              <option value="Database Systems & SQL">
                Database Systems & SQL
              </option>
              <option value="Web & Software Systems">
                Web & Software Systems
              </option>
            </select>

            <button
              onClick={() => router.push("/dashboard")}
              className="px-3.5 py-1.5 border border-zinc-200 text-xs font-medium text-zinc-700 rounded-md hover:bg-zinc-100"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Container */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-6 flex flex-col">
        <div className="flex-1 bg-white border border-zinc-200 rounded-xl p-6 shadow-sm overflow-y-auto max-h-150 space-y-4 mb-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${
                msg.role === "user" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-xl px-4 py-3 text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[#111111] text-white rounded-br-none"
                    : "bg-purple-50 text-purple-950 border border-purple-100 rounded-bl-none font-sans whitespace-pre-wrap"
                }`}
              >
                {msg.role === "assistant" && (
                  <span className="text-[10px] font-mono font-bold text-purple-700 block mb-1">
                     AI TUTOR
                  </span>
                )}
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs font-mono text-purple-600 animate-pulse pt-2">
              <span className="w-2 h-2 bg-purple-600 rounded-full animate-ping" />
              AI Tutor is thinking...
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question or paste a problem snippet..."
            className="flex-1 px-4 py-3 bg-white border border-zinc-300 rounded-xl text-xs font-medium text-[#111111] shadow-sm focus:outline-none focus:border-[#111111]"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-6 py-3 bg-[#111111] hover:bg-black text-white text-xs font-medium rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            Ask Tutor 
          </button>
        </form>
      </div>
    </div>
  );
}
