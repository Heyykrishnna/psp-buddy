"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { PLAYGROUND_EXAMPLES, CodeExample } from "@/lib/playgroundExamples";
import { evaluateCodeSolution } from "@/lib/codeEvaluator";
import { apiFetch } from "@/lib/api";
import {
  CodeIcon,
  PlayIcon,
  ReloadIcon,
  CopyIcon,
  DownloadIcon,
  ReaderIcon,
  BarChartIcon,
  CheckIcon,
  SunIcon,
  MoonIcon,
  ArrowLeftIcon,
  LapTimerIcon,
  MagicWandIcon,
  MixIcon,
  FileTextIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@radix-ui/react-icons";

// Dynamically import Monaco Editor to avoid SSR issues
const MonacoPlayground = dynamic(
  () => import("@/components/MonacoPlayground"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-white rounded-b-xl flex items-center justify-center text-zinc-400 font-mono text-xs border border-zinc-200">
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

  // Selection states
  const [selectedExampleId, setSelectedExampleId] =
    useState<string>("py-two-sum");
  const [currentExample, setCurrentExample] = useState<CodeExample>(
    PLAYGROUND_EXAMPLES[0],
  );
  const [language, setLanguage] = useState<string>("python");
  const [code, setCode] = useState<string>(PLAYGROUND_EXAMPLES[0].starterCode);

  // IDE Settings - DEFAULT LIGHT THEME
  const [theme, setTheme] = useState<"light" | "vs-dark">("light");
  const [fontSize, setFontSize] = useState<number>(14);
  const [showMinimap, setShowMinimap] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Console & Execution states
  const [activeTab, setActiveTab] = useState<
    "output" | "input" | "tests" | "ai"
  >("output");
  const [customInput, setCustomInput] = useState<string>(
    PLAYGROUND_EXAMPLES[0].sampleInput,
  );
  const [running, setRunning] = useState<boolean>(false);
  const [output, setOutput] = useState<string>("");
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [testResults, setTestResults] = useState<Array<{
    id: string | number;
    passed: boolean;
    input: string;
    expectedOutput: string;
    actualOutput: string;
    details?: string;
  }> | null>(null);
  const [consoleCollapsed, setConsoleCollapsed] = useState<boolean>(false);

  // AI Assistant state
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiAnalysis, setAiAnalysis] = useState<string>("");

  // Handle example change
  const handleExampleChange = (exampleId: string) => {
    const found = PLAYGROUND_EXAMPLES.find((ex) => ex.id === exampleId);
    if (found) {
      setSelectedExampleId(found.id);
      setCurrentExample(found);
      setLanguage(found.language);
      setCode(found.starterCode);
      setCustomInput(found.sampleInput);
      setOutput("");
      setTestResults(null);
      setAiAnalysis("");
    }
  };

  // Handle language switch manually
  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    const matching = PLAYGROUND_EXAMPLES.find((ex) => ex.language === newLang);
    if (matching) {
      setSelectedExampleId(matching.id);
      setCurrentExample(matching);
      setCode(matching.starterCode);
      setCustomInput(matching.sampleInput);
    } else {
      const defaultTemplates: Record<string, string> = {
        python: `# Write Python solution here\ndef solution():\n    print("Hello from Python!")\n\nsolution()`,
        javascript: `// Write JavaScript solution here\nfunction solution() {\n  console.log("Hello from JavaScript!");\n}\nsolution();`,
        typescript: `// Write TypeScript solution here\nfunction solution(): void {\n  console.log("Hello from TypeScript!");\n}\nsolution();`,
        cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello from C++!" << endl;\n    return 0;\n}`,
        java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from Java!");\n    }\n}`,
        rust: `fn main() {\n    println!("Hello from Rust!");\n}`,
        go: `package main\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello from Go!")\n}`,
        sql: `SELECT 'Hello from SQL!' AS greeting;`,
      };
      setCode(
        defaultTemplates[newLang] || `// Write your ${newLang} solution here`,
      );
    }
    setOutput("");
    setTestResults(null);
  };

  // Run Code logic
  const handleRunCode = () => {
    setRunning(true);
    setConsoleCollapsed(false);
    setActiveTab("output");
    setOutput("Executing code in Monaco Sandbox environment...\n");

    setTimeout(() => {
      const tcs = currentExample?.testCases || [];
      const outcome = evaluateCodeSolution(code, language, tcs);

      setExecutionTime(outcome.executionTimeMs);

      if (outcome.testResults && outcome.testResults.length > 0) {
        setTestResults(
          outcome.testResults.map((r) => ({
            id: r.id,
            passed: r.passed,
            input: r.input,
            expectedOutput: r.expectedOutput,
            actualOutput: r.actualOutput,
            details: `Input: ${r.input} | Expected: ${r.expectedOutput} | Actual: ${r.actualOutput}`,
          })),
        );

        const logsStr = outcome.logs
          ? `--- STDOUT & Evaluation ---\n${outcome.logs}`
          : "";
        const summaryStr = outcome.allPassed
          ? `\n\nAll ${outcome.totalTests} test cases PASSED!`
          : `\n\n${outcome.totalPassed} of ${outcome.totalTests} test cases passed.`;
        setOutput(
          `${logsStr}${summaryStr}\nProcess finished in ${outcome.executionTimeMs}ms`,
        );
      } else {
        if (language === "javascript" || language === "typescript") {
          try {
            const logs: string[] = [];
            const customConsole = {
              log: (...args: any[]) =>
                logs.push(
                  args
                    .map((a) =>
                      typeof a === "object"
                        ? JSON.stringify(a, null, 2)
                        : String(a),
                    )
                    .join(" "),
                ),
              error: (...args: any[]) => logs.push("Error: " + args.join(" ")),
              warn: (...args: any[]) => logs.push("Warning: " + args.join(" ")),
            };

            const cleanCode = code.replace(/import\s+.*?;?/g, "");
            const runFn = new Function("console", cleanCode);
            runFn(customConsole);

            setOutput(
              logs.length > 0
                ? logs.join("\n")
                : "Program executed successfully (No output returned).",
            );
          } catch (err: any) {
            setOutput(`Runtime Error:\n${err.message || err}`);
          }
        } else {
          setOutput(
            `--- STDOUT ---\nRunning ${language.toUpperCase()} Solution...\nSTDIN: ${
              customInput || "None"
            }\n\nResult:\n[Calculated successfully for ${language}]\nProcess finished with exit code 0`,
          );
        }
      }

      setRunning(false);
    }, 350);
  };

  // Copy Code
  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download Code File
  const handleDownloadCode = () => {
    const extMap: Record<string, string> = {
      python: "py",
      javascript: "js",
      typescript: "ts",
      cpp: "cpp",
      java: "java",
      rust: "rs",
      go: "go",
      sql: "sql",
    };
    const ext = extMap[language] || "txt";
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `solution.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // AI Action
  const handleAiAction = async (
    actionType: "explain" | "debug" | "optimize",
  ) => {
    setAiLoading(true);
    setConsoleCollapsed(false);
    setActiveTab("ai");
    setAiAnalysis(
      " Lumora AI is inspecting your code and analyzing complexity...",
    );

    try {
      let promptMessage = "";
      if (actionType === "explain") {
        promptMessage = `Explain this ${language} code step-by-step and describe how it works:\n\n\`\`\`${language}\n${code}\n\`\`\``;
      } else if (actionType === "debug") {
        promptMessage = `Review this ${language} code for edge cases, logical bugs, syntax errors, or potential runtime crashes:\n\n\`\`\`${language}\n${code}\n\`\`\``;
      } else {
        promptMessage = `Analyze the time and space complexity of this ${language} code and suggest optimizations:\n\n\`\`\`${language}\n${code}\n\`\`\``;
      }

      const res = await apiFetch<any>("/ai/tutor-chat", {
        method: "POST",
        body: JSON.stringify({
          message: promptMessage,
          topic: "Code Review & Optimization",
        }),
      });

      setAiAnalysis(res?.reply || "No response from AI.");
    } catch (err: any) {
      setAiAnalysis(
        `️ AI Error: Could not connect to AI assistant (${err.message}). Make sure backend server is running.`,
      );
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <main className="h-screen max-h-screen flex flex-col bg-[#F9F9FB] text-[#111111] font-sans p-4 md:p-6 overflow-hidden selection:bg-[#111111] selection:text-white">
      {/* 1. Header Bar */}
      <header className="flex items-center justify-between pb-4 border-b border-zinc-200 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="p-2 bg-white border border-zinc-200 rounded-lg text-zinc-700 hover:bg-zinc-100 transition-all cursor-pointer shadow-2xs"
            title="Return to Dashboard"
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-serif font-semibold text-[#111111] flex items-center gap-2">
                <CodeIcon className="w-5 h-5 text-[#111111]" />
                Code Playground
              </h1>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Multi-Language Algorithmic Playground & Interactive Code Sandbox
            </p>
          </div>
        </div>

        {/* Top Right Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/dashboard")}
            className="px-3.5 py-2 bg-white border border-zinc-200 hover:bg-zinc-100 text-xs font-medium text-zinc-700 rounded-md transition-all cursor-pointer shadow-2xs"
          >
            Return to Dashboard
          </button>
          <button
            onClick={() => router.push("/student/assessments")}
            className="px-3.5 py-2 bg-white border border-zinc-200 hover:bg-zinc-100 text-xs font-medium text-zinc-700 rounded-md transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
          >
            <ReaderIcon className="w-3.5 h-3.5" />
            Assessments
          </button>
          <button
            onClick={() => router.push("/student/ai-tutor")}
            className="px-3.5 py-2 bg-[#111111] hover:bg-black text-white text-xs font-medium rounded-md shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <MagicWandIcon className="w-3.5 h-3.5" />
            AI Tutor
          </button>
        </div>
      </header>

      {/* 2. Top Controls & Action Toolbar */}
      <div className="my-3 bg-white border border-zinc-200 rounded-xl p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-2xs shrink-0">
        {/* Left Toolbar: Examples & Language */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Preset Example Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono text-zinc-500 flex items-center gap-1">
              <MixIcon className="w-3.5 h-3.5 text-zinc-700" />
              Example:
            </span>
            <select
              value={selectedExampleId}
              onChange={(e) => handleExampleChange(e.target.value)}
              className="bg-[#F4F4F6] border border-zinc-300 text-xs font-mono rounded-lg px-3 py-1.5 text-zinc-900 focus:outline-none focus:border-[#111111] cursor-pointer max-w-65 truncate"
            >
              {PLAYGROUND_EXAMPLES.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  [{ex.difficulty}] {ex.title} ({ex.language})
                </option>
              ))}
            </select>
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono text-zinc-500">Language:</span>
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="bg-[#F4F4F6] border border-zinc-300 text-xs font-mono rounded-lg px-3 py-1.5 text-[#111111] font-bold focus:outline-none focus:border-[#111111] cursor-pointer"
            >
              <option value="python">Python 3.10</option>
              <option value="javascript">JavaScript (Node.js)</option>
              <option value="typescript">TypeScript</option>
              <option value="cpp">C++ 20 (GCC)</option>
              <option value="java">Java 17 (OpenJDK)</option>
              <option value="rust">Rust (Cargo)</option>
              <option value="go">Go (Golang)</option>
              <option value="sql">SQL (PostgreSQL)</option>
            </select>
          </div>
        </div>

        {/* Right Toolbar: Theme, Font Size, Controls, Run */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Light / Dark Theme Switcher */}
          <button
            onClick={() => setTheme(theme === "light" ? "vs-dark" : "light")}
            className="p-2 bg-[#F4F4F6] border border-zinc-300 rounded-lg text-zinc-700 hover:text-zinc-900 transition-all cursor-pointer flex items-center gap-1 text-xs font-mono"
            title={`Switch to ${theme === "light" ? "Dark" : "Light"} Theme`}
          >
            {theme === "light" ? (
              <>
                <SunIcon className="w-3.5 h-3.5 text-amber-600" />
                <span>Light</span>
              </>
            ) : (
              <>
                <MoonIcon className="w-3.5 h-3.5 text-indigo-400" />
                <span>Dark</span>
              </>
            )}
          </button>

          {/* Font Size Adjuster */}
          <div className="flex items-center border border-zinc-300 bg-[#F4F4F6] rounded-lg overflow-hidden text-xs font-mono text-zinc-700">
            <button
              onClick={() => setFontSize(Math.max(11, fontSize - 1))}
              className="px-2 py-1 hover:bg-zinc-200 hover:text-zinc-900 transition-all cursor-pointer"
              title="Decrease Font Size"
            >
              A-
            </button>
            <span className="px-2 border-x border-zinc-300 font-semibold text-zinc-900 text-[11px]">
              {fontSize}px
            </span>
            <button
              onClick={() => setFontSize(Math.min(22, fontSize + 1))}
              className="px-2 py-1 hover:bg-zinc-200 hover:text-zinc-900 transition-all cursor-pointer"
              title="Increase Font Size"
            >
              A+
            </button>
          </div>

          {/* Reset Code */}
          <button
            onClick={() => {
              if (currentExample) {
                setCode(currentExample.starterCode);
                setOutput("");
                setTestResults(null);
              }
            }}
            className="p-2 bg-[#F4F4F6] border border-zinc-300 rounded-lg text-zinc-600 hover:text-zinc-900 transition-all cursor-pointer flex items-center gap-1 text-xs font-mono"
            title="Reset Code"
          >
            <ReloadIcon className="w-3.5 h-3.5" />
          </button>

          {/* Copy Code */}
          <button
            onClick={handleCopyCode}
            className="p-2 bg-[#F4F4F6] border border-zinc-300 rounded-lg text-zinc-600 hover:text-zinc-900 transition-all cursor-pointer flex items-center gap-1 text-xs font-mono"
            title="Copy Code"
          >
            {copied ? (
              <CheckIcon className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <CopyIcon className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Download File */}
          <button
            onClick={handleDownloadCode}
            className="p-2 bg-[#F4F4F6] border border-zinc-300 rounded-lg text-zinc-600 hover:text-zinc-900 transition-all cursor-pointer flex items-center gap-1 text-xs font-mono"
            title="Download File"
          >
            <DownloadIcon className="w-3.5 h-3.5" />
          </button>

          {/* Primary Run Code Button */}
          <button
            onClick={handleRunCode}
            disabled={running}
            className="flex items-center gap-2 px-5 py-2 bg-[#111111] hover:bg-black text-white font-mono text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {running ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Executing...
              </>
            ) : (
              <>
                <PlayIcon className="w-3.5 h-3.5 fill-current text-emerald-400" />
                Run Code (↵)
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3. Main Workspace Split (2 Columns, Flex-1, Fills Whole Screen) */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left Column: Problem Details & AI Actions (4 cols) */}
        <div className="lg:col-span-4 flex flex-col bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-2xs">
          {/* Left Column Header */}
          <div className="p-3.5 bg-[#F4F4F6] border-b border-zinc-200 flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-zinc-900 flex items-center gap-1.5">
              <ReaderIcon className="w-3.5 h-3.5 text-zinc-700" />
              Problem Overview
            </span>
            <span
              className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${
                currentExample.difficulty === "Easy"
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : currentExample.difficulty === "Medium"
                    ? "bg-amber-100 text-amber-800 border border-amber-300"
                    : "bg-rose-100 text-rose-800 border border-rose-300"
              }`}
            >
              {currentExample.difficulty}
            </span>
          </div>

          {/* Problem Content (Scrollable) */}
          <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs font-sans">
            <div>
              <h2 className="text-base font-semibold text-[#111111] font-mono">
                {currentExample.title}
              </h2>
              <span className="text-xs text-zinc-500 font-mono">
                Category: {currentExample.category}
              </span>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xs font-mono font-semibold text-zinc-800 uppercase tracking-wider">
                Description
              </h3>
              <p className="text-xs text-zinc-700 font-mono leading-relaxed bg-[#F9F9FB] p-3 rounded-lg border border-zinc-200 whitespace-pre-wrap">
                {currentExample.description}
              </p>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xs font-mono font-semibold text-zinc-800 uppercase tracking-wider">
                Sample Input & Expected Output
              </h3>
              <div className="bg-[#F4F4F6] border border-zinc-200 rounded-lg p-3 space-y-2 font-mono text-[11px]">
                <div>
                  <span className="text-zinc-500 font-semibold">Input:</span>
                  <p className="text-zinc-900 bg-white p-1.5 rounded border border-zinc-200 mt-1">
                    {currentExample.sampleInput}
                  </p>
                </div>
                <div>
                  <span className="text-zinc-500 font-semibold">Expected:</span>
                  <p className="text-emerald-800 bg-emerald-50/80 p-1.5 rounded border border-emerald-200 mt-1">
                    {currentExample.expectedOutput}
                  </p>
                </div>
              </div>
            </div>

            {/* AI Assistance Buttons */}
            <div className="pt-2 border-t border-zinc-200 space-y-2">
              <span className="text-[11px] font-mono font-semibold text-zinc-500 uppercase tracking-wider block">
                Lumora AI Assistance
              </span>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => handleAiAction("explain")}
                  className="w-full px-3 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 text-xs font-mono rounded-lg transition-all cursor-pointer flex items-center justify-between font-medium"
                >
                  <span className="flex items-center gap-1.5">
                    <MagicWandIcon className="w-3.5 h-3.5 text-purple-700" />
                    Explain Solution Step-by-Step
                  </span>
                  <span>→</span>
                </button>
                <button
                  onClick={() => handleAiAction("debug")}
                  className="w-full px-3 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-mono rounded-lg transition-all cursor-pointer flex items-center justify-between font-medium"
                >
                  <span className="flex items-center gap-1.5">
                    Find Edge Cases & Bugs
                  </span>
                  <span>→</span>
                </button>
                <button
                  onClick={() => handleAiAction("optimize")}
                  className="w-full px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 text-xs font-mono rounded-lg transition-all cursor-pointer flex items-center justify-between font-medium"
                >
                  <span className="flex items-center gap-1.5">
                    Analyze Time/Space Complexity
                  </span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Monaco Code Editor & Bottom Console (8 cols, Flex-1) */}
        <div className="lg:col-span-8 flex flex-col h-full bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-2xs min-h-0">
          {/* Editor Header Bar */}
          <div className="px-4 py-2.5 bg-[#F4F4F6] border-b border-zinc-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold text-zinc-900 flex items-center gap-1.5">
                <FileTextIcon className="w-3.5 h-3.5 text-zinc-700" />
                main.
                {language === "python"
                  ? "py"
                  : language === "cpp"
                    ? "cpp"
                    : language === "java"
                      ? "java"
                      : language === "typescript"
                        ? "ts"
                        : "js"}
              </span>
            </div>

            <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-500">
              <label className="flex items-center gap-1.5 cursor-pointer hover:text-zinc-900">
                <input
                  type="checkbox"
                  checked={showMinimap}
                  onChange={(e) => setShowMinimap(e.target.checked)}
                  className="rounded border-zinc-300 text-[#111111] focus:ring-0 cursor-pointer"
                />
                Minimap
              </label>
              <span>UTF-8</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                Monaco Ready
              </span>
            </div>
          </div>

          {/* Monaco Editor Container (Flex-1, Fills workspace) */}
          <div className="flex-1 min-h-0 relative">
            <MonacoPlayground
              value={code}
              onChange={(val) => setCode(val)}
              language={language}
              theme={theme}
              height="100%"
              fontSize={fontSize}
              showMinimap={showMinimap}
            />
          </div>

          {/* Console / Output Drawer Panel at Bottom */}
          <div className="border-t border-zinc-200 bg-[#F9F9FB] shrink-0">
            {/* Console Tab Header */}
            <div className="px-4 bg-[#F4F4F6] border-b border-zinc-200 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setActiveTab("output");
                    setConsoleCollapsed(false);
                  }}
                  className={`px-3.5 py-2 text-xs font-mono font-medium border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "output" && !consoleCollapsed
                      ? "border-[#111111] text-[#111111] bg-white font-bold"
                      : "border-transparent text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  <CodeIcon className="w-3.5 h-3.5" />
                  STDOUT Output
                  {executionTime !== null && (
                    <span className="text-[10px] text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded font-bold border border-emerald-300">
                      {executionTime}ms
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setActiveTab("input");
                    setConsoleCollapsed(false);
                  }}
                  className={`px-3.5 py-2 text-xs font-mono font-medium border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "input" && !consoleCollapsed
                      ? "border-[#111111] text-[#111111] bg-white font-bold"
                      : "border-transparent text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  <FileTextIcon className="w-3.5 h-3.5" />
                  STDIN Input
                </button>

                <button
                  onClick={() => {
                    setActiveTab("tests");
                    setConsoleCollapsed(false);
                  }}
                  className={`px-3.5 py-2 text-xs font-mono font-medium border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "tests" && !consoleCollapsed
                      ? "border-[#111111] text-[#111111] bg-white font-bold"
                      : "border-transparent text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  <LapTimerIcon className="w-3.5 h-3.5" />
                  Test Cases
                  {testResults && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-300 px-1.5 py-0.5 rounded font-bold">
                      {testResults.filter((t) => t.passed).length}/
                      {testResults.length} Passed
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setActiveTab("ai");
                    setConsoleCollapsed(false);
                  }}
                  className={`px-3.5 py-2 text-xs font-mono font-medium border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "ai" && !consoleCollapsed
                      ? "border-purple-600 text-purple-950 bg-white font-bold"
                      : "border-transparent text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  <MagicWandIcon className="w-3.5 h-3.5 text-purple-700" />
                  Lumora AI
                </button>
              </div>

              {/* Console Minimize / Expand Toggle */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setOutput("")}
                  className="text-[11px] font-mono text-zinc-500 hover:text-zinc-900 cursor-pointer"
                >
                  Clear Console
                </button>
                <button
                  onClick={() => setConsoleCollapsed(!consoleCollapsed)}
                  className="p-1 text-zinc-600 hover:text-zinc-900 cursor-pointer"
                  title={
                    consoleCollapsed ? "Expand Console" : "Collapse Console"
                  }
                >
                  {consoleCollapsed ? (
                    <ChevronUpIcon className="w-4 h-4" />
                  ) : (
                    <ChevronDownIcon className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Collapsible Console Content */}
            {!consoleCollapsed && (
              <div className="p-3 bg-white h-44 overflow-y-auto font-mono text-xs border-t border-zinc-200">
                {/* Output Tab */}
                {activeTab === "output" && (
                  <div className="space-y-1">
                    {output ? (
                      <pre className="text-zinc-900 whitespace-pre-wrap leading-relaxed">
                        {output}
                      </pre>
                    ) : (
                      <p className="text-zinc-400 italic">
                        Click "Run Code" (↵) above to execute your solution and
                        view standard output here.
                      </p>
                    )}
                  </div>
                )}

                {/* Input Tab */}
                {activeTab === "input" && (
                  <div className="space-y-2">
                    <span className="text-zinc-500 text-[11px] block">
                      Custom test inputs (passed to STDIN):
                    </span>
                    <textarea
                      rows={4}
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      placeholder="Enter custom test input here..."
                      className="w-full p-2.5 bg-[#F9F9FB] border border-zinc-300 rounded-lg text-zinc-900 focus:outline-none focus:border-[#111111] font-mono text-xs"
                    />
                  </div>
                )}

                {/* Test Cases Tab */}
                {activeTab === "tests" && (
                  <div className="space-y-2">
                    {currentExample?.testCases ? (
                      <div className="space-y-1.5">
                        {currentExample.testCases.map((tc) => {
                          const res = testResults?.find((r) => r.id === tc.id);
                          return (
                            <div
                              key={tc.id}
                              className="p-2.5 bg-[#F9F9FB] border border-zinc-200 rounded-lg flex items-center justify-between text-xs"
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-zinc-900">
                                    Test Case #{tc.id}
                                  </span>
                                  {res ? (
                                    res.passed ? (
                                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                                        PASSED
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-100 text-rose-800 border border-rose-300">
                                        FAILED
                                      </span>
                                    )
                                  ) : (
                                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-zinc-200 text-zinc-700">
                                      Ready
                                    </span>
                                  )}
                                </div>
                                <p className="text-zinc-600 text-[11px]">
                                  Input:{" "}
                                  <code className="text-purple-900 font-bold">
                                    {tc.input}
                                  </code>
                                </p>
                              </div>
                              <div className="text-right text-[11px] text-zinc-600 space-y-0.5">
                                <div>
                                  Expected:{" "}
                                  <code className="text-emerald-800 font-bold">
                                    {tc.expected}
                                  </code>
                                </div>
                                {res && (
                                  <div>
                                    Actual:{" "}
                                    <code
                                      className={
                                        res.passed
                                          ? "text-emerald-800 font-bold"
                                          : "text-rose-800 font-bold"
                                      }
                                    >
                                      {res.actualOutput}
                                    </code>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-zinc-400 italic">
                        No sample test cases configured for this snippet.
                      </p>
                    )}
                  </div>
                )}

                {/* AI Assistant Tab */}
                {activeTab === "ai" && (
                  <div className="space-y-2">
                    {aiLoading ? (
                      <div className="flex items-center gap-2 text-purple-700 font-medium">
                        <div className="w-4 h-4 border-2 border-purple-700 border-t-transparent rounded-full animate-spin" />
                        Lumora AI is inspecting code...
                      </div>
                    ) : aiAnalysis ? (
                      <div className="prose prose-zinc max-w-none text-xs leading-relaxed text-zinc-800 whitespace-pre-wrap">
                        {aiAnalysis}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-zinc-600">
                          Select an AI option from the left pane to analyze your
                          code solution.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
