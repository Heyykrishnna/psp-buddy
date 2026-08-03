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
    <div className="min-h-screen bg-[#B8C6B6] text-[#121316] font-sans p-4 sm:p-8 flex flex-col justify-center items-center">
      <div className="w-full max-w-xl bg-[#5451FF] text-white rounded-[36px] p-6 sm:p-10 shadow-2xl border border-white/10 relative overflow-hidden">
        
        {/* Header */}
        <div className="text-center mb-8 pb-6 border-b border-white/15">
          <span className="inline-block px-4 py-1 bg-white/20 text-white rounded-full text-xs font-mono font-bold uppercase tracking-widest mb-3">
            STEP 2 OF 2: PROFILE ONBOARDING
          </span>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">COMPLETE YOUR PROFILE</h1>
          <p className="text-sm text-white/80 mt-1 font-medium">
            Welcome to PSP LUMORA, <span className="font-bold text-amber-300">{user?.firstName} {user?.lastName}</span>!
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-[#FF5745] text-white text-xs font-bold text-center shadow-lg">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* User Info Pill */}
          <div className="p-4 bg-[#3E3BE0] border border-white/20 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-white/70">ASSIGNED ROLE</p>
              <p className="text-base font-black text-amber-300 uppercase">{user?.role || 'STUDENT'}</p>
            </div>
            <div className="text-xs font-mono text-white/90 text-right bg-white/10 px-3 py-1.5 rounded-full border border-white/10">
              {user?.email}
            </div>
          </div>

          {!isTeacher && !isAdmin ? (
            <>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/90 mb-1.5">
                  STUDENT REGISTRATION NUMBER
                </label>
                <input
                  type="text"
                  value={studentRegistrationNo}
                  onChange={(e) => setStudentRegistrationNo(e.target.value)}
                  placeholder="e.g. STU-2026-8941"
                  className="w-full px-4 py-3.5 bg-[#3E3BE0] border border-white/20 rounded-2xl text-white placeholder-white/50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/90 mb-1.5">
                  GRADE / LEVEL
                </label>
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className="w-full px-4 py-3.5 bg-[#3E3BE0] border border-white/20 rounded-2xl text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white"
                >
                  <option value="Grade 9" className="bg-[#121316]">Grade 9</option>
                  <option value="Grade 10" className="bg-[#121316]">Grade 10</option>
                  <option value="Grade 11" className="bg-[#121316]">Grade 11</option>
                  <option value="Grade 12" className="bg-[#121316]">Grade 12</option>
                  <option value="Undergraduate" className="bg-[#121316]">Undergraduate</option>
                </select>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/90 mb-1.5">
                  EMPLOYEE / STAFF ID
                </label>
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="e.g. EMP-1042"
                  className="w-full px-4 py-3.5 bg-[#3E3BE0] border border-white/20 rounded-2xl text-white placeholder-white/50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/90 mb-1.5">
                  DEPARTMENT
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Computer Science & Engineering"
                  className="w-full px-4 py-3.5 bg-[#3E3BE0] border border-white/20 rounded-2xl text-white placeholder-white/50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/90 mb-1.5">
              AVATAR IMAGE URL (OPTIONAL)
            </label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              className="w-full px-4 py-3.5 bg-[#3E3BE0] border border-white/20 rounded-2xl text-white placeholder-white/50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-[#121316] hover:bg-black text-white font-black text-sm uppercase tracking-wider rounded-full transition-all flex items-center justify-between shadow-2xl disabled:opacity-50 group cursor-pointer"
            >
              <span>{loading ? 'SAVING PROFILE...' : 'ENTER SYNCHRONIZED DASHBOARD'}</span>
              <span className="w-8 h-8 rounded-full bg-[#FF5745] text-white flex items-center justify-center group-hover:translate-x-1 transition-transform text-xs">
                ↗
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
