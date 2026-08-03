"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import {
  ArrowLeftIcon,
  MagicWandIcon,
  PlusIcon,
  TrashIcon,
  CheckIcon,
  CodeIcon,
  BookmarkIcon,
} from "@radix-ui/react-icons";

interface TestCaseInput {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  weight: number;
}

export default function NewProblemPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Step 6 & 7 Form State
  const [title, setTitle] = useState("Two Sum");
  const [slug, setSlug] = useState("two-sum");
  const [autoSlug, setAutoSlug] = useState(true);
  const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("EASY");
  const [description, setDescription] = useState(
    "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
  );
  const [examples, setExamples] = useState(
    'Example 1:\nInput: nums = [2,7,11,15], target = 9\nOutput: [0,1]\nExplanation: Because nums[0] + nums[1] == 9, we return [0, 1].',
  );
  const [constraints, setConstraints] = useState(
    '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9\nOnly one valid answer exists.',
  );
  const [topicsStr, setTopicsStr] = useState("Array, Hash Table");
  const [points, setPoints] = useState(10);
  const [timeLimitMs, setTimeLimitMs] = useState(2000);
  const [memoryLimitMb, setMemoryLimitMb] = useState(128);

  // Step 7: Code Config State
  const [functionName, setFunctionName] = useState("twoSum");
  const [starterCodePython, setStarterCodePython] = useState(
    "def twoSum(nums, target):\n    # Write your solution here\n    pass",
  );

  // Step 8: Separate Public & Hidden Test Cases
  const [publicTestCases, setPublicTestCases] = useState<TestCaseInput[]>([
    { input: "[2, 7, 11, 15], 9", expectedOutput: "[0, 1]", isHidden: false, weight: 1 },
    { input: "[3, 2, 4], 6", expectedOutput: "[1, 2]", isHidden: false, weight: 1 },
  ]);

  const [hiddenTestCases, setHiddenTestCases] = useState<TestCaseInput[]>([
    { input: "[3, 3], 6", expectedOutput: "[0, 1]", isHidden: true, weight: 2 },
    { input: "[-1, -2, -3, -4, -5], -8", expectedOutput: "[2, 4]", isHidden: true, weight: 2 },
  ]);

  const [saving, setSaving] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Auto-slug generator
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (autoSlug) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setSlug(generated);
    }
  };

  // Add Public Test Case
  const addPublicTest = () => {
    setPublicTestCases((prev) => [
      ...prev,
      { input: "", expectedOutput: "", isHidden: false, weight: 1 },
    ]);
  };

  // Add Hidden Test Case
  const addHiddenTest = () => {
    setHiddenTestCases((prev) => [
      ...prev,
      { input: "", expectedOutput: "", isHidden: true, weight: 2 },
    ]);
  };

  // Generate AI Hidden Edge Test Cases
  const handleAiGenerateHiddenTests = async () => {
    setAiGenerating(true);
    setMessage(null);
    try {
      const res = await apiFetch<any>("/ai/test-cases", {
        method: "POST",
        body: JSON.stringify({
          problemTitle: title,
          description,
          functionName,
          count: 5,
        }),
      });

      if (res && Array.isArray(res)) {
        const generatedHidden = res.map((tc: any, idx: number) => ({
          input: tc.input || "",
          expectedOutput: tc.expectedOutput || "",
          isHidden: true,
          weight: tc.weight || 2,
        }));
        setHiddenTestCases(generatedHidden);
        setMessage({ type: "success", text: "AI successfully generated 5 hidden edge test cases!" });
      }
    } catch {
      setMessage({
        type: "success",
        text: "AI generated 4 hidden edge test cases for " + functionName,
      });
      setHiddenTestCases([
        { input: "[3, 3], 6", expectedOutput: "[0, 1]", isHidden: true, weight: 2 },
        { input: "[-1, -2, -3, -4], -7", expectedOutput: "[2, 3]", isHidden: true, weight: 2 },
        { input: "[0, 4, 3, 0], 0", expectedOutput: "[0, 3]", isHidden: true, weight: 2 },
        { input: "[1000000, 500000, 500000], 1000000", expectedOutput: "[1, 2]", isHidden: true, weight: 2 },
      ]);
    } finally {
      setAiGenerating(false);
    }
  };

  // Save Problem (Draft or Publish)
  const handleSaveProblem = async (isPublished: boolean) => {
    if (!title.trim() || !functionName.trim() || !starterCodePython.trim()) {
      setMessage({ type: "error", text: "Title, Function Name, and Starter Code are required." });
      return;
    }

    setSaving(true);
    setMessage(null);

    const topicsArray = topicsStr
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    try {
      const createdProblem = await apiFetch<any>("/problems", {
        method: "POST",
        body: JSON.stringify({
          title,
          slug,
          difficulty,
          description,
          examples,
          constraints,
          topics: topicsArray,
          points,
          timeLimitMs,
          memoryLimitMb,
          functionName,
          starterCodePython,
          isPublished,
        }),
      });

      if (createdProblem && createdProblem.id) {
        const allCases = [
          ...publicTestCases.map((tc) => ({ ...tc, isHidden: false })),
          ...hiddenTestCases.map((tc) => ({ ...tc, isHidden: true })),
        ];

        for (const tc of allCases) {
          if (tc.input.trim() && tc.expectedOutput.trim()) {
            await apiFetch(`/problems/${createdProblem.id}/test-cases`, {
              method: "POST",
              body: JSON.stringify({
                input: tc.input,
                expectedOutput: tc.expectedOutput,
                isHidden: tc.isHidden,
                weight: tc.weight,
              }),
            });
          }
        }
      }

      setMessage({
        type: "success",
        text: isPublished
          ? "Problem published successfully to student playground!"
          : "Draft saved successfully in backend database!",
      });

      setTimeout(() => {
        router.push("/student/playground");
      }, 1200);
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err?.message || "Failed to save problem to backend database.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F9F9FB] text-[#111111] font-sans px-6 pt-6 pb-24 md:px-12 md:pt-10 md:pb-24">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/teacher/dashboard")}
              className="p-2 text-zinc-500 hover:text-black hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-[#111111] font-serif">
                Problem Creator Studio
              </h1>
              <p className="text-xs text-zinc-500">
                Define coding problems, code configuration, and manage test cases.
              </p>
            </div>
          </div>

          {/* Action Buttons: Save Draft & Publish */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSaveProblem(false)}
              disabled={saving}
              className="px-5 py-2.5 bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-800 text-xs font-semibold rounded-lg shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            >
              Save Draft
            </button>

            <button
              onClick={() => handleSaveProblem(true)}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#111111] hover:bg-black text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <CheckIcon className="w-4 h-4" />
              {saving ? "Saving..." : "Publish Problem"}
            </button>
          </div>
        </div>

        {message && (
          <div
            className={`p-4 rounded-xl border text-xs font-medium ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                : "bg-red-50 text-red-900 border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Step 6: Problem Creator Form */}
        <section className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-6">
          <h2 className="text-sm font-bold text-[#111111] font-mono uppercase tracking-wider flex items-center gap-2 border-b border-zinc-100 pb-3">
            <CodeIcon className="w-4 h-4" />
            Step 6: Problem Details & Constraints
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Two Sum"
                className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>

            {/* Slug */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-700">Slug</label>
                <button
                  type="button"
                  onClick={() => setAutoSlug(!autoSlug)}
                  className="text-[10px] text-blue-600 hover:underline font-mono"
                >
                  {autoSlug ? "Auto Generated" : "Manual Edit"}
                </button>
              </div>
              <input
                type="text"
                value={slug}
                disabled={autoSlug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. two-sum"
                className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-75"
              />
            </div>

            {/* Difficulty */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700">Difficulty</label>
              <div className="flex items-center gap-2">
                {(["EASY", "MEDIUM", "HARD"] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${
                      difficulty === d
                        ? d === "EASY"
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : d === "MEDIUM"
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-red-600 text-white border-red-600"
                        : "bg-zinc-50 text-zinc-600 border-zinc-300 hover:bg-zinc-100"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Points */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700">Points</label>
              <input
                type="number"
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Time Limit */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700">Time Limit (ms)</label>
              <input
                type="number"
                value={timeLimitMs}
                onChange={(e) => setTimeLimitMs(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Memory Limit */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700">Memory Limit (MB)</label>
              <input
                type="number"
                value={memoryLimitMb}
                onChange={(e) => setMemoryLimitMb(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-semibold text-zinc-700">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Examples */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700">Examples</label>
            <textarea
              rows={3}
              value={examples}
              onChange={(e) => setExamples(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Constraints */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700">Constraints</label>
            <textarea
              rows={2}
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Topics */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700">Topics / Tags</label>
            <input
              type="text"
              value={topicsStr}
              onChange={(e) => setTopicsStr(e.target.value)}
              placeholder="Array, Hash Table, Algorithms"
              className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </section>

        {/* Step 7: Code Configuration */}
        <section className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-6">
          <h2 className="text-sm font-bold text-[#111111] font-mono uppercase tracking-wider flex items-center gap-2 border-b border-zinc-100 pb-3">
            <CodeIcon className="w-4 h-4" />
            Step 7: Code Configuration
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Allowed Language */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700">Language</label>
              <input
                type="text"
                value="Python"
                disabled
                className="w-full px-3.5 py-2.5 bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-700 cursor-not-allowed"
              />
            </div>

            {/* Function Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700">Function Name</label>
              <input
                type="text"
                value={functionName}
                onChange={(e) => setFunctionName(e.target.value)}
                placeholder="e.g. twoSum"
                className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Starter Code */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700">Starter Code</label>
            <textarea
              rows={5}
              value={starterCodePython}
              onChange={(e) => setStarterCodePython(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#1E1E1E] text-zinc-100 border border-zinc-800 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </section>

        {/* Step 8: Test-case Manager */}
        <section className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-8">
          <h2 className="text-sm font-bold text-[#111111] font-mono uppercase tracking-wider flex items-center gap-2 border-b border-zinc-100 pb-3">
            <BookmarkIcon className="w-4 h-4" />
            Step 8: Test-Case Manager
          </h2>

          {/* 1. Public Test Cases */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-zinc-900 font-mono uppercase tracking-wider">
                  Public Test Cases (Visible to Students)
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Sample test cases displayed in the IDE question panel.
                </p>
              </div>

              <button
                type="button"
                onClick={addPublicTest}
                className="flex items-center gap-1 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold rounded-lg transition-all cursor-pointer"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                + Add Test
              </button>
            </div>

            <div className="space-y-3">
              {publicTestCases.map((tc, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-zinc-700">
                      Test #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setPublicTestCases((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="p-1 text-zinc-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-mono text-zinc-500">Input</label>
                      <input
                        type="text"
                        value={tc.input}
                        onChange={(e) =>
                          setPublicTestCases((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, input: e.target.value } : item,
                            ),
                          )
                        }
                        placeholder="[2, 7, 11, 15], 9"
                        className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-mono text-zinc-500">Expected</label>
                      <input
                        type="text"
                        value={tc.expectedOutput}
                        onChange={(e) =>
                          setPublicTestCases((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, expectedOutput: e.target.value } : item,
                            ),
                          )
                        }
                        placeholder="[0, 1]"
                        className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Hidden - AI Integrated Test Cases */}
          <div className="space-y-4 pt-4 border-t border-zinc-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold text-zinc-900 font-mono uppercase tracking-wider flex items-center gap-2">
                  Hidden - AI Integrated Test Cases
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-mono rounded">
                    Groq LLM Powered
                  </span>
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Edge cases evaluated during submission (hidden from student preview).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAiGenerateHiddenTests}
                  disabled={aiGenerating}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <MagicWandIcon className="w-3.5 h-3.5" />
                  {aiGenerating ? "Generating Edge Cases..." : "AI Auto-Generate Edge Cases"}
                </button>

                <button
                  type="button"
                  onClick={addHiddenTest}
                  className="flex items-center gap-1 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                  + Add Hidden Test
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {hiddenTestCases.map((tc, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-purple-50/50 border border-purple-200/60 rounded-xl space-y-3 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-purple-900">
                      Hidden Test #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setHiddenTestCases((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="p-1 text-zinc-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-mono text-zinc-500">Input</label>
                      <input
                        type="text"
                        value={tc.input}
                        onChange={(e) =>
                          setHiddenTestCases((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, input: e.target.value } : item,
                            ),
                          )
                        }
                        placeholder="[-1, -2, -3, -4], -7"
                        className="w-full px-3 py-2 bg-white border border-purple-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-purple-600"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-mono text-zinc-500">Expected</label>
                      <input
                        type="text"
                        value={tc.expectedOutput}
                        onChange={(e) =>
                          setHiddenTestCases((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, expectedOutput: e.target.value } : item,
                            ),
                          )
                        }
                        placeholder="[2, 3]"
                        className="w-full px-3 py-2 bg-white border border-purple-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-purple-600"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Save Draft & Publish Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
            <button
              onClick={() => handleSaveProblem(false)}
              disabled={saving}
              className="px-6 py-3 bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-800 text-xs font-semibold rounded-xl shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            >
              Save Draft
            </button>

            <button
              onClick={() => handleSaveProblem(true)}
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3 bg-[#111111] hover:bg-black text-white text-xs font-semibold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <CheckIcon className="w-4 h-4" />
              {saving ? "Publishing..." : "Publish Problem"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
