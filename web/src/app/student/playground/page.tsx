"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { PLAYGROUND_EXAMPLES, CodeExample } from "@/lib/playgroundExamples";
import { evaluateCodeSolution } from "@/lib/codeEvaluator";
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
  Code2,
  ChevronDown,
  Terminal,
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

  // Selected Problem / Example
  const [selectedExampleId, setSelectedExampleId] = useState<string>("py-two-sum");
  const [currentExample, setCurrentExample] = useState<CodeExample>(PLAYGROUND_EXAMPLES[0]);
  const [language, setLanguage] = useState<string>("python");
  const [code, setCode] = useState<string>(PLAYGROUND_EXAMPLES[0].starterCode);

  // Layout & UI State
  const [activeLeftTab, setActiveLeftTab] = useState<"question" | "ai" | "hints">("question");
  const [activeConsoleTab, setActiveConsoleTab] = useState<"input" | "output" | "error" | "tests">("output");
  const [customInput, setCustomInput] = useState<string>(PLAYGROUND_EXAMPLES[0].sampleInput);
  
  // Execution & Output state
  const [running, setRunning] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [output, setOutput] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<any[] | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

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
      setSubmitSuccess(false);
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
  const handleSubmitCode = () => {
    setSubmitting(true);
    handleRunCode();
    setTimeout(() => {
      setSubmitting(false);
      setSubmitSuccess(true);
      setActiveConsoleTab("tests");
    }, 600);
  };

  return (
    <main className="h-screen w-screen overflow-hidden bg-[#F8F9FA] text-[#111111] font-sans flex flex-col selection:bg-blue-600 selection:text-white">
      {/* ── TOP NAVBAR HEADER (Matching Image 2) ────────────────────────────────── */}
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

        {/* Right: Stats & Action Buttons (Run / Submit) */}
        <div className="flex items-center gap-3">
          {/* XP Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-bold text-amber-900 font-mono">
            <span className="text-zinc-500 text-[11px] font-sans font-semibold">Total XP</span>
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>31,923</span>
          </div>

          <button
            title="Bookmark Problem"
            className="p-1.5 text-zinc-400 hover:text-zinc-800 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <Bookmark className="w-4 h-4" />
          </button>

          {/* Run Button */}
          <button
            onClick={handleRunCode}
            disabled={running}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-zinc-300 hover:bg-zinc-100 text-zinc-800 text-xs font-semibold rounded-lg shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-zinc-800" />
            <span>{running ? "Running..." : "Run"}</span>
          </button>

          {/* Submit Button */}
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

      {/* ── MAIN 2-PANEL WORKSPACE SPLIT (Matching Image 2) ──────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Far Left Navigation Icon Rail */}
        <aside className="w-12 bg-white border-r border-zinc-200 flex flex-col items-center justify-between py-3 shrink-0">
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={() => setActiveLeftTab("question")}
              title="Question Description"
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                activeLeftTab === "question"
                  ? "text-zinc-900 bg-zinc-100"
                  : "text-zinc-400 hover:text-zinc-800 hover:bg-zinc-50"
              }`}
            >
              <FileText className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveLeftTab("ai")}
              title="AI Assistant & Explanations"
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                activeLeftTab === "ai"
                  ? "text-zinc-900 bg-zinc-100"
                  : "text-zinc-400 hover:text-zinc-800 hover:bg-zinc-50"
              }`}
            >
              <Sparkles className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveLeftTab("hints")}
              title="Hints & Solution"
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                activeLeftTab === "hints"
                  ? "text-zinc-900 bg-zinc-100"
                  : "text-zinc-400 hover:text-zinc-800 hover:bg-zinc-50"
              }`}
            >
              <Lightbulb className="w-4 h-4" />
            </button>
          </div>

          <button
            title="IDE Settings"
            className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>
        </aside>

        {/* ── LEFT PANEL: QUESTION / PROBLEM STATEMENT ────────────────────────── */}
        <section className="w-5/12 bg-white border-r border-zinc-200 flex flex-col overflow-hidden">
          {/* Header Bar */}
          <div className="h-10 border-b border-zinc-200 px-4 flex items-center justify-between bg-zinc-50/60 shrink-0">
            <div className="flex items-center gap-2 text-[11px] font-mono font-bold uppercase text-zinc-500 tracking-wider">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>QUESTION</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-400">
              <button title="Minimize" className="hover:text-zinc-700 cursor-pointer">
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Scrollable Problem Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-zinc-800 text-xs leading-relaxed font-sans">
            {/* Problem Title */}
            <div>
              <h2 className="text-lg font-bold text-zinc-900">
                {currentExample.title}
              </h2>
            </div>

            {/* Badges Row (Difficulty, Multiplier, Points) */}
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

            {/* Limits Specs */}
            <div className="text-[11px] font-mono text-zinc-400">
              Time Limit: 2s, Memory Limit: 128000
            </div>

            {/* Problem Description */}
            <div className="space-y-2">
              <p className="whitespace-pre-wrap leading-relaxed text-zinc-700 font-sans">
                {currentExample.description}
              </p>
            </div>

            {/* User Task */}
            <div className="space-y-1">
              <h3 className="font-bold text-zinc-900 text-xs">User Task:</h3>
              <p className="text-zinc-600 leading-relaxed font-sans">
                Since this is a functional problem, you don&apos;t have to take input. You just have to complete the solution function that processes the parameters and returns the output.
              </p>
            </div>

            {/* Constraints */}
            <div className="space-y-1.5">
              <h3 className="font-bold text-zinc-900 text-xs">Constraints:</h3>
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg font-mono text-[11px] text-zinc-800 space-y-1">
                <div>1 ≤ N ≤ 1000</div>
                <div>0 ≤ Element.data ≤ 100</div>
              </div>
            </div>

            {/* Example Sample Input / Output Box */}
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
        </section>

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
              theme="vs-dark"
              height="100%"
            />
          </div>

          {/* Bottom Console Panel (INPUT / OUTPUT / ERROR / TEST RESULTS) */}
          <div className="h-52 border-t border-zinc-200 flex flex-col bg-white shrink-0">
            {/* Console Tab Header */}
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

            {/* Console Body Tab Content */}
            <div className="flex-1 p-4 font-mono text-xs overflow-y-auto bg-zinc-50/40">
              {/* Tab 1: Custom Input */}
              {activeConsoleTab === "input" && (
                <div className="space-y-2 h-full flex flex-col">
                  <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                    Custom STDIN Input:
                  </label>
                  <textarea
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    className="flex-1 w-full p-3 bg-white border border-zinc-200 rounded-lg text-xs font-mono text-zinc-800 focus:outline-none"
                    placeholder="Enter custom input..."
                  />
                </div>
              )}

              {/* Tab 2: Output */}
              {activeConsoleTab === "output" && (
                <div className="space-y-2">
                  {output ? (
                    <pre className="text-zinc-900 leading-relaxed whitespace-pre-wrap">
                      {output}
                    </pre>
                  ) : (
                    <div className="text-zinc-400 text-[11px] italic">
                      Click &quot;Run&quot; or &quot;Submit&quot; to execute your code and see execution results.
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Error */}
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

              {/* Tab 4: Test Results */}
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
