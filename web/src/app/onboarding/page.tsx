'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function OnboardingPage() {
  const { user, onboard } = useAuth();

  const isTeacher = user?.role === 'TEACHER';
  const isAdmin = user?.role === 'ADMIN';

  const [studentRegistrationNo, setStudentRegistrationNo] = useState('');
  const [gradeLevel, setGradeLevel] = useState('Grade 10');
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [avatarUrl, setAvatarUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await onboard({
        studentRegistrationNo: isTeacher ? undefined : studentRegistrationNo,
        gradeLevel: isTeacher ? undefined : gradeLevel,
        employeeId: isTeacher ? employeeId : undefined,
        department: isTeacher ? department : undefined,
        avatarUrl: avatarUrl || undefined,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center px-4 py-12 text-zinc-100 font-sans">
      <div className="w-full max-w-lg bg-zinc-900/90 border border-zinc-800 rounded-2xl p-8 shadow-2xl backdrop-blur-md">
        <div className="text-center mb-8">
          <span className="inline-block px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
            Step 2 of 2
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white">Complete Your Profile</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Welcome to PSP LUMORA, {user?.firstName}! Please provide your details to access your dashboard.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500 font-mono">ASSIGNED ROLE (FROM DB)</p>
              <p className="text-sm font-bold text-indigo-400">{user?.role || 'STUDENT'}</p>
            </div>
            <div className="text-xs text-zinc-400 text-right">
              {user?.email}
            </div>
          </div>

          {!isTeacher && !isAdmin ? (
            <>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Student Registration Number
                </label>
                <input
                  type="text"
                  value={studentRegistrationNo}
                  onChange={(e) => setStudentRegistrationNo(e.target.value)}
                  placeholder="e.g. STU-2026-8941"
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Grade / Level
                </label>
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Grade 9">Grade 9</option>
                  <option value="Grade 10">Grade 10</option>
                  <option value="Grade 11">Grade 11</option>
                  <option value="Grade 12">Grade 12</option>
                  <option value="Undergraduate">Undergraduate</option>
                </select>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Employee / Staff ID
                </label>
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="e.g. EMP-1042"
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Computer Science & Engineering"
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Avatar Image URL (Optional)
            </label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-xl transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 mt-4"
          >
            {loading ? 'Saving Profile...' : 'Complete Onboarding & Enter Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}
