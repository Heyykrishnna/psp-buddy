"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import {
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Cpu,
  MemoryStick,
  Code2,
  Calendar,
} from "lucide-react";

type Submission = {
  id: string;
  userId: string;
  problemId: string;
  language: string;
  sourceCode: string;
  status: string;
  score: number;
  passedTests: number;
  totalTests: number;
  runtimeMs: number;
  memoryKb: number;
  createdAt: string;
};

const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  ACCEPTED: { label: "Accepted", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  WRONG_ANSWER: { label: "Wrong Answer", color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
  COMPILATION_ERROR: { label: "Compile Error", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
  RUNTIME_ERROR: { label: "Runtime Error", color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200" },
  TIME_LIMIT_EXCEEDED: { label: "TLE", color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200" },
  MEMORY_LIMIT_EXCEEDED: { label: "MLE", color: "text-pink-700", bg: "bg-pink-50", border: "border-pink-200" },
};

function timeAgo(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return "Just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function SubmissionHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const slug = params?.slug as string;

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Submission | null>(null);
  const [problemTitle, setProblemTitle] = useState<string>("");

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      setLoading(true);
      try {
        // Load problem info
        const problem = await apiFetch<any>(`/problems/${slug}`);
        if (problem?.title) setProblemTitle(problem.title);
      } catch {}

      try {
        const res = await apiFetch<Submission[]>(`/problems/${slug}/submissions`);
        if (res && Array.isArray(res)) {
          setSubmissions(res);
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, [slug]);

  return (
    <main className="min-h-screen bg-[#F8F9FA] text-[#111111] font-sans">
      {/* Header */}
      <header className="h-14 bg-white border-b border-zinc-200 px-6 flex items-center gap-4 sticky top-0 z-20 shadow-sm">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm font-semibold text-zinc-600 hover:text-black transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <span className="text-zinc-300">|</span>
        <div>
          <span className="text-sm font-bold text-zinc-900">{problemTitle || slug}</span>
          <span className="ml-2 text-xs text-zinc-400">/ Submissions</span>
        </div>
        <div className="ml-auto">
          <button
            onClick={() => router.push(`/student/playground`)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0066FF] hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer"
          >
            <Code2 className="w-3.5 h-3.5" />
            Back to Editor
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {selected ? (
          /* ── Submission Detail View ── */
          <div className="space-y-6">
            <button
              onClick={() => setSelected(null)}
              className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> All Submissions
            </button>

            {/* Verdict Banner */}
            {(() => {
              const meta = STATUS_META[selected.status] || STATUS_META["WRONG_ANSWER"];
              const isAccepted = selected.status === "ACCEPTED";
              return (
                <div className={`flex items-center gap-4 px-6 py-5 rounded-2xl border ${meta.bg} ${meta.border}`}>
                  {isAccepted ? (
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-8 h-8 text-red-500 shrink-0" />
                  )}
                  <div>
                    <div className={`text-xl font-bold ${meta.color}`}>{meta.label}</div>
                    <div className="text-sm text-zinc-500 mt-0.5">
                      {selected.passedTests} / {selected.totalTests} test cases passed
                    </div>
                  </div>
                  <div className="ml-auto grid grid-cols-3 gap-6 text-center">
                    <div>
                      <div className="text-xs text-zinc-400 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3" /> Runtime
                      </div>
                      <div className="text-sm font-bold text-zinc-800">
                        {selected.status === "TIME_LIMIT_EXCEEDED" ? ">2 sec" : `${selected.runtimeMs} ms`}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-400 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                        <MemoryStick className="w-3 h-3" /> Memory
                      </div>
                      <div className="text-sm font-bold text-zinc-800">
                        {((selected.memoryKb || 0) / 1024).toFixed(1)} MB
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-400 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                        <Cpu className="w-3 h-3" /> Score
                      </div>
                      <div className="text-sm font-bold text-zinc-800">{selected.score}%</div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Stats row */}
            <div className="flex items-center gap-4 text-xs text-zinc-500 bg-white border border-zinc-200 rounded-xl px-4 py-3">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>Submitted {new Date(selected.createdAt).toLocaleString()}</span>
              <span className="text-zinc-300">·</span>
              <Code2 className="w-3.5 h-3.5 shrink-0" />
              <span className="font-semibold uppercase">{selected.language}</span>
              <span className="text-zinc-300">·</span>
              <span>
                Passed <span className="font-semibold text-zinc-700">{selected.passedTests}</span> of{" "}
                <span className="font-semibold text-zinc-700">{selected.totalTests}</span> tests
              </span>
            </div>

            {/* Submitted Code */}
            <div>
              <div className="text-xs uppercase font-bold text-zinc-400 tracking-wider mb-3">
                Submitted Code
              </div>
              <div className="rounded-xl overflow-hidden border border-zinc-800">
                <div className="bg-[#1a1a1a] border-b border-zinc-800 px-4 py-2 flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <span className="ml-3 text-xs text-zinc-400 font-mono">{selected.language}</span>
                </div>
                <pre className="bg-[#1e1e1e] text-[#d4d4d4] p-5 text-sm font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap">
                  {selected.sourceCode}
                </pre>
              </div>
            </div>
          </div>
        ) : (
          /* ── Submission List View ── */
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-zinc-900">Submission History</h1>
              <p className="text-sm text-zinc-500 mt-1">
                {submissions.length} submission{submissions.length !== 1 ? "s" : ""} for{" "}
                <span className="font-semibold text-zinc-700">{problemTitle || slug}</span>
              </p>
            </div>

            {loading ? (
              <div className="flex items-center gap-3 text-zinc-500 py-12 justify-center">
                <div className="w-5 h-5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                Loading submissions...
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-16 bg-white border border-zinc-200 rounded-2xl">
                <Code2 className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
                <p className="text-zinc-500 text-sm">No submissions yet.</p>
                <button
                  onClick={() => router.push("/student/playground")}
                  className="mt-4 px-4 py-2 bg-[#0066FF] text-white text-xs font-semibold rounded-lg cursor-pointer hover:bg-blue-700 transition-colors"
                >
                  Start Solving
                </button>
              </div>
            ) : (
              <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-4 gap-4 px-6 py-3 border-b border-zinc-100 text-xs uppercase font-bold text-zinc-400 tracking-wider bg-zinc-50">
                  <div>Status</div>
                  <div>Language</div>
                  <div>Runtime</div>
                  <div>Date</div>
                </div>

                {/* Table Rows */}
                {submissions.map((sub, idx) => {
                  const meta = STATUS_META[sub.status] || STATUS_META["WRONG_ANSWER"];
                  const isAccepted = sub.status === "ACCEPTED";
                  return (
                    <button
                      key={sub.id || idx}
                      onClick={() => setSelected(sub)}
                      className="w-full grid grid-cols-4 gap-4 px-6 py-4 border-b border-zinc-50 hover:bg-zinc-50/80 text-left transition-colors cursor-pointer group last:border-b-0"
                    >
                      <div className={`flex items-center gap-2 text-sm font-semibold ${meta.color}`}>
                        {isAccepted ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 shrink-0" />
                        )}
                        {meta.label}
                      </div>
                      <div className="text-sm text-zinc-600 capitalize self-center">{sub.language}</div>
                      <div className="text-sm text-zinc-600 self-center">
                        {sub.status === "TIME_LIMIT_EXCEEDED" ? (
                          <span className="text-orange-600 font-semibold">&gt;2 sec</span>
                        ) : (
                          `${sub.runtimeMs} ms`
                        )}
                      </div>
                      <div className="text-sm text-zinc-400 self-center">{timeAgo(sub.createdAt)}</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
