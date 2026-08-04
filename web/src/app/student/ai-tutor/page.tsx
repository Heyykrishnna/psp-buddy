"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getAccessToken } from "@/lib/api";
import { StudentLayout } from "@/components/StudentLayout";

// ── Types ──────────────────────────────────────────────────────────────────

interface ChatSession {
  id: string;
  title: string;
  topic: string | null;
  createdAt: string;
  updatedAt: string;
  messages?: { role: string; content: string }[];
}

interface ChatMessage {
  id: string;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

// ── Lightweight Markdown Renderer ──────────────────────────────────────────
function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  const renderInline = (text: string): React.ReactNode => {
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={idx}
            className="px-1.5 py-0.5 bg-zinc-100 text-zinc-800 rounded text-[11px] font-mono"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={idx} className="font-semibold text-zinc-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("*") && part.endsWith("*")) {
        return (
          <em key={idx} className="italic">
            {part.slice(1, -1)}
          </em>
        );
      }
      return part;
    });
  };

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <div key={i} className="my-3 rounded-xl overflow-hidden border border-zinc-200">
          <div className="bg-zinc-800 text-zinc-300 text-[10px] font-mono px-3 py-1.5 uppercase tracking-widest flex items-center justify-between">
            <span>{lang || "code"}</span>
            <button
              onClick={() => navigator.clipboard.writeText(codeLines.join("\n"))}
              className="text-zinc-400 hover:text-white transition-colors text-[10px] normal-case tracking-normal"
            >
              Copy
            </button>
          </div>
          <pre className="bg-[#1a1a2e] text-zinc-100 text-[12px] font-mono p-4 overflow-x-auto leading-relaxed">
            <code>{codeLines.join("\n")}</code>
          </pre>
        </div>,
      );
      i++;
      continue;
    }

    if (/^-{3,}$|^={3,}$/.test(line.trim())) {
      elements.push(<hr key={i} className="border-zinc-200 my-3" />);
      i++;
      continue;
    }

    if (line.startsWith("# ")) {
      elements.push(
        <h1 key={i} className="text-lg font-semibold text-zinc-900 mt-4 mb-2">
          {renderInline(line.slice(2))}
        </h1>,
      );
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="text-base font-semibold text-zinc-900 mt-3 mb-1.5 border-b border-zinc-100 pb-1">
          {renderInline(line.slice(3))}
        </h2>,
      );
      i++;
      continue;
    }
    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="text-sm font-semibold text-zinc-800 mt-2.5 mb-1">
          {renderInline(line.slice(4))}
        </h3>,
      );
      i++;
      continue;
    }
    if (line.startsWith("#### ")) {
      elements.push(
        <h4 key={i} className="text-sm font-medium text-zinc-700 mt-2 mb-0.5">
          {renderInline(line.slice(5))}
        </h4>,
      );
      i++;
      continue;
    }

    if (i + 1 < lines.length && /^=+$/.test(lines[i + 1].trim()) && line.trim()) {
      elements.push(
        <h1 key={i} className="text-lg font-semibold text-zinc-900 mt-4 mb-2">
          {renderInline(line)}
        </h1>,
      );
      i += 2;
      continue;
    }

    if (i + 1 < lines.length && /^-+$/.test(lines[i + 1].trim()) && line.trim()) {
      elements.push(
        <h2 key={i} className="text-base font-semibold text-zinc-900 mt-3 mb-1.5">
          {renderInline(line)}
        </h2>,
      );
      i += 2;
      continue;
    }

    if (/^[*\-]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[*\-]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[*\-]\s+/, ""));
        i++;
      }
      elements.push(
        <ul key={i} className="list-none space-y-1.5 my-2 pl-1">
          {items.map((item, idx) => (
            <li key={idx} className="flex gap-2.5 text-[13px] leading-relaxed text-zinc-700">
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0" />
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: { num: string; text: string }[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        const m = lines[i].match(/^(\d+)\.\s+(.*)$/)!;
        items.push({ num: m[1], text: m[2] });
        i++;
      }
      elements.push(
        <ol key={i} className="space-y-1.5 my-2 pl-1">
          {items.map((item, idx) => (
            <li key={idx} className="flex gap-2.5 text-[13px] leading-relaxed text-zinc-700">
              <span className="font-mono font-semibold text-zinc-400 shrink-0 text-[12px] mt-0.5">
                {item.num}.
              </span>
              <span>{renderInline(item.text)}</span>
            </li>
          ))}
        </ol>,
      );
      continue;
    }

    if (line.trim() === "") {
      i++;
      continue;
    }

    elements.push(
      <p key={i} className="text-[13px] leading-relaxed text-zinc-700 my-1">
        {renderInline(line)}
      </p>,
    );
    i++;
  }

  return <div className="space-y-0.5">{elements}</div>;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function groupSessionsByDate(sessions: ChatSession[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const groups: { label: string; items: ChatSession[] }[] = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "Past 7 Days", items: [] },
    { label: "Older", items: [] },
  ];

  for (const s of sessions) {
    const d = new Date(s.updatedAt);
    d.setHours(0, 0, 0, 0);
    if (d >= today) groups[0].items.push(s);
    else if (d >= yesterday) groups[1].items.push(s);
    else if (d >= weekAgo) groups[2].items.push(s);
    else groups[3].items.push(s);
  }

  return groups.filter((g) => g.items.length > 0);
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function AiTutorPage() {
  const router = useRouter();

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [topic, setTopic] = useState("General CS");
  const [userName, setUserName] = useState<string>("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load user profile
  useEffect(() => {
    apiFetch<any>("/auth/me")
      .then((res) => {
        const u = res?.user || res;
        const fn = u?.firstName || "";
        const ln = u?.lastName || "";
        const name = `${fn} ${ln}`.trim() || fn || "Student";
        setUserName(name);
      })
      .catch(() => {
        setUserName("Student");
      });
  }, []);

  // Load sessions
  const loadSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const data = await apiFetch<ChatSession[]>("/chat/sessions");
      setSessions(Array.isArray(data) ? data : []);
    } catch {
      setSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Load messages for active session
  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }
    setLoadingMessages(true);
    apiFetch<ChatMessage[]>(`/chat/sessions/${activeSessionId}/messages`)
      .then((data) => setMessages(Array.isArray(data) ? data : []))
      .catch(() => setMessages([]))
      .finally(() => setLoadingMessages(false));
  }, [activeSessionId]);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const handleNewChat = async () => {
    try {
      const session = await apiFetch<ChatSession>("/chat/sessions", {
        method: "POST",
        body: JSON.stringify({ topic }),
      });
      const safeSession = { ...session, messages: session.messages || [] };
      setSessions((prev) => [safeSession, ...prev]);
      setActiveSessionId(session.id);
      setMessages([]);
      inputRef.current?.focus();
    } catch {}
  };

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiFetch(`/chat/sessions/${id}`, { method: "DELETE" });
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (activeSessionId === id) {
        setActiveSessionId(null);
        setMessages([]);
      }
    } catch {}
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;

    let sessionId = activeSessionId;
    if (!sessionId) {
      try {
        const session = await apiFetch<ChatSession>("/chat/sessions", {
          method: "POST",
          body: JSON.stringify({ topic }),
        });
        const safeSession = { ...session, messages: session.messages || [] };
        setSessions((prev) => [safeSession, ...prev]);
        setActiveSessionId(session.id);
        sessionId = session.id;
      } catch {
        return;
      }
    }

    const userText = input.trim();
    setInput("");
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
    setSending(true);

    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      sessionId: sessionId!,
      role: "user",
      content: userText,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await apiFetch<any>(`/chat/sessions/${sessionId}/messages`, {
        method: "POST",
        body: JSON.stringify({ message: userText, topic }),
      });
      const aiMsg: ChatMessage = {
        id: res.messageId || `ai-${Date.now()}`,
        sessionId: sessionId!,
        role: "assistant",
        content: res.reply,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      loadSessions();
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sessionId: sessionId!,
          role: "assistant",
          content: `Error: ${err.message || "Could not reach the AI."}`,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const groupedSessions = groupSessionsByDate(sessions);
  const activeSession = sessions.find((s) => s.id === activeSessionId);

  return (
    <StudentLayout>
      <div className="h-screen flex overflow-hidden bg-[#F5F5F7]">
        {/* ── Chat Session Sidebar ────────────────────────────────────── */}
        <aside
          className={`${
            sidebarOpen ? "w-60" : "w-0"
          } shrink-0 bg-white border-r border-zinc-200 flex flex-col transition-all duration-300 overflow-hidden`}
        >
          {/* Header */}
          <div className="px-4 py-4 flex items-center justify-between border-b border-zinc-100 shrink-0">
            <span className="text-sm font-bold text-zinc-900">AI Tutor</span>
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Lumora</span>
          </div>

          {/* New Chat Button */}
          <div className="p-3 border-b border-zinc-100 shrink-0">
            <button
              onClick={handleNewChat}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-medium text-zinc-700 hover:bg-zinc-50 transition-all border border-zinc-200"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Chat
              <span className="ml-auto text-[10px] text-zinc-400 font-mono">Ctrl K</span>
            </button>
          </div>

          {/* Session List */}
          <div className="flex-1 overflow-y-auto py-2">
            {loadingSessions ? (
              <div className="px-4 py-8 flex flex-col items-center gap-2">
                <div className="w-5 h-5 border-2 border-zinc-200 border-t-zinc-500 rounded-full animate-spin" />
                <span className="text-[11px] text-zinc-400">Loading chats...</span>
              </div>
            ) : groupedSessions.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-[12px] text-zinc-400">No chats yet.</p>
                <p className="text-[11px] text-zinc-300 mt-1">Start a new conversation.</p>
              </div>
            ) : (
              groupedSessions.map((group) => (
                <div key={group.label} className="mb-1">
                  <div className="px-4 py-1.5">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      {group.label}
                    </span>
                  </div>
                  {group.items.map((session) => (
                    <div
                      key={session.id}
                      onClick={() => setActiveSessionId(session.id)}
                      className={`group mx-2 px-3 py-2 rounded-xl cursor-pointer flex items-start justify-between gap-1 transition-all ${
                        activeSessionId === session.id
                          ? "bg-zinc-100 text-zinc-900"
                          : "hover:bg-zinc-50"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-zinc-800 truncate leading-snug">
                          {session.title}
                        </p>
                        {session.messages?.[0] && (
                          <p className="text-[10px] text-zinc-400 truncate mt-0.5 leading-snug">
                            {session.messages[0].content}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={(e) => handleDeleteSession(session.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded-lg hover:bg-zinc-200 transition-all shrink-0 mt-0.5"
                        title="Delete chat"
                      >
                        <svg className="w-3 h-3 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>

          {/* User Footer */}
          <div className="border-t border-zinc-100 p-3 flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 rounded-xl bg-zinc-900 flex items-center justify-center shrink-0">
              <span className="text-white text-[11px] font-bold">
                {(userName || "Student")[0]?.toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-zinc-900 truncate">
                {userName.split(" ")[0] || userName || "Student"}
              </p>
            </div>
          </div>
        </aside>

        {/* ── Main Chat Area ──────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar */}
          <header className="h-14 bg-white border-b border-zinc-200 flex items-center px-4 gap-3 shrink-0">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="p-2 rounded-xl hover:bg-zinc-100 transition-colors text-zinc-500 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex-1 flex items-center gap-2 min-w-0">
              {activeSession ? (
                <span className="text-sm font-semibold text-zinc-800 truncate">{activeSession.title}</span>
              ) : (
                <span className="text-sm text-zinc-400">PSP Lumora — AI Tutor</span>
              )}
            </div>

            {/* Topic Selector */}
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="text-[11px] font-mono text-zinc-600 bg-zinc-100 border border-zinc-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-zinc-300 cursor-pointer"
            >
              <option value="General CS">General CS</option>
              <option value="Data Structures & Algorithms">DSA</option>
              <option value="Object Oriented Programming">OOP</option>
              <option value="Database Systems & SQL">SQL &amp; Databases</option>
              <option value="Web & Software Systems">Web Systems</option>
              <option value="Operating Systems">OS</option>
              <option value="Computer Networks">Networks</option>
            </select>
          </header>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto bg-[#F5F5F7]">
            {!activeSessionId && messages.length === 0 && !sending ? (
              // Welcome Screen
              <div className="h-full flex flex-col items-center justify-center px-6 text-center">
                <div className="w-14 h-14 bg-[#111111] rounded-2xl flex items-center justify-center mb-5">
                  <span className="text-white text-xl font-bold tracking-tight">PS</span>
                </div>
                <h1 className="text-2xl font-bold text-zinc-900 mb-2">How can I help you today?</h1>
                <p className="text-zinc-500 text-sm max-w-sm mb-8 leading-relaxed">
                  PSP Lumora AI Tutor — your smart CS companion. Ask about algorithms, OOP, databases, or any topic.
                </p>
                <div className="grid grid-cols-2 gap-3 max-w-lg w-full">
                  {[
                    "Explain binary search trees with examples",
                    "What is time complexity of merge sort?",
                    "Explain ACID properties in databases",
                    "Help me understand OOP inheritance in Python",
                  ].map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => { setInput(prompt); inputRef.current?.focus(); }}
                      className="text-left px-4 py-3 rounded-2xl border border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm transition-all text-[12px] text-zinc-600 leading-snug cursor-pointer"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : loadingMessages ? (
              <div className="h-full flex flex-col items-center justify-center gap-3">
                <div className="w-6 h-6 border-2 border-zinc-300 border-t-zinc-700 rounded-full animate-spin" />
                <span className="text-[12px] text-zinc-400">Loading conversation...</span>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
                {messages.map((msg, idx) =>
                  msg.role === "user" ? (
                    <div key={msg.id ?? idx} className="flex justify-end">
                      <div className="max-w-[80%] bg-[#111111] text-white rounded-2xl rounded-br-md px-4 py-3 text-[13px] leading-relaxed">
                        {msg.content}
                      </div>
                    </div>
                  ) : (
                    <div key={msg.id ?? idx} className="flex gap-3 items-start">
                      <div className="w-8 h-8 rounded-xl bg-[#111111] flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-white text-[9px] font-bold tracking-tight">AI</span>
                      </div>
                      <div className="flex-1 min-w-0 bg-white rounded-2xl rounded-tl-md px-4 py-3 border border-zinc-200 shadow-sm">
                        <MarkdownRenderer content={msg.content} />
                      </div>
                    </div>
                  ),
                )}

                {/* Typing indicator */}
                {sending && (
                  <div className="flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-xl bg-[#111111] flex items-center justify-center shrink-0">
                      <span className="text-white text-[9px] font-bold tracking-tight">AI</span>
                    </div>
                    <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 border border-zinc-200 shadow-sm flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce" />
                    </div>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* Input Bar */}
          <div className="bg-white border-t border-zinc-200 px-4 py-3 shrink-0">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-end gap-2 bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 focus-within:border-zinc-400 focus-within:shadow-sm transition-all">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask AI anything..."
                  rows={1}
                  className="flex-1 resize-none bg-transparent text-[13px] text-zinc-800 placeholder-zinc-400 focus:outline-none leading-relaxed max-h-40 min-h-6"
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !input.trim()}
                  className="w-8 h-8 rounded-xl bg-[#111111] hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all shrink-0 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 text-white rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
                  </svg>
                </button>
              </div>
              <p className="text-center text-[10px] text-zinc-400 mt-2">
                AI-generated responses — for educational reference only
              </p>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
