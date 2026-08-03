'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { AssessmentDTO, QuestionDTO } from '@/types';

export default function StudentAssessmentRunnerPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const assessmentId = resolvedParams.id;
  const { user } = useAuth();
  const router = useRouter();

  const [assessment, setAssessment] = useState<AssessmentDTO | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);

  // Autosave State
  const [answers, setAnswers] = useState<
    Record<string, { selectedOptionId?: string; textAnswer?: string; booleanAnswer?: boolean }>
  >({});
  const [autosaveStatus, setAutosaveStatus] = useState<'IDLE' | 'SAVING' | 'SAVED' | 'ERROR'>('IDLE');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // Timer & UI State
  const [attemptStarted, setAttemptStarted] = useState(false);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(1800);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch Assessment details on load
  useEffect(() => {
    async function loadAssessment() {
      try {
        const data = await apiFetch<AssessmentDTO>(`/assessments/${assessmentId}`);
        setAssessment(data);
        if (data.durationMinutes) {
          setTimeLeftSeconds(data.durationMinutes * 60);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load assessment');
      } finally {
        setLoading(false);
      }
    }
    loadAssessment();
  }, [assessmentId]);

  // Live Timer Countdown
  useEffect(() => {
    if (!attemptStarted || timeLeftSeconds <= 0) return;
    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitAttempt();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [attemptStarted, timeLeftSeconds]);

  // Start Attempt (POST /assessments/:id/attempts)
  const handleStartAttempt = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await apiFetch<{ id: string; answers?: any[] }>(`/assessments/${assessmentId}/attempts`, {
        method: 'POST',
        body: JSON.stringify({ studentId: user?.id || 'demo-student' }),
      });

      setAttemptId(res.id);

      // Pre-fill existing autosaved answers if resuming
      if (res.answers && res.answers.length > 0) {
        const existing: Record<string, any> = {};
        res.answers.forEach((ans) => {
          existing[ans.questionId] = {
            selectedOptionId: ans.selectedOptionId,
            textAnswer: ans.textAnswer,
            booleanAnswer: ans.booleanAnswer,
          };
        });
        setAnswers(existing);
      }

      setAttemptStarted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to start assessment attempt');
    } finally {
      setLoading(false);
    }
  };

  // AUTOSAVE ANSWER TO POSTGRESQL (PATCH /attempts/:id/answers)
  const saveAnswerToPostgres = useCallback(
    async (questionId: string, answerData: { selectedOptionId?: string; textAnswer?: string; booleanAnswer?: boolean }) => {
      if (!attemptId) return;

      setAutosaveStatus('SAVING');
      try {
        await apiFetch(`/attempts/${attemptId}/answers`, {
          method: 'PATCH',
          body: JSON.stringify({
            questionId,
            ...answerData,
          }),
        });
        setAutosaveStatus('SAVED');
        setLastSavedAt(new Date());
      } catch (err) {
        setAutosaveStatus('ERROR');
      }
    },
    [attemptId]
  );

  // Triggered on option selection / text change
  const handleAnswerChange = (
    questionId: string,
    key: 'selectedOptionId' | 'textAnswer' | 'booleanAnswer',
    val: any
  ) => {
    const updated = {
      ...answers[questionId],
      [key]: val,
    };

    setAnswers((prev) => ({
      ...prev,
      [questionId]: updated,
    }));

    // Trigger instant autosave to PostgreSQL
    saveAnswerToPostgres(questionId, updated);
  };

  // Final Submit Attempt (POST /attempts/:id/submit)
  const handleSubmitAttempt = async () => {
    if (!attemptId) return;
    setSubmitting(true);
    setError('');

    try {
      const res = await apiFetch<any>(`/attempts/${attemptId}/submit`, {
        method: 'POST',
      });

      router.push(`/student/attempts/${attemptId}/result`);
    } catch (err: any) {
      setError(err.message || 'Failed to submit assessment');
      setSubmitting(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading || !assessment) {
    return (
      <div className="min-h-screen bg-[#F9F9FB] flex flex-col items-center justify-center font-sans">
        <div className="w-8 h-8 border-2 border-[#111111] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Loading Assessment Data...</p>
      </div>
    );
  }

  const questions: QuestionDTO[] = assessment.questions || [];
  const currentQ = questions[currentQuestionIdx];
  const currentAns = currentQ ? answers[currentQ.id] || {} : {};

  return (
    <div className="min-h-screen bg-[#F9F9FB] text-[#111111] font-sans p-6 sm:p-10 selection:bg-[#111111] selection:text-white">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Top Minimal Bar */}
        <header className="flex items-center justify-between border-b border-zinc-200 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">✳</span>
            <div>
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">
                {assessment.className || 'Class Assessment'}
              </span>
              <h1 className="font-serif text-xl font-normal text-[#111111]">{assessment.title}</h1>
            </div>
          </div>

          {attemptStarted && (
            <div className="flex items-center gap-4">
              {/* Live Autosave Indicator */}
              <div className="flex items-center gap-1.5 text-xs font-mono">
                {autosaveStatus === 'SAVING' && (
                  <span className="text-amber-600 animate-pulse">● Saving to DB...</span>
                )}
                {autosaveStatus === 'SAVED' && (
                  <span className="text-emerald-600 font-medium">✓ Autosaved to PostgreSQL</span>
                )}
                {autosaveStatus === 'ERROR' && (
                  <span className="text-red-600 font-medium">⚠️ Autosave Error</span>
                )}
              </div>

              {/* Timer Badge */}
              <div className="px-3.5 py-1.5 bg-[#111111] text-white rounded-md text-xs font-mono font-bold">
                ⏱ {formatTime(timeLeftSeconds)}
              </div>
            </div>
          )}
        </header>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md">
            ⚠️ {error}
          </div>
        )}

        {/* INSTRUCTIONS SCREEN */}
        {!attemptStarted ? (
          <div className="bg-white border border-zinc-200 rounded-xl p-8 space-y-6 shadow-sm">
            <div>
              <span className="px-2.5 py-1 bg-zinc-100 text-zinc-700 text-xs font-mono rounded inline-block mb-3">
                {assessment.assessmentType} • {questions.length} QUESTIONS
              </span>
              <h2 className="font-serif text-3xl font-normal text-[#111111]">Instructions & Assessment Guidelines</h2>
              <p className="text-xs text-zinc-500 mt-2 leading-relaxed">{assessment.description}</p>
            </div>

            <div className="grid grid-cols-3 gap-4 p-4 bg-[#F4F4F6] rounded-lg text-xs font-mono">
              <div>
                <span className="text-zinc-400 block">TOTAL MARKS</span>
                <span className="font-bold text-[#111111] text-base">{assessment.totalMarks} Marks</span>
              </div>
              <div>
                <span className="text-zinc-400 block">PASSING SCORE</span>
                <span className="font-bold text-[#111111] text-base">{assessment.passingMarks} Marks</span>
              </div>
              <div>
                <span className="text-zinc-400 block">TIMER DURATION</span>
                <span className="font-bold text-[#111111] text-base">{assessment.durationMinutes} Minutes</span>
              </div>
            </div>

            <div className="p-4 border border-zinc-200 rounded-lg space-y-2 text-xs text-zinc-600 font-sans">
              <p className="font-semibold text-[#111111]">Key Instructions:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Every answer change is automatically saved in real time to PostgreSQL.</li>
                {assessment.hasNegativeMarking && (
                  <li className="text-red-600 font-semibold">
                    Negative marking is active: -{assessment.negativeMarkValue} marks for incorrect answers.
                  </li>
                )}
                <li>Do not refresh or close the window while the timer is running.</li>
              </ul>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 border border-zinc-200 text-xs text-zinc-700 rounded-md hover:bg-zinc-100"
              >
                Back to Dashboard
              </button>
              <button
                onClick={handleStartAttempt}
                className="px-6 py-3 bg-[#111111] hover:bg-black text-white text-xs font-medium rounded-md transition-all cursor-pointer shadow-sm"
              >
                Start Assessment Attempt →
              </button>
            </div>
          </div>
        ) : (
          /* LIVE QUESTION ATTEMPT RUNNER WITH AUTOSAVE */
          <div className="space-y-6">
            
            {/* Question Navigator Bar */}
            <div className="bg-white border border-zinc-200 rounded-xl p-4 flex items-center justify-between gap-4 overflow-x-auto shadow-sm">
              <span className="text-xs font-mono font-semibold text-zinc-500 whitespace-nowrap">
                Question Navigator:
              </span>
              <div className="flex items-center gap-2">
                {questions.map((q, idx) => {
                  const isAnswered = Boolean(
                    answers[q.id]?.selectedOptionId ||
                      answers[q.id]?.textAnswer ||
                      answers[q.id]?.booleanAnswer !== undefined
                  );
                  const isCurrent = idx === currentQuestionIdx;
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestionIdx(idx)}
                      className={`w-8 h-8 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-[#111111] text-white border-2 border-[#111111]'
                          : isAnswered
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-[#F4F4F6] text-zinc-600 hover:bg-zinc-200'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Current Question View */}
            {currentQ && (
              <div className="bg-white border border-zinc-200 rounded-xl p-8 space-y-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-[#111111] text-white text-xs font-mono font-bold rounded">
                      Question {currentQuestionIdx + 1} of {questions.length}
                    </span>
                    <span className="px-2.5 py-1 bg-zinc-100 text-zinc-700 text-xs font-mono rounded">
                      {currentQ.questionType}
                    </span>
                    {currentQ.difficulty && (
                      <span className="px-2.5 py-1 bg-zinc-100 text-zinc-700 text-xs font-mono rounded">
                        {currentQ.difficulty}
                      </span>
                    )}
                  </div>

                  <span className="text-xs font-mono font-semibold text-zinc-600">{currentQ.points} Marks</span>
                </div>

                {/* Prompt */}
                <div>
                  <h3 className="text-base sm:text-lg font-medium text-[#111111] leading-snug">
                    {currentQ.questionText}
                  </h3>
                  {currentQ.topic && (
                    <span className="text-[11px] font-mono text-zinc-400 mt-1 block">Topic: {currentQ.topic}</span>
                  )}
                </div>

                {/* Question Types: MCQ / TRUE_FALSE / SHORT_ANSWER */}

                {/* 1. MCQ */}
                {currentQ.questionType === 'SINGLE_CHOICE' && currentQ.options && (
                  <div className="space-y-3 pt-2">
                    {currentQ.options.map((opt) => {
                      const isSelected = currentAns.selectedOptionId === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleAnswerChange(currentQ.id, 'selectedOptionId', opt.id)}
                          className={`w-full text-left p-4 rounded-lg border text-sm transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-[#111111] text-white border-[#111111] shadow-sm'
                              : 'bg-[#F4F4F6] text-zinc-800 border-transparent hover:border-zinc-300'
                          }`}
                        >
                          <span>{opt.optionText}</span>
                          <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-xs ${isSelected ? 'border-white bg-white text-[#111111]' : 'border-zinc-400'}`}>
                            {isSelected && '✓'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 2. TRUE / FALSE */}
                {currentQ.questionType === 'TRUE_FALSE' && (
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <button
                      type="button"
                      onClick={() => handleAnswerChange(currentQ.id, 'booleanAnswer', true)}
                      className={`p-5 rounded-lg border text-sm font-semibold transition-all cursor-pointer flex items-center justify-center ${
                        currentAns.booleanAnswer === true
                          ? 'bg-[#111111] text-white border-[#111111] shadow-sm'
                          : 'bg-[#F4F4F6] text-zinc-800 border-transparent hover:border-zinc-300'
                      }`}
                    >
                      True
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAnswerChange(currentQ.id, 'booleanAnswer', false)}
                      className={`p-5 rounded-lg border text-sm font-semibold transition-all cursor-pointer flex items-center justify-center ${
                        currentAns.booleanAnswer === false
                          ? 'bg-[#111111] text-white border-[#111111] shadow-sm'
                          : 'bg-[#F4F4F6] text-zinc-800 border-transparent hover:border-zinc-300'
                      }`}
                    >
                      False
                    </button>
                  </div>
                )}

                {/* 3. SHORT ANSWER */}
                {currentQ.questionType === 'SHORT_ANSWER' && (
                  <div className="pt-2">
                    <label className="block text-xs font-medium text-zinc-600 mb-1.5">Your Response</label>
                    <textarea
                      rows={4}
                      value={currentAns.textAnswer || ''}
                      onChange={(e) => handleAnswerChange(currentQ.id, 'textAnswer', e.target.value)}
                      placeholder="Type your answer here..."
                      className="w-full px-4 py-3 bg-[#F4F4F6] border border-transparent rounded-lg text-sm text-[#111111] focus:outline-none focus:bg-white focus:border-[#111111] transition-all"
                    />
                  </div>
                )}

                {/* Question Footer Controls */}
                <div className="flex items-center justify-between pt-6 border-t border-zinc-100">
                  <button
                    disabled={currentQuestionIdx === 0}
                    onClick={() => setCurrentQuestionIdx((prev) => prev - 1)}
                    className="px-4 py-2 border border-zinc-200 text-xs font-medium text-zinc-700 rounded-md hover:bg-zinc-100 disabled:opacity-30"
                  >
                    ← Previous Question
                  </button>

                  {currentQuestionIdx < questions.length - 1 ? (
                    <button
                      onClick={() => setCurrentQuestionIdx((prev) => prev + 1)}
                      className="px-5 py-2.5 bg-[#111111] hover:bg-black text-white text-xs font-medium rounded-md transition-all cursor-pointer"
                    >
                      Next Question →
                    </button>
                  ) : (
                    <button
                      disabled={submitting}
                      onClick={handleSubmitAttempt}
                      className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium rounded-md transition-all cursor-pointer shadow-sm"
                    >
                      {submitting ? 'Submitting...' : 'Submit Final Assessment ✓'}
                    </button>
                  )}
                </div>

              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
