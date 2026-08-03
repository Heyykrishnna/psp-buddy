"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { AssessmentDTO } from "@/types";
import { Clock, Target, AlertTriangle, ArrowLeft, ArrowUpRight } from "lucide-react";

const MOCK_ASSESSMENTS: AssessmentDTO[] = [
  {
    id: "demo-asm-1",
    title: "Algorithm Complexity & Data Structures Quiz",
    description: "Evaluates Big-O notation, stacks, queues, hash tables, and sorting algorithms.",
    className: "Data Structures II",
    assessmentType: "QUIZ",
    totalMarks: 10,
    passingMarks: 6,
    durationMinutes: 15,
    hasNegativeMarking: true,
    negativeMarkValue: 0.5,
    isPublished: true,
    createdById: "teacher-1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-asm-2",
    title: "System Architecture & Operating Systems Exam",
    description: "Deep dive into process scheduling, memory allocation, page faults, and threads.",
    className: "Operating Systems",
    assessmentType: "EXAM",
    totalMarks: 25,
    passingMarks: 15,
    durationMinutes: 30,
    hasNegativeMarking: false,
    negativeMarkValue: 0,
    isPublished: true,
    createdById: "teacher-1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function StudentAssessmentsPage() {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<AssessmentDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<string>("ALL");

  useEffect(() => {
    async function loadAssessments() {
      try {
        const data = await apiFetch<AssessmentDTO[]>("/assessments");
        if (data && data.length > 0) {
          setAssessments(data);
        } else {
          setAssessments(MOCK_ASSESSMENTS);
        }
      } catch {
        setAssessments(MOCK_ASSESSMENTS);
      } finally {
        setLoading(false);
      }
    }
    loadAssessments();
  }, []);

  const filteredAssessments = assessments.filter((asm) => {
    const matchesQuery =
      asm.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (asm.className && asm.className.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter =
      activeFilter === "ALL" || asm.assessmentType === activeFilter;
    return matchesQuery && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-[#121316] text-white p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="text-xs font-mono font-semibold text-[#4ade80] hover:underline"
              >
                ← DASHBOARD
              </Link>
              <span className="text-white/30">•</span>
              <span className="text-xs font-mono tracking-widest text-white/50 uppercase">
                STUDENT PORTAL
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-2 font-['Space_Grotesk']">
              ASSESSMENT PORTAL
            </h1>
            <p className="text-white/60 text-sm mt-1">
              Select an active assessment below to begin your real-time evaluation.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-[#191a1e] px-4 py-2.5 rounded-2xl border border-white/10">
            <div className="w-2.5 h-2.5 rounded-full bg-[#4ade80] animate-pulse" />
            <span className="text-xs font-mono font-medium text-white/80">
              {filteredAssessments.length} ACTIVE ASSESSMENTS AVAILABLE
            </span>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assessment title or course..."
              className="w-full bg-[#191a1e] border border-white/10 text-white placeholder-white/40 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-[#5451FF] transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            {["ALL", "QUIZ", "EXAM", "PRACTICE"].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider transition ${
                  activeFilter === filter
                    ? "bg-[#5451FF] text-white shadow-lg shadow-[#5451FF]/30"
                    : "bg-[#191a1e] text-white/60 hover:text-white border border-white/10"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Assessments Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#5451FF] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredAssessments.length === 0 ? (
          <div className="bg-[#191a1e] border border-white/10 rounded-3xl p-12 text-center space-y-3">
            <p className="text-white/60 text-base">No assessments match your criteria.</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveFilter("ALL");
              }}
              className="text-xs font-mono text-[#5451FF] hover:underline"
            >
              RESET FILTERS
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredAssessments.map((asm) => (
              <div
                key={asm.id}
                className="bg-[#191a1e] border border-white/10 hover:border-white/20 rounded-3xl p-6 flex flex-col justify-between gap-6 transition shadow-xl group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="bg-[#5451FF]/20 text-[#5451FF] text-xs font-semibold px-3 py-1 rounded-lg">
                      {asm.className || "Computer Science"}
                    </span>
                    <span className="bg-[#FF5745]/20 text-[#FF5745] text-xs font-semibold px-3 py-1 rounded-lg">
                      {asm.assessmentType}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-xl font-bold font-['Space_Grotesk'] group-hover:text-[#5451FF] transition">
                      {asm.title}
                    </h2>
                    <p className="text-white/60 text-xs mt-2 line-clamp-2 leading-relaxed">
                      {asm.description || "Evaluates core concepts, logic, and problem-solving skills."}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-4 text-xs font-medium text-white/50">
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-white/40" /> {asm.durationMinutes || 15} mins</span>
                    <span className="flex items-center gap-1.5"><Target className="w-3.5 h-3.5 text-white/40" /> {asm.totalMarks || 10} marks</span>
                    {asm.hasNegativeMarking && (
                      <span className="flex items-center gap-1.5 text-amber-400"><AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> -{asm.negativeMarkValue} neg</span>
                    )}
                  </div>

                  <Link
                    href={`/student/assessments/${asm.id}`}
                    className="w-full bg-[#5451FF] hover:bg-[#433ee4] text-white font-semibold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition text-sm shadow-lg shadow-[#5451FF]/20"
                  >
                    START ASSESSMENT
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
