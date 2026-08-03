"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/context/AuthContext";
import { PLAYGROUND_EXAMPLES, CodeExample } from "@/lib/playgroundExamples";
import { evaluateCodeSolution } from "@/lib/codeEvaluator";
import { apiFetch } from "@/lib/api";
import {
  ChevronLeft,
  Zap,
  Bookmark,
  Play,
  Send,
  FileText,
  Sparkles,
  Lightbulb,
  Settings,
  Minimize2,
  Maximize2,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Bot,
  HelpCircle,
  GripVertical,
  Sliders,
  Eye,
  EyeOff,
} from "lucide-react";

// Dynamically import Monaco Editor to prevent SSR issues
const MonacoPlayground = dynamic(
  () => import("@/components/MonacoPlayground"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-white flex items-center justify-center text-zinc-400 font-mono text-xs border border-zinc-200">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-[#111111] border-t-transparent rounded-full animate-spin" />
          Loading Monaco Code Editor...
        </div>
      </div>
    ),
  },
);

export default function StudentPlaygroundPage() {
  const router = useRouter();
  const { user, checkAuth } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);

  // Selected Problem / Example
  const [selectedExampleId, setSelectedExampleId] =
    useState<string>("py-two-sum");
  const [currentExample, setCurrentExample] = useState<CodeExample>(
    PLAYGROUND_EXAMPLES[0],
  );
  const [language, setLanguage] = useState<string>("python");
  const [code, setCode] = useState<string>(PLAYGROUND_EXAMPLES[0].starterCode);

  // Left Panel & Resizer State
  const [activeLeftTab, setActiveLeftTab] = useState<
    "question" | "ai" | "hints" | "settings"
  >("question");
  const [leftWidthPercent, setLeftWidthPercent] = useState<number>(42);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState<boolean>(false);

  // IDE Settings
  const [editorFontSize, setEditorFontSize] = useState<number>(14);
  const [editorTheme, setEditorTheme] = useState<"vs-dark" | "light">(
    "vs-dark",
  );
  const [showMinimap, setShowMinimap] = useState<boolean>(false);

  // Console Tabs State
  const [activeConsoleTab, setActiveConsoleTab] = useState<
    "input" | "output" | "error" | "tests"
  >("output");
  const [customInput, setCustomInput] = useState<string>(
    PLAYGROUND_EXAMPLES[0].sampleInput,
  );

  // Execution & Output state
  const [running, setRunning] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [output, setOutput] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<any[] | null>(null);

  // AI Tutor Chat state inside Left Panel
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiChatHistory, setAiChatHistory] = useState<
    Array<{ sender: "user" | "ai"; message: string }>
  >([
    {
      sender: "ai",
      message:
        "Hello! I am your AI Tutor. Ask me any question about algorithm logic, time complexity, or debugging your solution!",
    },
  ]);

  // Hints State
  const [unlockedHints, setUnlockedHints] = useState<Record<number, boolean>>(
    {},
  );

  // Resizer Dragging Handler
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const newPercent = (e.clientX / window.innerWidth) * 100;
      if (newPercent >= 20 && newPercent <= 70) {
        setLeftWidthPercent(newPercent);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  // Change selected problem
  const handleProblemChange = (id: string) => {
    const found = PLAYGROUND_EXAMPLES.find((ex) => ex.id === id);
    if (found) {
      setSelectedExampleId(found.id);
      setCurrentExample(found);
      setLanguage(found.language);
      setCode(found.starterCode);
      setCustomInput(found.sampleInput);
      setOutput("");
      setErrorMessage(null);
      setTestResults(null);
      setUnlockedHints({});
    }
  };

  // Run Code logic
  const handleRunCode = () => {
    setRunning(true);
    setActiveConsoleTab("output");
    setOutput("Compiling and executing code...");
    setErrorMessage(null);
    setTestResults(null);

    setTimeout(() => {
      const outcome = evaluateCodeSolution(
        code,
        language,
        currentExample.testCases || [],
      );

      if (outcome.error) {
        setErrorMessage(outcome.error);
        setActiveConsoleTab("error");
        setOutput("");
      } else {
        setOutput(
          outcome.logs ||
            (outcome.allPassed
              ? `All ${outcome.totalPassed}/${outcome.totalTests} test cases passed successfully!`
              : `Passed ${outcome.totalPassed}/${outcome.totalTests} test cases.`),
        );
      }

      setTestResults(outcome.testResults || []);
      setRunning(false);
    }, 400);
  };

  // Submit Code logic
  const handleSubmitCode = async () => {
    setSubmitting(true);
    handleRunCode();
    try {
      if (currentExample.id) {
        const res = await apiFetch<any>(
          `/problems/${currentExample.id}/submit`,
          {
            method: "POST",
            body: JSON.stringify({
              sourceCode: code,
              language: language,
            }),
          },
        );
        if (res?.xpEarned && checkAuth) {
          try {
            await checkAuth();
          } catch {}
        }
      }
    } catch (err) {
      console.error("Submission error:", err);
    } finally {
      setSubmitting(false);
      setActiveConsoleTab("tests");
    }
  };

  // Toggle Bookmark logic
  const handleToggleBookmark = async () => {
    try {
      if (currentExample.id) {
        const res = await apiFetch<any>(
          `/problems/${currentExample.id}/bookmark`,
          {
            method: "POST",
          },
        );
        if (res?.isBookmarked !== undefined) {
          setIsBookmarked(res.isBookmarked);
        } else {
          setIsBookmarked((prev) => !prev);
        }
      }
    } catch {
      setIsBookmarked((prev) => !prev);
    }
  };

  // Send AI Tutor Message
  const handleSendAiMessage = async (textToSend?: string) => {
    const query = textToSend || aiPrompt;
    if (!query.trim()) return;

    setAiChatHistory((prev) => [...prev, { sender: "user", message: query }]);
    if (!textToSend) setAiPrompt("");
    setAiLoading(true);

    try {
      const res = await apiFetch<any>("/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          message: `Problem: ${currentExample.title}\nStudent Code:\n${code}\nQuestion: ${query}`,
          history: [],
        }),
      });

      const reply =
        res?.reply ||
        res?.message ||
        "I've analyzed your question. Try checking the hash map lookups and boundary constraints in your solution!";
      setAiChatHistory((prev) => [...prev, { sender: "ai", message: reply }]);
    } catch {
      setAiChatHistory((prev) => [
        ...prev,
        {
          sender: "ai",
          message:
            "To solve this problem efficiently: use a Hash Map to store numbers you've seen so far. This gives O(N) time complexity instead of O(N²).",
        },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <main className="h-screen w-screen overflow-hidden bg-[#F8F9FA] text-[#111111] font-sans flex flex-col selection:bg-blue-600 selection:text-white">
      {/* ── TOP NAVBAR HEADER (Image 2 style) ────────────────────────────────── */}
      <header className="h-14 bg-white border-b border-zinc-200 px-4 flex items-center justify-between shrink-0 z-30 shadow-2xs">
        {/* Left: Back button + Title selector */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/student/assessments")}
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 hover:text-black transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <span className="text-zinc-300 font-mono">|</span>

          <div className="relative group flex items-center">
            <select
              value={selectedExampleId}
              onChange={(e) => handleProblemChange(e.target.value)}
              className="appearance-none bg-transparent pr-7 font-bold text-sm text-zinc-900 focus:outline-none cursor-pointer"
            >
              {PLAYGROUND_EXAMPLES.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.title}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-zinc-500 absolute right-0 pointer-events-none" />
          </div>
        </div>

        {/* Right: XP + Action Buttons */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-bold text-amber-900 font-mono">
            <span className="text-zinc-500 text-[11px] font-sans font-semibold">
              Total XP
            </span>
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>
              {user?.totalXp !== undefined
                ? user.totalXp.toLocaleString()
                : "0"}
            </span>
          </div>

          <button
            title="Bookmark Problem"
            onClick={handleToggleBookmark}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isBookmarked
                ? "text-amber-500 bg-amber-50"
                : "text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100"
            }`}
          >
            <Bookmark
              className={`w-4 h-4 ${isBookmarked ? "fill-amber-500 text-amber-500" : ""}`}
            />
          </button>

          <button
            onClick={handleRunCode}
            disabled={running}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-zinc-300 hover:bg-zinc-100 text-zinc-800 text-xs font-semibold rounded-lg shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-zinc-800" />
            <span>{running ? "Running..." : "Run"}</span>
          </button>

          <button
            onClick={handleSubmitCode}
            disabled={submitting}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#0066FF] hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submitting ? "Submitting..." : "Submit"}</span>
          </button>
        </div>
      </header>

      {/* ── MAIN WORKSPACE SPLIT WITH RESIZER DIVIDER ────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Far Left Navigation Icon Rail */}
        <aside className="w-12 bg-white border-r border-zinc-200 flex flex-col items-center justify-between py-3 shrink-0 z-10">
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={() => {
                setActiveLeftTab("question");
                setIsLeftCollapsed(false);
              }}
              title="Question Statement"
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                activeLeftTab === "question" && !isLeftCollapsed
                  ? "text-zinc-900 bg-zinc-100 font-bold"
                  : "text-zinc-400 hover:text-zinc-800 hover:bg-zinc-50"
              }`}
            >
              <FileText className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setActiveLeftTab("ai");
                setIsLeftCollapsed(false);
              }}
              title="AI Tutor Assistant"
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                activeLeftTab === "ai" && !isLeftCollapsed
                  ? "text-[#0066FF] bg-blue-50 font-bold"
                  : "text-zinc-400 hover:text-zinc-800 hover:bg-zinc-50"
              }`}
            >
              <Sparkles className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setActiveLeftTab("hints");
                setIsLeftCollapsed(false);
              }}
              title="Hints & Solution Strategy"
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                activeLeftTab === "hints" && !isLeftCollapsed
                  ? "text-amber-600 bg-amber-50 font-bold"
                  : "text-zinc-400 hover:text-zinc-800 hover:bg-zinc-50"
              }`}
            >
              <Lightbulb className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => {
              setActiveLeftTab("settings");
              setIsLeftCollapsed(false);
            }}
            title="IDE Preferences"
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              activeLeftTab === "settings" && !isLeftCollapsed
                ? "text-zinc-900 bg-zinc-100 font-bold"
                : "text-zinc-400 hover:text-zinc-800 hover:bg-zinc-50"
            }`}
          >
            <Settings className="w-4 h-4" />
          </button>
        </aside>

        {/* ── LEFT PANEL: CLICKABLE & SWITCHABLE TABS ───────────────────────── */}
        <section
          style={{ width: isLeftCollapsed ? "0px" : `${leftWidthPercent}%` }}
          className="bg-white border-r border-zinc-200 flex flex-col overflow-hidden transition-[width] duration-75 shrink-0"
        >
          {/* Top Header Bar */}
          <div className="h-10 border-b border-zinc-200 px-4 flex items-center justify-between bg-zinc-50/60 shrink-0">
            <div className="flex items-center gap-2 text-[11px] font-mono font-bold uppercase text-zinc-500 tracking-wider">
              {activeLeftTab === "question" && (
                <>
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>QUESTION</span>
                </>
              )}
              {activeLeftTab === "ai" && (
                <>
                  <span>AI TUTOR ASSISTANT</span>
                </>
              )}
              {activeLeftTab === "hints" && (
                <>
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  <span>HINTS & SOLUTION</span>
                </>
              )}
              {activeLeftTab === "settings" && (
                <>
                  <Sliders className="w-3.5 h-3.5 text-zinc-700" />
                  <span>IDE SETTINGS</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 text-zinc-400">
              <button
                onClick={() => setIsLeftCollapsed(!isLeftCollapsed)}
                title="Collapse Sidebar"
                className="hover:text-zinc-700 cursor-pointer"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* TAB CONTENT 1: QUESTION STATEMENT */}
          {activeLeftTab === "question" && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-zinc-800 text-xs leading-relaxed font-sans">
              <div>
                <h2 className="text-lg font-bold text-zinc-900">
                  {currentExample.title}
                </h2>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span
                  className={`px-2.5 py-0.5 font-bold rounded-full ${
                    currentExample.difficulty === "Easy"
                      ? "bg-emerald-100 text-emerald-900"
                      : currentExample.difficulty === "Medium"
                        ? "bg-amber-100 text-amber-900"
                        : "bg-red-100 text-red-900"
                  }`}
                >
                  {currentExample.difficulty}
                </span>
                <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 font-semibold rounded">
                  2x
                </span>
                <span className="px-2.5 py-0.5 bg-zinc-100 text-zinc-800 font-bold rounded">
                  80/80
                </span>
              </div>

              <div className="text-[11px] font-mono text-zinc-400">
                Time Limit: 2s, Memory Limit: 128000
              </div>

              <div className="space-y-2">
                <p className="whitespace-pre-wrap leading-relaxed text-zinc-700 font-sans">
                  {currentExample.description}
                </p>
              </div>

              <div className="space-y-1">
                <h3 className="font-bold text-zinc-900 text-xs">User Task:</h3>
                <p className="text-zinc-600 leading-relaxed font-sans">
                  Since this is a functional problem, you don&apos;t have to
                  take input. You just have to complete the solution function
                  that processes the parameters and returns the output.
                </p>
              </div>

              <div className="space-y-1.5">
                <h3 className="font-bold text-zinc-900 text-xs">
                  Constraints:
                </h3>
                <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg font-mono text-[11px] text-zinc-800 space-y-1">
                  <div>1 ≤ N ≤ 1000</div>
                  <div>0 ≤ Element.data ≤ 100</div>
                </div>
              </div>

              <div className="space-y-1.5">
                <h3 className="font-bold text-zinc-900 text-xs">Example:</h3>
                <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3 font-mono text-[11px]">
                  <div>
                    <span className="text-zinc-500 font-bold block mb-1">
                      Sample Input:
                    </span>
                    <div className="text-zinc-900 bg-white p-2.5 rounded border border-zinc-200">
                      {currentExample.sampleInput}
                    </div>
                  </div>

                  <div>
                    <span className="text-zinc-500 font-bold block mb-1">
                      Sample Output:
                    </span>
                    <div className="text-zinc-900 bg-white p-2.5 rounded border border-zinc-200">
                      {currentExample.expectedOutput}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT 2: INTERACTIVE AI TUTOR CHAT */}
          {activeLeftTab === "ai" && (
            <div className="flex-1 flex flex-col overflow-hidden p-4 space-y-4 font-sans text-xs">
              {/* Preset Quick Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() =>
                    handleSendAiMessage(
                      "How do I solve this problem optimally?",
                    )
                  }
                  className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-[11px] font-medium text-zinc-700 cursor-pointer"
                >
                  💡 Solution Strategy
                </button>
                <button
                  onClick={() =>
                    handleSendAiMessage(
                      "What is the time and space complexity?",
                    )
                  }
                  className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-[11px] font-medium text-zinc-700 cursor-pointer"
                >
                  ⚡ Complexity Analysis
                </button>
              </div>

              {/* Chat Messages Log */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {aiChatHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${
                      item.sender === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-xl leading-relaxed ${
                        item.sender === "user"
                          ? "bg-[#0066FF] text-white rounded-br-none"
                          : "bg-zinc-100 text-zinc-900 rounded-bl-none border border-zinc-200"
                      }`}
                    >
                      {item.message}
                    </div>
                  </div>
                ))}
                {aiLoading && (
                  <div className="flex items-center gap-2 text-zinc-400 font-mono text-[11px]">
                    <div className="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                    AI Tutor thinking...
                  </div>
                )}
              </div>

              {/* Chat Input Box */}
              <div className="flex items-center gap-2 pt-2 border-t border-zinc-200">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendAiMessage()}
                  placeholder="Ask AI Tutor a question..."
                  className="flex-1 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-purple-600"
                />
                <button
                  onClick={() => handleSendAiMessage()}
                  className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-xs cursor-pointer"
                >
                  Send
                </button>
              </div>
            </div>
          )}

          {/* TAB CONTENT 3: HINTS */}
          {activeLeftTab === "hints" && (
            <div className="flex-1 overflow-y-auto p-6 space-y-4 font-sans text-xs">
              <h3 className="font-bold text-sm text-zinc-900">
                Problem Hints & Approach
              </h3>
              <p className="text-zinc-500 text-xs">
                Unlock step-by-step guidance without giving away the full answer
                right away.
              </p>

              <div className="space-y-3 pt-2">
                {[
                  {
                    id: 1,
                    title: "Hint 1: Choice of Data Structure",
                    text: "Instead of checking every pair with a nested loop (O(N²)), consider using a Hash Map to store elements you have already seen.",
                  },
                  {
                    id: 2,
                    title: "Hint 2: Calculating Complement",
                    text: "For each number `num`, compute `complement = target - num`. Check if `complement` exists in your hash map!",
                  },
                  {
                    id: 3,
                    title: "Hint 3: Returning Indices",
                    text: "Map each element value to its array index in the Hash Map. When the complement is found, return `[map[complement], current_index]`.",
                  },
                ].map((hint) => (
                  <div
                    key={hint.id}
                    className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-900">
                        {hint.title}
                      </span>
                      <button
                        onClick={() =>
                          setUnlockedHints((prev) => ({
                            ...prev,
                            [hint.id]: !prev[hint.id],
                          }))
                        }
                        className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                      >
                        {unlockedHints[hint.id] ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                        {unlockedHints[hint.id] ? "Hide Hint" : "Reveal Hint"}
                      </button>
                    </div>
                    {unlockedHints[hint.id] && (
                      <p className="text-zinc-700 leading-relaxed pt-1 border-t border-zinc-200">
                        {hint.text}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB CONTENT 4: IDE SETTINGS */}
          {activeLeftTab === "settings" && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6 font-sans text-xs">
              <h3 className="font-bold text-sm text-zinc-900">
                IDE Preferences
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl">
                  <div>
                    <h4 className="font-semibold text-zinc-900">
                      Editor Theme
                    </h4>
                    <p className="text-[11px] text-zinc-500">
                      Switch between VS Dark and Light themes
                    </p>
                  </div>
                  <select
                    value={editorTheme}
                    onChange={(e: any) => setEditorTheme(e.target.value)}
                    className="bg-white border border-zinc-300 rounded px-2.5 py-1 text-xs font-mono"
                  >
                    <option value="vs-dark">VS Dark</option>
                    <option value="light">Light</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl">
                  <div>
                    <h4 className="font-semibold text-zinc-900">Font Size</h4>
                    <p className="text-[11px] text-zinc-500">
                      Adjust code font size in Monaco Editor
                    </p>
                  </div>
                  <select
                    value={editorFontSize}
                    onChange={(e) => setEditorFontSize(Number(e.target.value))}
                    className="bg-white border border-zinc-300 rounded px-2.5 py-1 text-xs font-mono"
                  >
                    <option value={12}>12px</option>
                    <option value={14}>14px</option>
                    <option value={16}>16px</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ── DRAGGABLE RESIZER SLIDER BAR ────────────────────────────────────── */}
        <div
          onMouseDown={handleMouseDown}
          className={`w-2 hover:w-2.5 bg-zinc-200 hover:bg-blue-600 cursor-col-resize flex items-center justify-center transition-all shrink-0 select-none z-20 ${
            isDragging ? "bg-blue-600 w-2.5" : ""
          }`}
          title="Drag left or right to resize panels"
        >
          <div className="w-0.5 h-8 bg-zinc-400 rounded-full" />
        </div>

        {/* ── RIGHT PANEL: MONACO EDITOR & CONSOLE ──────────────────────────── */}
        <section className="flex-1 flex flex-col overflow-hidden bg-white">
          {/* Top Monaco Bar */}
          <div className="h-10 border-b border-zinc-200 px-4 flex items-center justify-between bg-zinc-50/60 shrink-0 font-mono text-xs">
            <div className="flex items-center gap-2">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-white border border-zinc-200 text-zinc-800 rounded px-2.5 py-1 text-xs focus:outline-none cursor-pointer"
              >
                <option value="python">Python (3.13.1)</option>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
              </select>
            </div>

            <div className="flex items-center gap-3 text-zinc-400">
              <button
                onClick={() => setCode(currentExample.starterCode)}
                title="Reset Starter Code"
                className="hover:text-zinc-700 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                title="Fullscreen Toggle"
                className="hover:text-zinc-700 transition-colors cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Main Monaco Code Editor */}
          <div className="flex-1 overflow-hidden relative">
            <MonacoPlayground
              value={code}
              onChange={setCode}
              language={language}
              theme={editorTheme}
              fontSize={editorFontSize}
              showMinimap={showMinimap}
              height="100%"
            />
          </div>

          {/* Bottom Console Panel (INPUT / OUTPUT / ERROR / TEST RESULTS) */}
          <div className="h-52 border-t border-zinc-200 flex flex-col bg-white shrink-0">
            <div className="h-9 border-b border-zinc-200 px-4 flex items-center gap-5 bg-zinc-50/60 text-[11px] font-mono font-bold text-zinc-500 shrink-0">
              <button
                onClick={() => setActiveConsoleTab("input")}
                className={`py-1.5 border-b-2 transition-all cursor-pointer ${
                  activeConsoleTab === "input"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent hover:text-zinc-800"
                }`}
              >
                INPUT
              </button>
              <button
                onClick={() => setActiveConsoleTab("output")}
                className={`py-1.5 border-b-2 transition-all cursor-pointer ${
                  activeConsoleTab === "output"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent hover:text-zinc-800"
                }`}
              >
                OUTPUT
              </button>
              <button
                onClick={() => setActiveConsoleTab("error")}
                className={`py-1.5 border-b-2 transition-all cursor-pointer ${
                  activeConsoleTab === "error"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent hover:text-zinc-800"
                }`}
              >
                ERROR
              </button>
              <button
                onClick={() => setActiveConsoleTab("tests")}
                className={`py-1.5 border-b-2 transition-all cursor-pointer ${
                  activeConsoleTab === "tests"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent hover:text-zinc-800"
                }`}
              >
                TEST RESULTS
              </button>
            </div>

            <div className="flex-1 p-4 font-mono text-xs overflow-y-auto bg-zinc-50/40">
              {activeConsoleTab === "input" && (
                <div className="space-y-2 h-full flex flex-col">
                  <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                    Custom Input:
                  </label>
                  <textarea
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    className="flex-1 w-full p-3 bg-white border border-zinc-200 rounded-lg text-xs font-mono text-zinc-800 focus:outline-none"
                    placeholder="Enter custom input..."
                  />
                </div>
              )}

              {activeConsoleTab === "output" && (
                <div className="space-y-2">
                  {output ? (
                    <pre className="text-zinc-900 leading-relaxed whitespace-pre-wrap">
                      {output}
                    </pre>
                  ) : (
                    <div className="text-zinc-400 text-[11px] italic">
                      Click &quot;Run&quot; or &quot;Submit&quot; to execute
                      your code.
                    </div>
                  )}
                </div>
              )}

              {activeConsoleTab === "error" && (
                <div>
                  {errorMessage ? (
                    <pre className="text-red-600 font-bold whitespace-pre-wrap">
                      {errorMessage}
                    </pre>
                  ) : (
                    <div className="text-emerald-600 text-[11px] font-bold">
                      No runtime errors detected.
                    </div>
                  )}
                </div>
              )}

              {activeConsoleTab === "tests" && (
                <div className="space-y-2">
                  {testResults && testResults.length > 0 ? (
                    <div className="space-y-2">
                      {testResults.map((tr: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-lg border bg-white border-zinc-200 text-[11px]"
                        >
                          <div className="flex items-center gap-2">
                            {tr.passed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                            )}
                            <span className="font-bold text-zinc-800">
                              Test Case #{idx + 1}
                            </span>
                            <span className="text-zinc-500">
                              (Input: {tr.input})
                            </span>
                          </div>

                          <span
                            className={`font-bold ${
                              tr.passed ? "text-emerald-600" : "text-red-500"
                            }`}
                          >
                            {tr.passed ? "PASSED" : "FAILED"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-zinc-400 text-[11px] italic">
                      No test case evaluations yet. Run or Submit your code.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
