"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Loader from "@/components/Loader";
import { StudentLayout } from "@/components/StudentLayout";
import { apiFetch } from "@/lib/api";
import {
  ChevronLeft,
  Zap,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Bot,
  BookOpen,
  Award,
} from "lucide-react";

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
          <strong key={idx} className="font-bold text-zinc-900">
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
        <div
          key={i}
          className="my-3 rounded-xl overflow-hidden border border-zinc-200"
        >
          {lang && (
            <div className="bg-zinc-800 text-zinc-300 text-[10px] font-mono px-3 py-1 uppercase tracking-wider">
              {lang}
            </div>
          )}
          <pre className="bg-[#1e1b2e] text-zinc-100 text-[11px] font-mono p-4 overflow-x-auto leading-relaxed">
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
        <h1 key={i} className="text-base font-bold text-zinc-900 mt-4 mb-1">
          {renderInline(line.slice(2))}
        </h1>,
      );
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      elements.push(
        <h2
          key={i}
          className="text-sm font-bold text-zinc-900 mt-3 mb-1 border-b border-zinc-100 pb-1"
        >
          {renderInline(line.slice(3))}
        </h2>,
      );
      i++;
      continue;
    }
    if (line.startsWith("### ")) {
      elements.push(
        <h3
          key={i}
          className="text-xs font-bold text-zinc-800 mt-2 mb-0.5 uppercase tracking-wide"
        >
          {renderInline(line.slice(4))}
        </h3>,
      );
      i++;
      continue;
    }

    if (
      i + 1 < lines.length &&
      /^=+$/.test(lines[i + 1].trim()) &&
      line.trim()
    ) {
      elements.push(
        <h1 key={i} className="text-base font-bold text-zinc-900 mt-4 mb-1">
          {renderInline(line)}
        </h1>,
      );
      i += 2;
      continue;
    }
    if (
      i + 1 < lines.length &&
      /^-+$/.test(lines[i + 1].trim()) &&
      line.trim()
    ) {
      elements.push(
        <h2 key={i} className="text-sm font-bold text-zinc-900 mt-3 mb-1">
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
        <ul key={i} className="list-none space-y-1 my-1 pl-2">
          {items.map((item, idx) => (
            <li
              key={idx}
              className="flex gap-2 text-[12px] leading-relaxed text-zinc-700"
            >
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0" />
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
        <ol key={i} className="space-y-1 my-1 pl-2">
          {items.map((item, idx) => (
            <li
              key={idx}
              className="flex gap-2 text-[12px] leading-relaxed text-zinc-700"
            >
              <span className="font-mono font-bold text-zinc-400 shrink-0">
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
      <p key={i} className="text-[12px] leading-relaxed text-zinc-700 my-1">
        {renderInline(line)}
      </p>,
    );
    i++;
  }

  return <div className="space-y-0.5">{elements}</div>;
}

export default function AssessmentResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const attemptId = resolvedParams.id;
  const router = useRouter();

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // AI Modal States
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiExplainingQId, setAiExplainingQId] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const [aiStudyPlan, setAiStudyPlan] = useState<any | null>(null);
  const [aiStudyPlanLoading, setAiStudyPlanLoading] = useState(false);

  useEffect(() => {
    async function loadResult() {
      try {
        const data = await apiFetch<any>(`/attempts/${attemptId}/result`);
        setResult(data);
      } catch (err: any) {
        setError(err.message || "Failed to load attempt result");
      } finally {
        setLoading(false);
      }
    }
    loadResult();
  }, [attemptId]);

  const handleAskAiExplanation = async (ans: any) => {
    setAiExplainingQId(ans.questionId);
    setAiExplanation(null);
    setAiLoading(true);
    try {
      const res = await apiFetch<any>("/ai/explain-question", {
        method: "POST",
        body: JSON.stringify({
          questionText: ans.questionText,
          questionType: ans.questionType,
          studentAnswer:
            ans.textAnswer ||
            (ans.booleanAnswer !== undefined
              ? String(ans.booleanAnswer)
              : "Selected Option"),
          topic: ans.topic || "General",
        }),
      });
      setAiExplanation(res?.explanation || "No explanation provided.");
    } catch (err: any) {
      setAiExplanation(`Unable to connect to AI: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleGenerateAiStudyPlan = async () => {
    setAiStudyPlanLoading(true);
    try {
      const weakTopics = (result?.topicAnalysis || [])
        .filter((t: any) => t.percentage < 80)
        .map((t: any) => ({ topic: t.topic, masteryScore: t.percentage }));

      const res = await apiFetch<any>("/ai/generate-study-plan", {
        method: "POST",
        body: JSON.stringify({ weakTopics }),
      });
      setAiStudyPlan(res?.studyPlan || null);
    } catch (err: any) {
      alert(`Study plan generation failed: ${err.message}`);
    } finally {
      setAiStudyPlanLoading(false);
    }
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center">
          <Loader />
          <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider mt-4">
            Evaluating Results...
          </p>
        </div>
      </StudentLayout>
    );
  }

  if (error || !result) {
    return (
      <StudentLayout>
        <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center p-6 text-center">
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl mb-4 max-w-sm">
            {error || "Result not found"}
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-5 py-2.5 bg-[#111111] text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      </StudentLayout>
    );
  }

  const percentage =
    result.maxScore > 0
      ? Math.round((result.totalScore / result.maxScore) * 100)
      : 0;

  return (
    <StudentLayout>
      <div className="min-h-screen bg-[#F5F5F7]">
        {/* Top Bar */}
        <header className="h-14 bg-white border-b border-zinc-200 px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="p-2 rounded-xl hover:bg-zinc-100 transition-colors text-zinc-500 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div>
              <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                Evaluation Report &bull; {result.className || "Assessment"}
              </p>
              <h1 className="text-sm font-bold text-zinc-900 leading-tight">
                {result.assessmentTitle}
              </h1>
            </div>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-[#111111] text-white text-xs font-bold rounded-xl hover:bg-black cursor-pointer"
          >
            Return to Dashboard
          </button>
        </header>

        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* Score Summary Card */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* Score Ring */}
              <div
                className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center border-2 shrink-0 ${
                  result.isPassed
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <span
                  className={`text-2xl font-black ${result.isPassed ? "text-emerald-700" : "text-red-600"}`}
                >
                  {percentage}%
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 mt-0.5">
                  Score
                </span>
              </div>
              <div>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full mb-2 ${
                    result.isPassed
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : "bg-red-100 text-red-800 border border-red-200"
                  }`}
                >
                  {result.isPassed ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" /> PASSED
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3" /> NEEDS REVISION
                    </>
                  )}
                </span>
                <h2 className="text-3xl font-black text-zinc-900">
                  {result.totalScore}{" "}
                  <span className="text-lg font-medium text-zinc-400">
                    / {result.maxScore} Marks
                  </span>
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Passing score: {result.passingMarks} marks
                </p>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-6 py-4 text-center">
              <span className="text-[10px] text-zinc-400 uppercase font-mono tracking-wider block mb-1">
                XP Earned
              </span>
              <div className="flex items-center gap-1.5 justify-center">
                <Zap className="w-5 h-5 text-amber-500" />
                <span className="text-2xl font-black text-emerald-700">
                  +{Math.round(result.totalScore * 10)}
                </span>
              </div>
            </div>
          </div>

          {/* Topic Analysis */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-4 h-4 text-zinc-400" />
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">
                    Topic Strength Analysis
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Automated breakdown by topic category
                  </p>
                </div>
              </div>
              <button
                onClick={handleGenerateAiStudyPlan}
                disabled={aiStudyPlanLoading}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                {aiStudyPlanLoading
                  ? "Generating..."
                  : "Generate AI Study Plan"}
              </button>
            </div>

            <div className="p-5">
              {result.topicAnalysis && result.topicAnalysis.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {result.topicAnalysis.map((topic: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-900">
                          {topic.topic}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-lg border ${
                            topic.status === "Mastered"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                              : topic.status === "Proficient"
                                ? "bg-blue-100 text-blue-800 border-blue-200"
                                : "bg-amber-100 text-amber-800 border-amber-200"
                          }`}
                        >
                          {topic.status}
                        </span>
                      </div>
                      <div className="w-full bg-zinc-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            topic.percentage >= 80
                              ? "bg-emerald-500"
                              : topic.percentage >= 50
                                ? "bg-blue-500"
                                : "bg-amber-500"
                          }`}
                          style={{
                            width: `${Math.min(100, topic.percentage)}%`,
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
                        <span>
                          Score: {topic.obtained} / {topic.totalPossible}
                        </span>
                        <span>{topic.percentage}% Mastery</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-400 italic">
                  No topic breakdown available.
                </p>
              )}

              {/* AI Study Plan */}
              {aiStudyPlan && (
                <div className="mt-5 p-5 bg-indigo-50 border border-indigo-200 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-bold rounded-lg">
                      AI PLAN
                    </span>
                    <h4 className="font-bold text-sm text-indigo-950">
                      Personalized Study Remediation Plan
                    </h4>
                  </div>
                  <p className="text-xs text-indigo-800">
                    {aiStudyPlan.summary}
                  </p>
                  {aiStudyPlan.steps && (
                    <ul className="space-y-1.5 pl-4 list-disc text-xs text-indigo-950">
                      {aiStudyPlan.steps.map((step: any, idx: number) => (
                        <li key={idx}>
                          <strong className="font-semibold">
                            {typeof step === "string"
                              ? step
                              : step.title || step.action}
                            :
                          </strong>{" "}
                          {step.action || ""}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Question Review */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm">
            <div className="flex items-center gap-3 p-5 border-b border-zinc-100">
              <BookOpen className="w-4 h-4 text-zinc-400" />
              <h3 className="text-sm font-bold text-zinc-900">
                Question Response Review
              </h3>
            </div>

            <div className="p-5 space-y-4">
              {result.answers &&
                result.answers.map((ans: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 border border-zinc-200 rounded-2xl space-y-3 bg-zinc-50"
                  >
                    {/* Question Header */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-500 font-mono">
                        Q{idx + 1} &bull; {ans.questionType}
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-xl text-xs font-bold border ${
                            ans.isCorrect
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                              : "bg-red-100 text-red-800 border-red-200"
                          }`}
                        >
                          {ans.isCorrect ? (
                            <CheckCircle2 className="inline w-3 h-3 mr-1" />
                          ) : (
                            <XCircle className="inline w-3 h-3 mr-1" />
                          )}
                          {ans.isCorrect
                            ? `+${ans.marksObtained}`
                            : `${ans.marksObtained}`}{" "}
                          Marks
                        </span>
                        <button
                          onClick={() => handleAskAiExplanation(ans)}
                          className="px-2.5 py-1 bg-white border border-zinc-200 hover:border-zinc-400 text-zinc-600 text-[11px] font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Bot className="w-3 h-3" /> Ask AI
                        </button>
                      </div>
                    </div>

                    <p className="text-sm font-medium text-zinc-900">
                      {ans.questionText}
                    </p>

                    <div className="p-3 bg-white rounded-xl border border-zinc-200 text-xs text-zinc-700 font-mono space-y-1">
                      <p>
                        <span className="text-zinc-400">Response: </span>
                        {ans.textAnswer ||
                          (ans.booleanAnswer !== undefined
                            ? String(ans.booleanAnswer)
                            : "Option Selected")}
                      </p>
                      {ans.explanation && (
                        <p className="text-zinc-500 italic mt-1 font-sans">
                          Hint: {ans.explanation}
                        </p>
                      )}
                    </div>

                    {/* AI Explanation Box */}
                    {aiExplainingQId === ans.questionId && (
                      <div className="p-4 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-800 space-y-1">
                        <div className="flex items-center justify-between font-bold text-zinc-900 mb-2">
                          <span className="flex items-center gap-1.5 text-xs uppercase tracking-wider">
                            <Bot className="w-3.5 h-3.5 text-zinc-500" /> AI
                            Tutor Breakdown
                          </span>
                          <button
                            onClick={() => setAiExplainingQId(null)}
                            className="text-zinc-400 hover:text-zinc-700 cursor-pointer"
                          >
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                        {aiLoading ? (
                          <p className="text-zinc-500 animate-pulse">
                            Analyzing and generating explanation...
                          </p>
                        ) : (
                          <div className="leading-relaxed">
                            <MarkdownRenderer content={aiExplanation || ""} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
