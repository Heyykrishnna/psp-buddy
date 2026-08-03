'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

export default function AssessmentResultPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const attemptId = resolvedParams.id;
  const router = useRouter();

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadResult() {
      try {
        const data = await apiFetch<any>(`/attempts/${attemptId}/result`);
        setResult(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load attempt result');
      } finally {
        setLoading(false);
      }
    }
    loadResult();
  }, [attemptId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F9FB] flex flex-col items-center justify-center font-sans">
        <div className="w-8 h-8 border-2 border-[#111111] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Evaluating Results & Topic Breakdown...</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-[#F9F9FB] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md mb-4">
          ⚠️ {error || 'Result not found'}
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-4 py-2 bg-[#111111] text-white text-xs font-medium rounded-md"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const percentage = result.maxScore > 0 ? Math.round((result.totalScore / result.maxScore) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#F9F9FB] text-[#111111] font-sans p-6 sm:p-10 selection:bg-[#111111] selection:text-white">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 pb-6">
          <div>
            <span className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-widest block">
              EVALUATION REPORT • {result.className || 'Assessment'}
            </span>
            <h1 className="font-serif text-3xl font-normal text-[#111111] mt-1">{result.assessmentTitle}</h1>
          </div>

          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-[#111111] text-white text-xs font-medium rounded-md hover:bg-black"
          >
            Return to Dashboard
          </button>
        </div>

        {/* Score Card */}
        <div className="bg-white border border-zinc-200 rounded-xl p-8 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-3 py-1 text-xs font-mono font-bold rounded ${
                result.isPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
              }`}>
                {result.isPassed ? 'PASSED ✓' : 'NEEDS REVISION'}
              </span>
              <span className="text-xs font-mono text-zinc-500">Passing Score: {result.passingMarks} Marks</span>
            </div>
            <h2 className="font-serif text-4xl font-normal text-[#111111]">
              {result.totalScore} <span className="text-xl text-zinc-400 font-sans">/ {result.maxScore} Marks</span>
            </h2>
            <p className="text-xs text-zinc-500 mt-1 font-mono">Overall Score Percentage: {percentage}%</p>
          </div>

          <div className="p-4 bg-[#F4F4F6] rounded-lg text-center font-mono">
            <span className="text-[10px] text-zinc-400 uppercase block">XP REWARD EARNED</span>
            <span className="text-2xl font-bold text-emerald-700">+{Math.round(result.totalScore * 10)} XP</span>
          </div>
        </div>

        {/* Topic Analysis Report (PRD Requirement) */}
        <div className="bg-white border border-zinc-200 rounded-xl p-8 space-y-4 shadow-sm">
          <div className="border-b border-zinc-100 pb-3">
            <h3 className="font-serif text-xl font-normal text-[#111111]">Topic Strength Analysis</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Automated breakdown of performance by topic category</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {result.topicAnalysis && result.topicAnalysis.length > 0 ? (
              result.topicAnalysis.map((topic: any, idx: number) => (
                <div key={idx} className="p-4 bg-[#F4F4F6] rounded-lg border border-transparent space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#111111]">{topic.topic}</span>
                    <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${
                      topic.status === 'Mastered'
                        ? 'bg-emerald-100 text-emerald-800'
                        : topic.status === 'Proficient'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {topic.status}
                    </span>
                  </div>

                  <div className="w-full bg-zinc-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        topic.percentage >= 80 ? 'bg-emerald-600' : topic.percentage >= 50 ? 'bg-blue-600' : 'bg-amber-600'
                      }`}
                      style={{ width: `${Math.min(100, topic.percentage)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
                    <span>Score: {topic.obtained} / {topic.totalPossible}</span>
                    <span>{topic.percentage}% Mastery</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-400 italic">No topic breakdown available.</p>
            )}
          </div>
        </div>

        {/* Detailed Question Answers Review */}
        <div className="bg-white border border-zinc-200 rounded-xl p-8 space-y-6 shadow-sm">
          <h3 className="font-serif text-xl font-normal text-[#111111] border-b border-zinc-100 pb-3">
            Question Response Review
          </h3>

          <div className="space-y-4">
            {result.answers && result.answers.map((ans: any, idx: number) => (
              <div key={idx} className="p-4 border border-zinc-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-[#111111]">Q{idx + 1}. ({ans.questionType})</span>
                  <span className={`px-2 py-0.5 rounded font-bold ${
                    ans.isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {ans.isCorrect ? `+${ans.marksObtained} Marks` : `${ans.marksObtained} Marks`}
                  </span>
                </div>

                <p className="text-sm font-medium text-[#111111]">{ans.questionText}</p>

                <div className="p-3 bg-[#F4F4F6] rounded text-xs text-zinc-700 font-mono space-y-1">
                  <p>
                    <span className="text-zinc-400">Response: </span>
                    {ans.textAnswer || (ans.booleanAnswer !== undefined ? String(ans.booleanAnswer) : 'Option Selected')}
                  </p>
                  {ans.explanation && (
                    <p className="text-zinc-500 italic mt-1 font-sans">Hint/Explanation: {ans.explanation}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
