'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function OnboardingPage() {
  const { user, onboard } = useAuth();

  const isTeacher = user?.role === 'TEACHER';
  const isAdmin = user?.role === 'ADMIN';

  const [studentRegistrationNo, setStudentRegistrationNo] = useState('');
  const [gradeLevel, setGradeLevel] = useState('1st Sem');
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
        studentRegistrationNo: isTeacher || isAdmin ? undefined : studentRegistrationNo,
        gradeLevel: isTeacher || isAdmin ? undefined : gradeLevel,
        employeeId: isTeacher || isAdmin ? employeeId : undefined,
        department: isTeacher || isAdmin ? department : undefined,
        avatarUrl: avatarUrl || undefined,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9FB] text-[#111111] font-sans p-6 sm:p-12 flex flex-col items-center justify-center">
      <div className="w-full max-w-lg bg-white border border-zinc-200 rounded-xl p-8 sm:p-10 shadow-sm">
        
        {/* Header */}
        <div className="mb-8 text-center border-b border-zinc-100 pb-6">
          <span className="text-xs font-mono font-medium text-zinc-400 uppercase tracking-widest block mb-2">
            STEP 2 OF 2: PROFILE SETUP
          </span>
          <h1 className="font-serif text-3xl font-normal text-[#111111]">Complete Profile</h1>
          <p className="text-xs text-zinc-500 mt-1 font-sans">
            Welcome, <span className="font-semibold text-[#111111]">{user?.firstName} {user?.lastName}</span>. Set up your profile.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 bg-[#F4F4F6] rounded-lg flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono text-zinc-400 uppercase">Assigned Role</p>
              <p className="text-sm font-semibold text-[#111111]">{String(user?.role || 'STUDENT')}</p>
            </div>
            <div className="text-xs text-zinc-500 font-mono">
              {user?.email}
            </div>
          </div>

          {!isTeacher && !isAdmin ? (
            <>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1.5">
                  Student Registration Number
                </label>
                <input
                  type="text"
                  value={studentRegistrationNo}
                  onChange={(e) => setStudentRegistrationNo(e.target.value)}
                  placeholder="e.g. STU-2026-8941"
                  className="w-full px-3.5 py-3 bg-[#F4F4F6] border border-transparent rounded-md text-sm text-[#111111] focus:outline-none focus:bg-white focus:border-[#111111] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1.5">
                  Grade / Level
                </label>
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className="w-full px-3.5 py-3 bg-[#F4F4F6] border border-transparent rounded-md text-sm text-[#111111] focus:outline-none focus:bg-white focus:border-[#111111] transition-all"
                >
                  <option value="1st Sem">1st Sem (Semester 1)</option>
                  <option value="2nd Sem">2nd Sem (Semester 2)</option>
                  <option value="Undergraduate">Undergraduate</option>
                </select>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1.5">
                  Employee / Staff ID
                </label>
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="e.g. EMP-1042"
                  className="w-full px-3.5 py-3 bg-[#F4F4F6] border border-transparent rounded-md text-sm text-[#111111] focus:outline-none focus:bg-white focus:border-[#111111] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1.5">
                  Department
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Computer Science"
                  className="w-full px-3.5 py-3 bg-[#F4F4F6] border border-transparent rounded-md text-sm text-[#111111] focus:outline-none focus:bg-white focus:border-[#111111] transition-all"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1.5">
              Avatar Image URL (Optional)
            </label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              className="w-full px-3.5 py-3 bg-[#F4F4F6] border border-transparent rounded-md text-sm text-[#111111] focus:outline-none focus:bg-white focus:border-[#111111] transition-all"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 bg-[#111111] hover:bg-black text-white text-sm font-medium rounded-md transition-all disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {loading ? 'Saving...' : 'Enter Synchronized Dashboard'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
