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
  ListFilter,
  Search,
  Star,
  Check,
  PieChart,
  Circle,
  Filter,
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
    "problems" | "question" | "ai" | "hints" | "settings"
  >("question");
  const [leftWidthPercent, setLeftWidthPercent] = useState<number>(42);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState<boolean>(false);

  // Execution & Output state
  const [running, setRunning] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [output, setOutput] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<any[] | null>(null);

  // Submission result & history
  const [submissionResult, setSubmissionResult] = useState<any | null>(null);
  const [submissionHistory, setSubmissionHistory] = useState<any[]>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<any | null>(null);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  // Step 9 & 10 Filter State
  const [problemSearch, setProblemSearch] = useState<string>("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [topicFilter, setTopicFilter] = useState<string>("ALL");
  const [filteredProblemsList, setFilteredProblemsList] = useState<any[]>([]);

  useEffect(() => {
    async function fetchFilteredProblems() {
      try {
        const queryParams = new URLSearchParams();
        if (difficultyFilter !== "ALL")
          queryParams.append("difficulty", difficultyFilter);
        if (topicFilter !== "ALL") queryParams.append("topic", topicFilter);
        if (problemSearch.trim())
          queryParams.append("search", problemSearch.trim());
        if (user?.id) queryParams.append("userId", user.id);
        if (
          statusFilter === "SOLVED" ||
          statusFilter === "ATTEMPTED" ||
          statusFilter === "UNATTEMPTED"
        ) {
          queryParams.append("status", statusFilter);
        } else if (statusFilter === "BOOKMARKED") {
          queryParams.append("bookmarked", "true");
        }

        const res = await apiFetch<any[]>(
          `/problems?${queryParams.toString()}`,
        );
        if (res && Array.isArray(res)) {
          setFilteredProblemsList(res);
        }
      } catch {
        let list = PLAYGROUND_EXAMPLES.map((ex) => ({
          ...ex,
          userStatus:
            ex.id === currentExample.id && submitting
              ? "SOLVED"
              : "UNATTEMPTED",
          isBookmarked,
        }));

        if (difficultyFilter !== "ALL") {
          list = list.filter(
            (p) => p.difficulty.toUpperCase() === difficultyFilter,
          );
        }
        if (problemSearch.trim()) {
          const q = problemSearch.toLowerCase();
          list = list.filter(
            (p) =>
              p.title.toLowerCase().includes(q) ||
              p.description.toLowerCase().includes(q),
          );
        }
        if (statusFilter === "SOLVED")
          list = list.filter((p) => p.userStatus === "SOLVED");
        if (statusFilter === "ATTEMPTED")
          list = list.filter((p) => p.userStatus === "ATTEMPTED");
        if (statusFilter === "UNATTEMPTED")
          list = list.filter((p) => p.userStatus === "UNATTEMPTED");
        if (statusFilter === "BOOKMARKED")
          list = list.filter((p) => p.isBookmarked);

        setFilteredProblemsList(list);
      }
    }
    fetchFilteredProblems();
  }, [
    difficultyFilter,
    topicFilter,
    problemSearch,
    statusFilter,
    user?.id,
    isBookmarked,
    submitting,
    currentExample.id,
  ]);

  // IDE Settings
  const [editorFontSize, setEditorFontSize] = useState<number>(14);
  const [editorTheme, setEditorTheme] = useState<"vs-dark" | "light">(
    "vs-dark",
  );
  const [showMinimap, setShowMinimap] = useState<boolean>(false);

  // Console Tabs State
  const [activeConsoleTab, setActiveConsoleTab] = useState<
    "input" | "output" | "error" | "tests" | "result" | "history"
  >("output");
  const [customInput, setCustomInput] = useState<string>(
    PLAYGROUND_EXAMPLES[0].sampleInput,
  );

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

  const [saveToast, setSaveToast] = useState<string | null>(null);

  const getStorageKey = (problemIdOrSlug: string) => {
    return `psp_code_solution_${problemIdOrSlug}`;
  };

  // Save Code locally
  const handleSaveLocalCode = () => {
    if (currentExample.id && code) {
      localStorage.setItem(getStorageKey(currentExample.id), code);
      setSaveToast("Code saved locally!");
      setTimeout(() => setSaveToast(null), 2000);
    }
  };

  // Auto save code to local storage on code change
  useEffect(() => {
    if (currentExample.id && code) {
      localStorage.setItem(getStorageKey(currentExample.id), code);
    }
  }, [code, currentExample.id]);

  // Change selected problem & restore local code if present
  const handleProblemChange = async (id: string) => {
    const found = PLAYGROUND_EXAMPLES.find((ex) => ex.id === id || (ex as any).slug === id);
    if (found) {
      setSelectedExampleId(found.id);
      setCurrentExample(found);
      setLanguage(found.language);

      const savedCode = localStorage.getItem(getStorageKey(found.id));
      setCode(savedCode || found.starterCode);

      setCustomInput(found.sampleInput);
      setOutput("");
      setErrorMessage(null);
      setTestResults(null);
      setUnlockedHints({});
    }

    // Sync bookmark status for selected problem
    const problemKey = found ? found.id : id;
    const listMatch = filteredProblemsList.find((p) => p.id === problemKey || p.slug === problemKey);
    if (listMatch && listMatch.isBookmarked !== undefined) {
      setIsBookmarked(Boolean(listMatch.isBookmarked));
    }

    try {
      const uId = user?.id || "demo-user-id";
      const res = await apiFetch<any>(`/problems/${problemKey}?userId=${uId}`);
      if (res && res.isBookmarked !== undefined) {
        setIsBookmarked(Boolean(res.isBookmarked));
      }
    } catch {
      // Keep existing
    }
  };

  // Step 15: Run Code logic (Browser -> Backend API -> JudgeProvider -> Judge0)
  const handleRunCode = async () => {
    setRunning(true);
    setActiveConsoleTab("output");
    setOutput("Compiling and executing code via Backend Judge API...");
    setErrorMessage(null);
    setTestResults(null);

    try {
      if (currentExample.id) {
        const res = await apiFetch<any>(`/problems/${currentExample.id}/run`, {
          method: "POST",
          body: JSON.stringify({
            sourceCode: code,
            language: language,
          }),
        });

        if (res) {
          if (res.status === "COMPILATION_ERROR") {
            setErrorMessage(res.compileOutput || "Compilation error.");
            setActiveConsoleTab("error");
            setOutput("");
          } else {
            setOutput(
              res.logs ||
                (res.allPassed
                  ? `All ${res.totalPassed}/${res.totalTests} test cases passed successfully!`
                  : `Passed ${res.totalPassed}/${res.totalTests} test cases.`),
            );
          }
          setTestResults(res.results || []);
          return;
        }
      }
    } catch {
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
    } finally {
      setRunning(false);
    }
  };

  // Fetch submission history from DB
  const fetchSubmissionHistory = async (problemId: string) => {
    setLoadingHistory(true);
    try {
      const res = await apiFetch<any[]>(`/problems/${problemId}/submissions`);
      if (res && Array.isArray(res)) {
        setSubmissionHistory(res);
      }
    } catch {
      // Keep existing history
    } finally {
      setLoadingHistory(false);
    }
  };

  // Submit Code logic
  const handleSubmitCode = async () => {
    setSubmitting(true);
    setSubmissionResult(null);
    setActiveConsoleTab("result");
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
        if (res) {
          setSubmissionResult(res);
          setTestResults(res.judgeResult?.results || []);
          if (res.xpEarned && checkAuth) {
            try { await checkAuth(); } catch {}
          }
          // Refresh history
          await fetchSubmissionHistory(currentExample.id);
        }
      }
    } catch (err) {
      console.error("Submission error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Bookmark logic
  const handleToggleBookmark = async (targetId?: string) => {
    const pId = targetId || currentExample.id;
    if (!pId) return;

    const isCurrentActive = !targetId || targetId === currentExample.id || targetId === (currentExample as any).slug;

    // Optimistic UI state update
    if (isCurrentActive) {
      setIsBookmarked((prev) => !prev);
    }

    setFilteredProblemsList((prev) =>
      prev.map((p) => {
        if (p.id === pId || p.slug === pId || p.id === targetId || p.slug === targetId) {
          return { ...p, isBookmarked: !p.isBookmarked };
        }
        return p;
      }),
    );

    try {
      const uId = user?.id || "demo-user-id";
      const res = await apiFetch<any>(
        `/problems/${pId}/bookmark?userId=${uId}`,
        {
          method: "POST",
          body: JSON.stringify({ userId: uId }),
        },
      );

      if (res && res.isBookmarked !== undefined) {
        if (isCurrentActive) {
          setIsBookmarked(res.isBookmarked);
        }
        setFilteredProblemsList((prev) =>
          prev.map((p) => {
            if (p.id === pId || p.slug === pId || p.id === targetId || p.slug === targetId) {
              return { ...p, isBookmarked: res.isBookmarked };
            }
            return p;
          }),
        );
      }
    } catch (err) {
      console.error("Bookmark toggle failed:", err);
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
            onClick={() => handleToggleBookmark()}
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
                setActiveLeftTab("problems");
                setIsLeftCollapsed(false);
              }}
              title="Problem List & Filters"
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                activeLeftTab === "problems" && !isLeftCollapsed
                  ? "text-zinc-900 bg-zinc-100 font-bold"
                  : "text-zinc-400 hover:text-zinc-800 hover:bg-zinc-50"
              }`}
            >
              <ListFilter className="w-4 h-4" />
            </button>

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
              {activeLeftTab === "problems" && (
                <>
                  <ListFilter className="w-3.5 h-3.5 text-zinc-800" />
                  <span>PROBLEMS & FILTERS</span>
                </>
              )}
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

          {/* TAB CONTENT 0: PROBLEMS & FILTERS (Step 9 & 10) */}
          {activeLeftTab === "problems" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-zinc-800 text-xs font-sans">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-400" />
                <input
                  type="text"
                  value={problemSearch}
                  onChange={(e) => setProblemSearch(e.target.value)}
                  placeholder="Search problem title or topic..."
                  className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              {/* Filter Controls: Difficulty */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
                  Difficulty
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(["ALL", "EASY", "MEDIUM", "HARD"] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDifficultyFilter(d)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold transition-all cursor-pointer ${
                        difficultyFilter === d
                          ? "bg-zinc-900 text-white"
                          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filter Controls: Status (Step 10 Progress Badges) */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
                  Status
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { id: "ALL", label: "All" },
                    { id: "SOLVED", label: "✓ Solved" },
                    { id: "ATTEMPTED", label: "◐ Attempted" },
                    { id: "UNATTEMPTED", label: "○ Unattempted" },
                    { id: "BOOKMARKED", label: "★ Bookmarked" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setStatusFilter(s.id)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                        statusFilter === s.id
                          ? "bg-blue-600 text-white"
                          : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filter Controls: Topic */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
                  Topic
                </label>
                <select
                  value={topicFilter}
                  onChange={(e) => setTopicFilter(e.target.value)}
                  className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                >
                  <option value="ALL">All Topics</option>
                  <option value="Array">Array</option>
                  <option value="Hash Table">Hash Table</option>
                  <option value="String">String</option>
                  <option value="Algorithms">Algorithms</option>
                  <option value="Dynamic Programming">
                    Dynamic Programming
                  </option>
                </select>
              </div>

              {/* Problems List */}
              <div className="space-y-2 pt-2 border-t border-zinc-100">
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
                  <span>Found {filteredProblemsList.length} Problems</span>
                </div>

                {filteredProblemsList.length === 0 ? (
                  <div className="p-6 text-center text-zinc-400 font-mono text-xs">
                    No problems match your selected filters.
                  </div>
                ) : (
                  filteredProblemsList.map((p) => (
                    <div
                      key={p.id || p.slug}
                      onClick={() => {
                        handleProblemChange(p.id || p.slug);
                        setActiveLeftTab("question");
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer space-y-2 ${
                        currentExample.id === p.id ||
                        currentExample.title === p.title
                          ? "bg-blue-50/70 border-blue-200 shadow-2xs"
                          : "bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-xs text-zinc-900 line-clamp-1">
                          {p.title}
                        </h4>

                        {/* Step 10 Status & Bookmark Badges */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            title={p.isBookmarked ? "Remove Bookmark" : "Add Bookmark"}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleBookmark(p.id || p.slug);
                            }}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 border transition-colors cursor-pointer ${
                              p.isBookmarked
                                ? "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200"
                                : "bg-zinc-100 text-zinc-400 border-zinc-200 hover:text-zinc-700 hover:bg-zinc-200"
                            }`}
                          >
                            {p.isBookmarked ? "★ Bookmarked" : "☆ Bookmark"}
                          </button>

                          {p.userStatus === "SOLVED" && (
                            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded text-[10px] font-semibold flex items-center gap-1">
                              ✓ Solved
                            </span>
                          )}

                          {p.userStatus === "ATTEMPTED" && (
                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded text-[10px] font-semibold flex items-center gap-1">
                              ◐ Attempted
                            </span>
                          )}

                          {(!p.userStatus ||
                            p.userStatus === "UNATTEMPTED") && (
                            <span className="px-1.5 py-0.5 bg-zinc-100 text-zinc-600 border border-zinc-200 rounded text-[10px] font-semibold flex items-center gap-1">
                              ○ Unattempted
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                        <span
                          className={`font-bold ${
                            p.difficulty?.toUpperCase() === "EASY"
                              ? "text-emerald-700"
                              : p.difficulty?.toUpperCase() === "MEDIUM"
                                ? "text-blue-700"
                                : "text-red-700"
                          }`}
                        >
                          {p.difficulty}
                        </span>

                        <span>{p.points || 10} XP</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

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
                  Solution Strategy
                </button>
                <button
                  onClick={() =>
                    handleSendAiMessage(
                      "What is the time and space complexity?",
                    )
                  }
                  className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-[11px] font-medium text-zinc-700 cursor-pointer"
                >
                  Complexity Analysis
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
            <div className="flex items-center gap-3">
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

              {/* Theme Quick Toggle */}
              <button
                onClick={() =>
                  setEditorTheme((prev) =>
                    prev === "vs-dark" ? "light" : "vs-dark",
                  )
                }
                title="Toggle Theme (Dark / Light)"
                className="px-2 py-1 bg-white border border-zinc-200 hover:bg-zinc-100 rounded text-[11px] font-mono text-zinc-700 cursor-pointer"
              >
                {editorTheme === "vs-dark" ? "Dark" : "Light"}
              </button>

              {/* Font Size Control */}
              <select
                value={editorFontSize}
                onChange={(e) => setEditorFontSize(Number(e.target.value))}
                className="bg-white border border-zinc-200 text-zinc-700 rounded px-2 py-1 text-xs focus:outline-none cursor-pointer"
              >
                <option value={12}>12px</option>
                <option value={14}>14px</option>
                <option value={16}>16px</option>
                <option value={18}>18px</option>
                <option value={20}>20px</option>
              </select>

              {/* Local Save Status / Button */}
              <button
                onClick={handleSaveLocalCode}
                title="Save solution locally (Ctrl+S / Cmd+S)"
                className="px-2 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
              >
                {saveToast || "Save Local"}
              </button>
            </div>

            <div className="flex items-center gap-3 text-zinc-400">
              <span className="text-[10px] text-zinc-400 font-mono hidden md:inline">
                Ctrl+Enter: Run | Ctrl+Shift+Enter: Submit | Ctrl+S: Save
              </span>

              <button
                onClick={() => setCode(currentExample.starterCode)}
                title="Reset Starter Code"
                className="hover:text-zinc-700 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
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
              onRun={handleRunCode}
              onSubmit={handleSubmitCode}
              onSaveLocal={handleSaveLocalCode}
              height="100%"
            />
          </div>

          {/* Bottom Console Panel */}
          <div className="h-64 border-t border-zinc-200 flex flex-col bg-white shrink-0">
            {/* Console Tabs */}
            <div className="h-9 border-b border-zinc-200 px-4 flex items-center gap-5 bg-zinc-50/60 text-[11px] font-mono font-bold text-zinc-500 shrink-0 overflow-x-auto">
              {(["input", "output", "error", "tests", "result", "history"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveConsoleTab(tab);
                    if (tab === "history" && currentExample.id) {
                      fetchSubmissionHistory(currentExample.id);
                    }
                  }}
                  className={`py-1.5 border-b-2 transition-all cursor-pointer shrink-0 ${
                    activeConsoleTab === tab
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent hover:text-zinc-800"
                  }`}
                >
                  {tab === "input" && "INPUT"}
                  {tab === "output" && "OUTPUT"}
                  {tab === "error" && "ERROR"}
                  {tab === "tests" && "TEST RESULTS"}
                  {tab === "result" && (
                    <span className="flex items-center gap-1">
                      RESULT
                      {submissionResult && (
                        <span className={`w-1.5 h-1.5 rounded-full inline-block ${
                          submissionResult?.submission?.status === "ACCEPTED" ? "bg-emerald-500" : "bg-red-500"
                        }`} />
                      )}
                    </span>
                  )}
                  {tab === "history" && "SUBMISSIONS"}
                </button>
              ))}
            </div>

            <div className="flex-1 font-mono text-xs overflow-y-auto bg-zinc-50/40">
              {/* INPUT */}
              {activeConsoleTab === "input" && (
                <div className="p-4 space-y-2 h-full flex flex-col">
                  <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Custom Input:</label>
                  <textarea
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    className="flex-1 w-full p-3 bg-white border border-zinc-200 rounded-lg text-xs font-mono text-zinc-800 focus:outline-none"
                    placeholder="Enter custom input..."
                  />
                </div>
              )}

              {/* OUTPUT */}
              {activeConsoleTab === "output" && (
                <div className="p-4 space-y-2">
                  {output ? (
                    <pre className="text-zinc-900 leading-relaxed whitespace-pre-wrap">{output}</pre>
                  ) : (
                    <div className="text-zinc-400 text-[11px] italic">Click &quot;Run&quot; to execute your code.</div>
                  )}
                </div>
              )}

              {/* ERROR */}
              {activeConsoleTab === "error" && (
                <div className="p-4">
                  {errorMessage ? (
                    <pre className="text-red-600 font-bold whitespace-pre-wrap">{errorMessage}</pre>
                  ) : (
                    <div className="text-emerald-600 text-[11px] font-bold">No runtime errors detected.</div>
                  )}
                </div>
              )}

              {/* TEST RESULTS */}
              {activeConsoleTab === "tests" && (
                <div className="p-4 space-y-2">
                  {testResults && testResults.length > 0 ? (
                    testResults.map((tr: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg border bg-white border-zinc-200 text-[11px]">
                        <div className="flex items-center gap-2">
                          {tr.passed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                          )}
                          <span className="font-bold text-zinc-800">Test Case #{idx + 1}</span>
                          <span className="text-zinc-500">(Input: {tr.input})</span>
                        </div>
                        <span className={`font-bold ${tr.passed ? "text-emerald-600" : "text-red-500"}`}>
                          {tr.passed ? "PASSED" : "FAILED"}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-zinc-400 text-[11px] italic">No test case evaluations yet. Run or Submit your code.</div>
                  )}
                </div>
              )}

              {/* SUBMISSION RESULT */}
              {activeConsoleTab === "result" && (
                <div className="p-4">
                  {submitting && (
                    <div className="flex items-center gap-2 text-zinc-500 text-xs">
                      <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      Submitting and evaluating...
                    </div>
                  )}
                  {!submitting && submissionResult && (() => {
                    const sub = submissionResult.submission;
                    const jr = submissionResult.judgeResult;
                    const isAccepted = sub?.status === "ACCEPTED";
                    const passed = sub?.passedTests ?? jr?.totalPassed ?? 0;
                    const total = sub?.totalTests ?? jr?.totalTests ?? 0;
                    const runtime = sub?.runtimeMs ?? jr?.runtimeMs ?? 0;
                    const memory = sub?.memoryKb ?? jr?.memoryKb ?? 0;
                    const results: any[] = jr?.results || [];
                    return (
                      <div className="space-y-4">
                        {/* Verdict Banner */}
                        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                          isAccepted
                            ? "bg-emerald-50 border-emerald-200"
                            : sub?.status === "COMPILATION_ERROR"
                            ? "bg-amber-50 border-amber-200"
                            : "bg-red-50 border-red-200"
                        }`}>
                          {isAccepted ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                          )}
                          <div>
                            <div className={`text-sm font-bold font-sans ${
                              isAccepted ? "text-emerald-700" : sub?.status === "COMPILATION_ERROR" ? "text-amber-700" : "text-red-600"
                            }`}>
                              {isAccepted ? "Accepted" : sub?.status === "COMPILATION_ERROR" ? "Compilation Error" : sub?.status === "RUNTIME_ERROR" ? "Runtime Error" : sub?.status === "TIME_LIMIT_EXCEEDED" ? "Time Limit Exceeded" : "Wrong Answer"}
                            </div>
                            <div className="text-[11px] text-zinc-500 font-sans">{passed} / {total} test cases passed</div>
                          </div>
                          <div className="ml-auto flex items-center gap-4 font-sans">
                            <div className="text-center">
                              <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Runtime</div>
                              <div className="text-xs font-bold text-zinc-800">{runtime} ms</div>
                            </div>
                            <div className="text-center">
                              <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Memory</div>
                              <div className="text-xs font-bold text-zinc-800">{(memory / 1024).toFixed(1)} MB</div>
                            </div>
                          </div>
                        </div>

                        {/* Test Case Grid */}
                        {results.length > 0 && (
                          <div>
                            <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-2 font-sans">Test Cases</div>
                            <div className="flex flex-wrap gap-1.5">
                              {results.map((r: any, i: number) => (
                                <div
                                  key={i}
                                  title={`Test ${i + 1}: ${r.passed ? 'Passed' : 'Failed'}${r.runtimeMs ? ` · ${r.runtimeMs}ms` : ''}`}
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold font-sans border cursor-default transition-colors ${
                                    r.passed
                                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                      : "bg-red-50 border-red-200 text-red-600"
                                  }`}
                                >
                                  {r.passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                </div>
                              ))}
                            </div>
                            <div className="mt-1.5 text-[10px] text-zinc-400 font-sans">
                              {results.map((r: any, i: number) => (
                                <span key={i} className={`mr-1 ${r.passed ? "text-emerald-600" : "text-red-500"}`}>{i + 1}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  {!submitting && !submissionResult && (
                    <div className="text-zinc-400 text-[11px] italic">Submit your code to see the verdict here.</div>
                  )}
                </div>
              )}

              {/* SUBMISSION HISTORY */}
              {activeConsoleTab === "history" && (
                <div className="font-sans">
                  {loadingHistory ? (
                    <div className="p-4 flex items-center gap-2 text-zinc-500 text-xs">
                      <div className="w-3.5 h-3.5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                      Loading submissions...
                    </div>
                  ) : selectedHistoryItem ? (
                    <div className="p-4 space-y-3">
                      <button
                        onClick={() => setSelectedHistoryItem(null)}
                        className="flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-zinc-800 cursor-pointer"
                      >
                        <ChevronLeft className="w-3 h-3" /> Back to History
                      </button>
                      {/* Verdict */}
                      <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-xs ${
                        selectedHistoryItem.status === "ACCEPTED"
                          ? "bg-emerald-50 border-emerald-200"
                          : "bg-red-50 border-red-200"
                      }`}>
                        {selectedHistoryItem.status === "ACCEPTED" ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className={`font-bold ${
                          selectedHistoryItem.status === "ACCEPTED" ? "text-emerald-700" : "text-red-600"
                        }`}>{selectedHistoryItem.status?.replace(/_/g, " ")}</span>
                        <span className="ml-auto text-zinc-500">{selectedHistoryItem.passedTests}/{selectedHistoryItem.totalTests} passed</span>
                        <span className="text-zinc-400">|</span>
                        <span className="text-zinc-600">{selectedHistoryItem.runtimeMs} ms</span>
                        <span className="text-zinc-400">|</span>
                        <span className="text-zinc-600">{((selectedHistoryItem.memoryKb || 0) / 1024).toFixed(1)} MB</span>
                      </div>
                      {/* Submitted Code */}
                      <div>
                        <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-1.5">Submitted Code</div>
                        <pre className="bg-[#1e1e1e] text-[#d4d4d4] rounded-lg p-3 text-[11px] leading-relaxed overflow-x-auto whitespace-pre-wrap">{selectedHistoryItem.sourceCode}</pre>
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        Submitted {new Date(selectedHistoryItem.createdAt).toLocaleString()} · {selectedHistoryItem.language?.toUpperCase()}
                      </div>
                    </div>
                  ) : submissionHistory.length > 0 ? (
                    <div>
                      {/* Header Row */}
                      <div className="grid grid-cols-4 gap-2 px-4 py-2 border-b border-zinc-100 text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                        <div>Status</div>
                        <div>Language</div>
                        <div>Runtime</div>
                        <div>Date</div>
                      </div>
                      {/* Rows */}
                      {submissionHistory.map((sub: any, idx: number) => {
                        const isAccepted = sub.status === "ACCEPTED";
                        const msAgo = Date.now() - new Date(sub.createdAt).getTime();
                        const minsAgo = Math.floor(msAgo / 60000);
                        const timeLabel = minsAgo < 1 ? "Just now" : minsAgo < 60 ? `${minsAgo} min ago` : new Date(sub.createdAt).toLocaleDateString();
                        return (
                          <button
                            key={idx}
                            onClick={() => setSelectedHistoryItem(sub)}
                            className="w-full grid grid-cols-4 gap-2 px-4 py-2.5 border-b border-zinc-50 hover:bg-zinc-50 text-left transition-colors cursor-pointer"
                          >
                            <div className={`flex items-center gap-1.5 text-xs font-semibold ${
                              isAccepted ? "text-emerald-600" : sub.status === "COMPILATION_ERROR" ? "text-amber-600" : sub.status === "TIME_LIMIT_EXCEEDED" ? "text-orange-600" : "text-red-500"
                            }`}>
                              {isAccepted ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              {isAccepted ? "Accepted" : sub.status === "COMPILATION_ERROR" ? "Compile Err" : sub.status === "TIME_LIMIT_EXCEEDED" ? "TLE" : sub.status === "RUNTIME_ERROR" ? "Runtime Err" : "Wrong Answer"}
                            </div>
                            <div className="text-xs text-zinc-600 capitalize">{sub.language}</div>
                            <div className="text-xs text-zinc-600">{sub.status === "TIME_LIMIT_EXCEEDED" ? ">2 sec" : `${sub.runtimeMs} ms`}</div>
                            <div className="text-xs text-zinc-400">{timeLabel}</div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 text-zinc-400 text-[11px] italic">No submissions yet for this problem.</div>
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
