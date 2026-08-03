'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

interface OptionInput {
  optionText: string;
  isCorrect: boolean;
}

interface QuestionInput {
  questionText: string;
  questionType: 'SINGLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  topic: string;
  points: number;
  explanation?: string;
  trueFalseAnswer?: boolean;
  shortAnswerKeywords?: string;
  options: OptionInput[];
}

export default function NewAssessmentPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Config, 2: Questions, 3: Preview

  // Config State
  const [className, setClassName] = useState('Class 10-A');
  const [topic, setTopic] = useState('Computer Science & Logic');
  const [title, setTitle] = useState('Algorithm Complexity & Data Structures Quiz');
  const [description, setDescription] = useState('Mid-term evaluation covering Big-O analysis, sorting algorithms, and boolean logic.');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [passingMarks, setPassingMarks] = useState(40);
  const [hasNegativeMarking, setHasNegativeMarking] = useState(true);
  const [negativeMarkValue, setNegativeMarkValue] = useState(0.25);

  // Questions State
  const [questions, setQuestions] = useState<QuestionInput[]>([
    {
      questionText: 'What is the average time complexity of QuickSort?',
      questionType: 'SINGLE_CHOICE',
      difficulty: 'MEDIUM',
      topic: 'Sorting Algorithms',
      points: 10,
      explanation: 'Average time complexity is O(N log N) when pivot splits balanced partitions.',
      options: [
        { optionText: 'O(N log N)', isCorrect: true },
        { optionText: 'O(N^2)', isCorrect: false },
        { optionText: 'O(N)', isCorrect: false },
        { optionText: 'O(1)', isCorrect: false },
      ],
    },
    {
      questionText: 'Binary Search requires the array to be sorted before searching.',
      questionType: 'TRUE_FALSE',
      difficulty: 'EASY',
      topic: 'Searching',
      points: 5,
      trueFalseAnswer: true,
      explanation: 'Binary Search relies on dividing a sorted array by comparing against the middle element.',
      options: [],
    },
    {
      questionText: 'Name the data structure that operates on a Last-In, First-Out (LIFO) principle.',
      questionType: 'SHORT_ANSWER',
      difficulty: 'EASY',
      topic: 'Data Structures',
      points: 10,
      shortAnswerKeywords: 'stack, LIFO stack',
      explanation: 'A Stack is a LIFO data structure.',
      options: [],
    },
  ]);

  // Current Question Builder state
  const [qText, setQText] = useState('');
  const [qType, setQType] = useState<'SINGLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER'>('SINGLE_CHOICE');
  const [qDiff, setQDiff] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [qTopic, setQTopic] = useState('Data Structures');
  const [qPoints, setQPoints] = useState(10);
  const [qExplanation, setQExplanation] = useState('');
  const [qTrueFalse, setQTrueFalse] = useState(true);
  const [qKeywords, setQKeywords] = useState('');
  const [qOptions, setQOptions] = useState<OptionInput[]>([
    { optionText: 'Option A', isCorrect: true },
    { optionText: 'Option B', isCorrect: false },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddQuestion = () => {
    if (!qText.trim()) return;

    const newQ: QuestionInput = {
      questionText: qText,
      questionType: qType,
      difficulty: qDiff,
      topic: qTopic,
      points: qPoints,
      explanation: qExplanation,
      trueFalseAnswer: qType === 'TRUE_FALSE' ? qTrueFalse : undefined,
      shortAnswerKeywords: qType === 'SHORT_ANSWER' ? qKeywords : undefined,
      options: qType === 'SINGLE_CHOICE' ? qOptions : [],
    };

    setQuestions([...questions, newQ]);

    // Reset question builder form
    setQText('');
    setQExplanation('');
    setQKeywords('');
    setQOptions([
      { optionText: 'Option A', isCorrect: true },
      { optionText: 'Option B', isCorrect: false },
    ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const totalMarks = questions.reduce((sum, q) => sum + q.points, 0);

  const handleSaveAndPublish = async (shouldPublish: boolean) => {
    setLoading(true);
    setError('');

    try {
      // 1. Create Assessment via POST /assessments
      const created = await apiFetch<any>('/assessments', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          className,
          topic,
          assessmentType: 'QUIZ',
          totalMarks: totalMarks || 100,
          passingMarks,
          durationMinutes,
          hasNegativeMarking,
          negativeMarkValue,
          createdById: user?.id || 'teacher-1',
          questions: questions.map((q, idx) => ({
            questionText: q.questionText,
            questionType: q.questionType,
            difficulty: q.difficulty,
            topic: q.topic,
            points: q.points,
            orderIndex: idx + 1,
            explanation: q.explanation,
            trueFalseAnswer: q.trueFalseAnswer,
            shortAnswerKeywords: q.shortAnswerKeywords ? q.shortAnswerKeywords.split(',').map((s) => s.trim()) : [],
            options: q.options.map((opt, oIdx) => ({
              optionText: opt.optionText,
              isCorrect: opt.isCorrect,
              orderIndex: oIdx + 1,
            })),
          })),
        }),
      });

      // 2. Publish if requested via POST /assessments/:id/publish
      if (shouldPublish && created?.id) {
        await apiFetch(`/assessments/${created.id}/publish`, { method: 'POST' });
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to save assessment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9FB] text-[#111111] font-sans p-6 sm:p-10 selection:bg-[#111111] selection:text-white">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Top Bar */}
        <div className="flex items-center justify-between border-b border-zinc-200 pb-6">
          <div>
            <span className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-widest block">
              TEACHER WORKFLOW • STEP {step} OF 3
            </span>
            <h1 className="font-serif text-3xl font-normal text-[#111111] mt-1">
              {step === 1 ? 'Configure Assessment' : step === 2 ? 'Build Questions' : 'Preview & Publish'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-3.5 py-1.5 text-xs text-zinc-600 border border-zinc-200 rounded-md hover:bg-zinc-100"
            >
              Cancel
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md">
            ⚠️ {error}
          </div>
        )}

        {/* STEP 1: CLASS SELECTION & CONFIGURATION */}
        {step === 1 && (
          <div className="bg-white border border-zinc-200 rounded-xl p-8 space-y-6 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1.5">Select Class Target</label>
                <select
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full px-3.5 py-3 bg-[#F4F4F6] border border-transparent rounded-md text-sm text-[#111111] focus:outline-none focus:bg-white focus:border-[#111111]"
                >
                  <option value="Class 10-A">Class 10-A (Computer Science)</option>
                  <option value="Class 11-B">Class 11-B (Advanced Algorithms)</option>
                  <option value="Class 12-C">Class 12-C (Software Systems)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1.5">Topic / Module</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Data Structures & Algorithms"
                  className="w-full px-3.5 py-3 bg-[#F4F4F6] border border-transparent rounded-md text-sm text-[#111111] focus:outline-none focus:bg-white focus:border-[#111111]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1.5">Assessment Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter title"
                className="w-full px-3.5 py-3 bg-[#F4F4F6] border border-transparent rounded-md text-sm text-[#111111] focus:outline-none focus:bg-white focus:border-[#111111]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1.5">Instructions & Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide test rules, rules on duration, etc."
                className="w-full px-3.5 py-3 bg-[#F4F4F6] border border-transparent rounded-md text-sm text-[#111111] focus:outline-none focus:bg-white focus:border-[#111111]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1.5">Timer Duration (Minutes)</label>
                <input
                  type="number"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-3.5 py-3 bg-[#F4F4F6] border border-transparent rounded-md text-sm text-[#111111] focus:outline-none focus:bg-white focus:border-[#111111]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1.5">Passing Marks</label>
                <input
                  type="number"
                  value={passingMarks}
                  onChange={(e) => setPassingMarks(Number(e.target.value))}
                  className="w-full px-3.5 py-3 bg-[#F4F4F6] border border-transparent rounded-md text-sm text-[#111111] focus:outline-none focus:bg-white focus:border-[#111111]"
                />
              </div>
            </div>

            {/* Negative Marking Configuration */}
            <div className="p-4 bg-[#F4F4F6] rounded-md flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[#111111]">Enable Negative Marking</p>
                <p className="text-[11px] text-zinc-500">Deduct points for incorrect responses</p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={hasNegativeMarking}
                  onChange={(e) => setHasNegativeMarking(e.target.checked)}
                  className="w-4 h-4 accent-[#111111]"
                />
                {hasNegativeMarking && (
                  <input
                    type="number"
                    step="0.05"
                    value={negativeMarkValue}
                    onChange={(e) => setNegativeMarkValue(Number(e.target.value))}
                    className="w-20 px-2 py-1 bg-white border border-zinc-300 rounded text-xs font-mono"
                  />
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 bg-[#111111] hover:bg-black text-white text-xs font-medium rounded-md transition-all cursor-pointer"
              >
                Proceed to Add Questions →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: ADD QUESTIONS (MCQ, TRUE/FALSE, SHORT ANSWER) */}
        {step === 2 && (
          <div className="space-y-6">
            
            {/* Added Questions List */}
            <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4 border-b border-zinc-100 pb-3">
                <h3 className="font-serif text-lg font-normal text-[#111111]">
                  Assessment Questions ({questions.length})
                </h3>
                <span className="text-xs font-mono text-zinc-500">Total Marks: {totalMarks}</span>
              </div>

              {questions.length === 0 ? (
                <p className="text-xs text-zinc-400 italic py-4 text-center">No questions added yet. Use the form below to add questions.</p>
              ) : (
                <div className="space-y-3">
                  {questions.map((q, idx) => (
                    <div key={idx} className="p-4 bg-[#F4F4F6] rounded-lg border border-transparent flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 bg-[#111111] text-white text-[10px] font-mono rounded">Q{idx + 1}</span>
                          <span className="px-2 py-0.5 bg-zinc-200 text-zinc-700 text-[10px] font-mono rounded">{q.questionType}</span>
                          <span className="px-2 py-0.5 bg-zinc-200 text-zinc-700 text-[10px] font-mono rounded">{q.difficulty}</span>
                          <span className="text-xs font-mono font-semibold text-zinc-600">{q.points} Marks</span>
                        </div>
                        <p className="text-sm font-medium text-[#111111]">{q.questionText}</p>
                        {q.topic && <span className="text-[11px] font-mono text-zinc-500 mt-1 block">Topic: {q.topic}</span>}
                      </div>

                      <button
                        onClick={() => handleRemoveQuestion(idx)}
                        className="text-xs text-red-600 font-semibold hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Question Builder Form */}
            <div className="bg-white border border-zinc-200 rounded-xl p-8 space-y-4 shadow-sm">
              <h3 className="font-serif text-lg font-normal text-[#111111] border-b border-zinc-100 pb-3">
                Add New Question
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">Question Type</label>
                  <select
                    value={qType}
                    onChange={(e) => setQType(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-[#F4F4F6] border border-transparent rounded-md text-xs font-medium text-[#111111]"
                  >
                    <option value="SINGLE_CHOICE">MCQ (Single Choice)</option>
                    <option value="TRUE_FALSE">True / False</option>
                    <option value="SHORT_ANSWER">Short Answer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">Difficulty</label>
                  <select
                    value={qDiff}
                    onChange={(e) => setQDiff(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-[#F4F4F6] border border-transparent rounded-md text-xs font-medium text-[#111111]"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">Marks (Points)</label>
                  <input
                    type="number"
                    value={qPoints}
                    onChange={(e) => setQPoints(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-[#F4F4F6] border border-transparent rounded-md text-xs font-medium text-[#111111]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Question Topic Tag</label>
                <input
                  type="text"
                  value={qTopic}
                  onChange={(e) => setQTopic(e.target.value)}
                  placeholder="e.g. Data Structures"
                  className="w-full px-3 py-2.5 bg-[#F4F4F6] border border-transparent rounded-md text-xs font-medium text-[#111111]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Question Prompt</label>
                <textarea
                  rows={2}
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  placeholder="Enter problem statement or question..."
                  className="w-full px-3 py-2.5 bg-[#F4F4F6] border border-transparent rounded-md text-sm text-[#111111]"
                />
              </div>

              {/* Dynamic Type Config */}
              {qType === 'SINGLE_CHOICE' && (
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-zinc-600">Options (Select Correct Option)</label>
                  {qOptions.map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correctOpt"
                        checked={opt.isCorrect}
                        onChange={() => {
                          setQOptions(qOptions.map((o, i) => ({ ...o, isCorrect: i === oIdx })));
                        }}
                        className="w-4 h-4 accent-[#111111]"
                      />
                      <input
                        type="text"
                        value={opt.optionText}
                        onChange={(e) => {
                          const updated = [...qOptions];
                          updated[oIdx].optionText = e.target.value;
                          setQOptions(updated);
                        }}
                        placeholder={`Option ${oIdx + 1}`}
                        className="flex-1 px-3 py-2 bg-[#F4F4F6] border border-transparent rounded-md text-xs font-medium text-[#111111]"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setQOptions([...qOptions, { optionText: `Option ${qOptions.length + 1}`, isCorrect: false }])}
                    className="text-xs text-[#111111] font-semibold underline cursor-pointer pt-1"
                  >
                    + Add Option Choice
                  </button>
                </div>
              )}

              {qType === 'TRUE_FALSE' && (
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1.5">Correct True / False Statement</label>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setQTrueFalse(true)}
                      className={`px-4 py-2 text-xs font-semibold rounded-md border ${
                        qTrueFalse ? 'bg-[#111111] text-white border-[#111111]' : 'bg-white text-zinc-700 border-zinc-200'
                      }`}
                    >
                      True
                    </button>
                    <button
                      type="button"
                      onClick={() => setQTrueFalse(false)}
                      className={`px-4 py-2 text-xs font-semibold rounded-md border ${
                        !qTrueFalse ? 'bg-[#111111] text-white border-[#111111]' : 'bg-white text-zinc-700 border-zinc-200'
                      }`}
                    >
                      False
                    </button>
                  </div>
                </div>
              )}

              {qType === 'SHORT_ANSWER' && (
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">Auto-grade Keywords (Comma separated)</label>
                  <input
                    type="text"
                    value={qKeywords}
                    onChange={(e) => setQKeywords(e.target.value)}
                    placeholder="e.g. stack, LIFO, linear structure"
                    className="w-full px-3 py-2.5 bg-[#F4F4F6] border border-transparent rounded-md text-xs font-medium text-[#111111]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Explanation (Shown after test)</label>
                <input
                  type="text"
                  value={qExplanation}
                  onChange={(e) => setQExplanation(e.target.value)}
                  placeholder="Optional hint or explanation..."
                  className="w-full px-3 py-2.5 bg-[#F4F4F6] border border-transparent rounded-md text-xs font-medium text-[#111111]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="px-5 py-2.5 bg-[#111111] text-white text-xs font-medium rounded-md hover:bg-black transition-all cursor-pointer"
                >
                  + Add Question to Assessment
                </button>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep(1)}
                className="px-5 py-2.5 border border-zinc-200 text-xs font-medium text-zinc-700 rounded-md hover:bg-zinc-100"
              >
                ← Back to Configuration
              </button>

              <button
                onClick={() => setStep(3)}
                disabled={questions.length === 0}
                className="px-6 py-2.5 bg-[#111111] hover:bg-black text-white text-xs font-medium rounded-md transition-all disabled:opacity-50 cursor-pointer"
              >
                Preview Assessment →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: PREVIEW & PUBLISH */}
        {step === 3 && (
          <div className="bg-white border border-zinc-200 rounded-xl p-8 space-y-6 shadow-sm">
            <div className="border-b border-zinc-200 pb-4">
              <span className="px-2.5 py-1 bg-zinc-100 text-zinc-700 text-xs font-mono rounded">
                TARGET CLASS: {className}
              </span>
              <h2 className="font-serif text-3xl font-normal text-[#111111] mt-2">{title}</h2>
              <p className="text-xs text-zinc-500 mt-1">{description}</p>
            </div>

            <div className="grid grid-cols-4 gap-4 p-4 bg-[#F4F4F6] rounded-lg text-xs font-mono">
              <div>
                <span className="text-zinc-400 block">TOTAL MARKS</span>
                <span className="font-bold text-[#111111] text-sm">{totalMarks}</span>
              </div>
              <div>
                <span className="text-zinc-400 block">PASSING MARKS</span>
                <span className="font-bold text-[#111111] text-sm">{passingMarks}</span>
              </div>
              <div>
                <span className="text-zinc-400 block">DURATION</span>
                <span className="font-bold text-[#111111] text-sm">{durationMinutes} mins</span>
              </div>
              <div>
                <span className="text-zinc-400 block">NEGATIVE MARKING</span>
                <span className="font-bold text-[#111111] text-sm">
                  {hasNegativeMarking ? `-${negativeMarkValue}` : 'Off'}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-serif text-lg font-normal text-[#111111]">Questions Preview</h3>
              {questions.map((q, idx) => (
                <div key={idx} className="p-4 border border-zinc-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-[#111111]">Q{idx + 1}. ({q.questionType})</span>
                    <span className="text-zinc-500">{q.points} Marks</span>
                  </div>
                  <p className="text-sm font-medium text-[#111111]">{q.questionText}</p>

                  {q.questionType === 'SINGLE_CHOICE' && (
                    <div className="pl-4 space-y-1">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="text-xs text-zinc-600 flex items-center gap-2">
                          <span className={opt.isCorrect ? 'text-emerald-600 font-bold' : ''}>
                            • {opt.optionText} {opt.isCorrect && '(Correct)'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {q.questionType === 'TRUE_FALSE' && (
                    <p className="text-xs text-emerald-600 font-semibold pl-4">
                      Correct Answer: {q.trueFalseAnswer ? 'True' : 'False'}
                    </p>
                  )}

                  {q.questionType === 'SHORT_ANSWER' && (
                    <p className="text-xs text-zinc-500 font-mono pl-4">
                      Keywords: {q.shortAnswerKeywords || 'None'}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-6 border-t border-zinc-200">
              <button
                onClick={() => setStep(2)}
                className="px-5 py-2.5 border border-zinc-200 text-xs font-medium text-zinc-700 rounded-md hover:bg-zinc-100"
              >
                ← Back to Questions
              </button>

              <div className="flex items-center gap-3">
                <button
                  disabled={loading}
                  onClick={() => handleSaveAndPublish(false)}
                  className="px-5 py-2.5 border border-zinc-300 text-xs font-medium text-zinc-800 rounded-md hover:bg-zinc-100 cursor-pointer"
                >
                  Save as Draft
                </button>
                <button
                  disabled={loading}
                  onClick={() => handleSaveAndPublish(true)}
                  className="px-6 py-2.5 bg-[#111111] hover:bg-black text-white text-xs font-medium rounded-md transition-all cursor-pointer shadow-sm"
                >
                  {loading ? 'Publishing...' : 'Publish & Notify Students 🚀'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
