"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { AssessmentDTO } from "@/types";
import {
  Smartphone,
  Lock,
  Code,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Sparkles,
  Laptop,
  ChevronRight,
  ShieldAlert,
  Bot,
  LayoutDashboard,
} from "lucide-react";

export default function StudentAssessmentRunnerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const assessmentId = resolvedParams.id;
  const { user } = useAuth();
  const router = useRouter();

  const [assessment, setAssessment] = useState<AssessmentDTO | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch Assessment details on load to display title and context
  useEffect(() => {
    async function loadAssessment() {
      try {
        const data = await apiFetch<AssessmentDTO>(
          `/assessments/${assessmentId}`,
        );
        if (data) {
          setAssessment(data);
        }
      } catch {
        // Fallback gracefully
      } finally {
        setLoading(false);
      }
    }
    loadAssessment();
  }, [assessmentId]);

  return (
    <main className="min-h-screen bg-[#F9F9FB] text-[#111111] font-sans selection:bg-[#111111] selection:text-white flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#111111] text-white rounded-lg flex items-center justify-center font-bold text-xs">
              PS
            </div>
            <div>
              <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest block">
                PSP LUMORA
              </span>
              <span className="text-sm font-semibold text-[#111111]">
                Assessment Portal
              </span>
            </div>
          </div>

          <button
            onClick={() => router.push("/student/assessments")}
            className="flex items-center gap-2 px-3.5 py-1.5 border border-zinc-200 text-xs font-medium text-zinc-700 rounded-md hover:bg-zinc-100 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Assessments
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-4xl w-full mx-auto px-6 py-12 flex flex-col items-center justify-center">
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <div className="w-8 h-8 border-2 border-[#111111] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono text-zinc-400">
              Loading details...
            </span>
          </div>
        ) : (
          <div className="w-full space-y-8">
            {/* Primary Notice Card */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-8 md:p-12 shadow-sm text-center relative overflow-hidden space-y-6">
              {/* Subtle Background Accent */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-50 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-50 rounded-full blur-2xl pointer-events-none" />

              {/* Mobile Phone Lock Icon Badge */}
              <div className="relative inline-flex items-center justify-center">
                <div className="w-20 h-20 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shadow-lg relative">
                  <Smartphone className="w-10 h-10" />
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-amber-500 text-white rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* Assessment Title & Metadata */}
              <div className="space-y-2 max-w-xl mx-auto">
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 bg-[#111111] text-white text-[10px] font-mono font-bold rounded">
                    {assessment?.className || "General CS"}
                  </span>
                  <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-mono font-bold rounded">
                    {assessment?.assessmentType || "QUIZ"}
                  </span>
                  {assessment?.topic && (
                    <span className="px-2.5 py-0.5 bg-zinc-100 text-zinc-600 text-[10px] font-mono rounded">
                      {assessment.topic}
                    </span>
                  )}
                </div>

                <h1 className="font-serif text-2xl md:text-3xl font-normal text-[#111111]">
                  {assessment?.title || "Assessment & Quiz Access"}
                </h1>
              </div>

              {/* Blocking Notice Message */}
              <div className="p-5 bg-amber-50/70 border border-amber-200/80 rounded-xl max-w-2xl mx-auto space-y-2 text-left">
                <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Mobile App Exclusive Feature</span>
                </div>
                <p className="text-xs text-amber-950 leading-relaxed font-sans">
                  Quizzes, Exams, and Practice Tests are exclusively available
                  on the <strong className="font-semibold">PSP Lumora Mobile App</strong> to ensure test integrity, proctored timing, and seamless touch controls. Please launch the mobile app to start this test.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => router.push("/student/playground")}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-[#111111] hover:bg-black text-white text-xs font-medium rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  <Code className="w-4 h-4" />
                  Open Web Code Playground
                  <ChevronRight className="w-4 h-4 opacity-60" />
                </button>

                <button
                  onClick={() => router.push("/student/ai-tutor")}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-800 text-xs font-medium rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <Bot className="w-4 h-4 text-purple-600" />
                  Ask AI Tutor
                </button>

                <button
                  onClick={() => router.push("/dashboard")}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-600 text-xs font-medium rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </button>
              </div>
            </div>

            {/* Side-by-side Feature Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Mobile Card */}
              <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-zinc-100">
                  <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-[#111111]">
                      PSP Lumora Mobile App
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Primary Test & Exam Platform
                    </p>
                  </div>
                </div>

                <ul className="space-y-2.5 text-xs font-sans text-zinc-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Take Quizzes, Exams &amp; Practice Tests</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Earn XP, Coins &amp; Daily Streaks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Instant Grading &amp; Question Breakdown</span>
                  </li>
                </ul>
              </div>

              {/* Web Card */}
              <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-zinc-100">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-900 border border-purple-200 flex items-center justify-center">
                    <Laptop className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-[#111111]">
                      PSP Lumora Web App
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Playground, AI &amp; Analytics
                    </p>
                  </div>
                </div>

                <ul className="space-y-2.5 text-xs font-sans text-zinc-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Monaco Code Playground &amp; Compiler</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Interactive AI Tutor &amp; Study Guide</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span className="text-zinc-400 line-through">
                      Taking Quizzes &amp; Exams (Mobile Only)
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
