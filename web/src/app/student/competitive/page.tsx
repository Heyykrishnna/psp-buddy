"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import {
  Flame,
  Trophy,
  Zap,
  Star,
  Medal,
  Crown,
  Shield,
  Flag,
  Timer,
  Check,
  Gem,
  Sparkles,
  Swords,
  ChevronRight,
  Calendar,
  Target,
  TrendingUp,
  Award,
  Users,
  Clock,
  CheckCircle2,
  Lock,
  RefreshCw,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

// ── Icon map for achievement icons ────────────────────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
  Swords,
  Star,
  Trophy,
  Medal,
  Flame,
  Zap,
  Crown,
  Sparkles,
  Gem,
  Flag,
  Shield,
  Timer,
  Check,
};

// ── Tab types ─────────────────────────────────────────────────────────────────
type Tab = "overview" | "leaderboard" | "contests" | "achievements";
type LbTimeframe = "WEEKLY" | "MONTHLY" | "ALL_TIME";

// ── Colour helpers ─────────────────────────────────────────────────────────────
const DIFF_COLOR: Record<string, string> = {
  EASY: "text-emerald-600 bg-emerald-50 border-emerald-200",
  MEDIUM: "text-amber-600 bg-amber-50 border-amber-200",
  HARD: "text-red-600 bg-red-50 border-red-200",
};

const STATUS_COLOR: Record<string, string> = {
  UPCOMING: "text-blue-600 bg-blue-50 border-blue-200",
  LIVE: "text-emerald-600 bg-emerald-50 border-emerald-200",
  ENDED: "text-zinc-500 bg-zinc-50 border-zinc-200",
};

export default function CompetitivePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [profile, setProfile] = useState<any>(null);
  const [dailyChallenge, setDailyChallenge] = useState<any>(null);
  const [weeklyChallenge, setWeeklyChallenge] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [lbTimeframe, setLbTimeframe] = useState<LbTimeframe>("ALL_TIME");
  const [contests, setContests] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lbLoading, setLbLoading] = useState(false);

  const studentId = (user as any)?.studentId || user?.id;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [dc, wc, cont, ach] = await Promise.all([
        apiFetch<any>("/competitive/daily-challenge"),
        apiFetch<any>("/competitive/weekly-challenge"),
        apiFetch<any[]>("/competitive/contests"),
        apiFetch<any[]>("/competitive/achievements"),
      ]);
      setDailyChallenge(dc);
      setWeeklyChallenge(wc);
      setContests(cont || []);
      setAchievements(ach || []);

      if (studentId) {
        const p = await apiFetch<any>(`/competitive/profile/${studentId}`);
        setProfile(p);
      }
    } catch {}
    setLoading(false);
  }, [studentId]);

  const loadLeaderboard = useCallback(async (tf: LbTimeframe) => {
    setLbLoading(true);
    try {
      const data = await apiFetch<any[]>(
        `/competitive/leaderboard?timeframe=${tf}&limit=50`,
      );
      setLeaderboard(data || []);
    } catch {}
    setLbLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);
  useEffect(() => {
    if (tab === "leaderboard") loadLeaderboard(lbTimeframe);
  }, [tab, lbTimeframe, loadLeaderboard]);

  // ── Streak calendar (last 30 days) ─────────────────────────────────────────
  const streakCalendar = profile?.streakCalendar || [];
  const streakDates = new Set(
    streakCalendar.map((d: string) => new Date(d).toDateString()),
  );
  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d;
  });

  const myLbEntry = leaderboard.find((e) => e.studentId === studentId);

  return (
    <main className="min-h-screen bg-[#F8F9FA] text-[#111111] font-sans">
      {/* Header */}
      <header className="h-14 bg-white border-b border-zinc-200 px-6 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-zinc-500 hover:text-zinc-800 cursor-pointer transition-colors"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <span className="font-bold text-zinc-900 text-sm">
              Competitive Hub
            </span>
          </div>
        </div>
        {profile && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              {profile.student.totalXp.toLocaleString()} XP
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200 px-3 py-1 rounded-full">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              {profile.student.currentStreak}d streak
            </div>
          </div>
        )}
      </header>

      {/* Tab Nav */}
      <nav className="bg-white border-b border-zinc-200 px-6 flex items-center gap-1">
        {(["overview", "leaderboard", "contests", "achievements"] as Tab[]).map(
          (t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-3 px-4 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border-b-2 ${
                tab === t
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-zinc-500 hover:text-zinc-800"
              }`}
            >
              {t}
            </button>
          ),
        )}
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-zinc-400 text-sm gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" /> Loading competitive
            data...
          </div>
        ) : (
          <>
            {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
            {tab === "overview" && (
              <div className="space-y-6">
                {/* Profile Stats */}
                {profile && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      {
                        label: "Total XP",
                        value: profile.student.totalXp.toLocaleString(),
                        icon: Zap,
                        color: "text-amber-500",
                        bg: "bg-amber-50",
                        border: "border-amber-200",
                      },
                      {
                        label: "Current Streak",
                        value: `${profile.student.currentStreak} days`,
                        icon: Flame,
                        color: "text-orange-500",
                        bg: "bg-orange-50",
                        border: "border-orange-200",
                      },
                      {
                        label: "Problems Solved",
                        value: profile.stats.problemsSolved,
                        icon: CheckCircle2,
                        color: "text-emerald-500",
                        bg: "bg-emerald-50",
                        border: "border-emerald-200",
                      },
                      {
                        label: "Contest Rating",
                        value: profile.student.contestRating,
                        icon: Trophy,
                        color: "text-blue-500",
                        bg: "bg-blue-50",
                        border: "border-blue-200",
                      },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className={`${stat.bg} border ${stat.border} rounded-2xl p-4 flex items-center gap-3`}
                      >
                        <div
                          className={`w-10 h-10 rounded-xl ${stat.bg} border ${stat.border} flex items-center justify-center`}
                        >
                          <stat.icon className={`w-5 h-5 ${stat.color}`} />
                        </div>
                        <div>
                          <div className="text-lg font-bold text-zinc-900">
                            {stat.value}
                          </div>
                          <div className="text-xs text-zinc-500">
                            {stat.label}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Daily Challenge + Weekly Challenge row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Daily Challenge */}
                  <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-center">
                          <Flame className="w-4 h-4 text-orange-500" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-zinc-900">
                            Daily Challenge
                          </div>
                          <div className="text-[11px] text-zinc-400">
                            Problem of the Day
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                        +{dailyChallenge?.bonusXp || 50} XP
                      </span>
                    </div>
                    {dailyChallenge ? (
                      <div className="space-y-3">
                        <div
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full border inline-block ${DIFF_COLOR[dailyChallenge.problem?.difficulty || "EASY"]}`}
                        >
                          {dailyChallenge.problem?.difficulty}
                        </div>
                        <div className="font-bold text-zinc-900">
                          {dailyChallenge.problem?.title}
                        </div>
                        <div className="text-xs text-zinc-500">
                          {dailyChallenge.totalSolved} people solved today
                        </div>
                        {profile?.dailyChallenge?.completed ? (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                            today!
                          </div>
                        ) : (
                          <button
                            onClick={() =>
                              router.push(
                                `/student/playground?problemId=${dailyChallenge.problemId}`,
                              )
                            }
                            className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                          >
                            Solve Challenge
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-zinc-400 italic">
                        No challenge configured for today.
                      </div>
                    )}
                  </div>

                  {/* Weekly Challenge */}
                  <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-center">
                          <Target className="w-4 h-4 text-blue-500" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-zinc-900">
                            Weekly Challenge
                          </div>
                          <div className="text-[11px] text-zinc-400">
                            This week's goal
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                        +{weeklyChallenge?.xpReward || 200} XP
                      </span>
                    </div>
                    {weeklyChallenge ? (
                      <div className="space-y-3">
                        <div className="font-bold text-zinc-900">
                          {weeklyChallenge.title}
                        </div>
                        <div className="text-xs text-zinc-500">
                          {weeklyChallenge.description}
                        </div>
                        {(() => {
                          const myProgress = weeklyChallenge.userProgress?.find(
                            (p: any) => p.studentId === studentId,
                          );
                          const progress = myProgress?.progress || 0;
                          const target = weeklyChallenge.goalTarget || 5;
                          const pct = Math.min(100, (progress / target) * 100);
                          return (
                            <div className="space-y-1.5">
                              <div className="flex justify-between text-xs text-zinc-600">
                                <span>
                                  {progress} / {target} problems
                                </span>
                                <span className="font-bold">
                                  {pct.toFixed(0)}%
                                </span>
                              </div>
                              <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              {myProgress?.completed && (
                                <div className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />{" "}
                                  Completed!
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="text-xs text-zinc-400 italic">
                        No weekly challenge active.
                      </div>
                    )}
                  </div>
                </div>

                {/* Streak Calendar */}
                {profile && (
                  <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <span className="font-bold text-sm text-zinc-900">
                        Streak Calendar
                      </span>
                      <span className="ml-auto text-xs text-zinc-400">
                        Last 30 days
                      </span>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {last30.map((d, i) => {
                        const active = streakDates.has(d.toDateString());
                        const isToday =
                          d.toDateString() === new Date().toDateString();
                        return (
                          <div
                            key={i}
                            title={d.toLocaleDateString()}
                            className={`w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold border transition-colors ${
                              active
                                ? "bg-orange-400 border-orange-500 text-white"
                                : isToday
                                  ? "bg-zinc-100 border-zinc-300 text-zinc-500"
                                  : "bg-zinc-50 border-zinc-200 text-zinc-300"
                            }`}
                          >
                            {d.getDate()}
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-3 flex items-center gap-6 text-xs text-zinc-500">
                      <span>
                        <strong className="text-zinc-800">
                          {profile.student.currentStreak}
                        </strong>{" "}
                        current streak
                      </span>
                      <span>
                        <strong className="text-zinc-800">
                          {profile.student.maxStreak}
                        </strong>{" "}
                        max streak
                      </span>
                      {profile.stats.globalRank && (
                        <span>
                          Global rank:{" "}
                          <strong className="text-zinc-800">
                            #{profile.stats.globalRank}
                          </strong>
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Recent XP */}
                {profile?.recentXp?.length > 0 && (
                  <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <Zap className="w-4 h-4 text-amber-500" />
                      <span className="font-bold text-sm text-zinc-900">
                        Recent XP Activity
                      </span>
                    </div>
                    <div className="space-y-2">
                      {profile.recentXp
                        .slice(0, 8)
                        .map((tx: any, i: number) => (
                          <div
                            key={i}
                            className="flex items-center justify-between py-2 border-b border-zinc-50 last:border-0"
                          >
                            <span className="text-xs text-zinc-600">
                              {tx.reason}
                            </span>
                            <span className="text-xs font-bold text-emerald-600">
                              +{tx.amount} XP
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── LEADERBOARD ───────────────────────────────────────────────────── */}
            {tab === "leaderboard" && (
              <div className="space-y-5">
                {/* Timeframe selector */}
                <div className="flex items-center gap-2">
                  {(["WEEKLY", "MONTHLY", "ALL_TIME"] as LbTimeframe[]).map(
                    (tf) => (
                      <button
                        key={tf}
                        onClick={() => {
                          setLbTimeframe(tf);
                          loadLeaderboard(tf);
                        }}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                          lbTimeframe === tf
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"
                        }`}
                      >
                        {tf === "ALL_TIME"
                          ? "All Time"
                          : tf === "WEEKLY"
                            ? "This Week"
                            : "This Month"}
                      </button>
                    ),
                  )}
                </div>

                {/* My rank callout */}
                {myLbEntry && (
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-4">
                    <div className="text-2xl font-black text-blue-600">
                      #{myLbEntry.rank}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-zinc-900">
                        Your rank
                      </div>
                      <div className="text-xs text-zinc-500">
                        {myLbEntry.totalXp.toLocaleString()} XP
                      </div>
                    </div>
                  </div>
                )}

                {/* Leaderboard table */}
                <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="grid grid-cols-12 gap-2 px-5 py-2.5 border-b border-zinc-100 bg-zinc-50 text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                    <div className="col-span-1">#</div>
                    <div className="col-span-5">Student</div>
                    <div className="col-span-3 text-right">XP</div>
                    <div className="col-span-2 text-right">Streak</div>
                    <div className="col-span-1 text-right">Rating</div>
                  </div>

                  {lbLoading ? (
                    <div className="py-10 text-center text-zinc-400 text-xs">
                      Loading...
                    </div>
                  ) : leaderboard.length === 0 ? (
                    <div className="py-10 text-center text-zinc-400 text-xs">
                      No data yet for this period.
                    </div>
                  ) : (
                    leaderboard.map((entry, idx) => {
                      const isMine = entry.studentId === studentId;
                      const rankIcons: Record<number, React.ElementType> = {
                        1: Crown,
                        2: Medal,
                        3: Star,
                      };
                      const RankIcon = rankIcons[entry.rank];
                      return (
                        <div
                          key={idx}
                          className={`grid grid-cols-12 gap-2 px-5 py-3.5 border-b border-zinc-50 last:border-0 transition-colors ${
                            isMine
                              ? "bg-blue-50/50"
                              : entry.rank <= 3
                                ? "bg-amber-50/30"
                                : "hover:bg-zinc-50/50"
                          }`}
                        >
                          <div className="col-span-1 flex items-center">
                            {RankIcon ? (
                              <RankIcon
                                className={`w-4 h-4 ${entry.rank === 1 ? "text-yellow-500" : entry.rank === 2 ? "text-zinc-400" : "text-amber-700"}`}
                              />
                            ) : (
                              <span className="text-xs font-bold text-zinc-500">
                                {entry.rank}
                              </span>
                            )}
                          </div>
                          <div className="col-span-5 flex items-center gap-2">
                            {entry.avatarUrl ? (
                              <img
                                src={entry.avatarUrl}
                                alt=""
                                className="w-7 h-7 rounded-full object-cover shrink-0"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-linear-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                                {entry.name?.[0]}
                              </div>
                            )}
                            <span
                              className={`text-sm font-semibold ${isMine ? "text-blue-700" : "text-zinc-800"}`}
                            >
                              {entry.name}
                            </span>
                            {isMine && (
                              <span className="text-[9px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full">
                                YOU
                              </span>
                            )}
                          </div>
                          <div className="col-span-3 flex items-center justify-end">
                            <span className="text-sm font-bold text-amber-600">
                              {entry.totalXp.toLocaleString()}
                            </span>
                          </div>
                          <div className="col-span-2 flex items-center justify-end gap-1 text-xs text-orange-500 font-semibold">
                            <Flame className="w-3 h-3" />
                            {entry.currentStreak}
                          </div>
                          <div className="col-span-1 flex items-center justify-end text-xs text-zinc-500 font-semibold">
                            {entry.contestRating}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* ── CONTESTS ──────────────────────────────────────────────────────── */}
            {tab === "contests" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-zinc-900">Contests</h2>
                  <span className="text-xs text-zinc-400">
                    {contests.length} contests
                  </span>
                </div>

                {contests.length === 0 ? (
                  <div className="bg-white border border-zinc-200 rounded-2xl py-16 text-center text-zinc-400 text-sm">
                    No contests scheduled yet.
                  </div>
                ) : (
                  contests.map((c: any) => (
                    <div
                      key={c.id}
                      className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLOR[c.status]}`}
                            >
                              {c.status === "LIVE" ? "Live Now" : c.status}
                            </span>
                            {c.isRated && (
                              <span className="text-[10px] font-bold text-purple-600 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                                Rated
                              </span>
                            )}
                          </div>
                          <div className="font-bold text-zinc-900 text-sm">
                            {c.title}
                          </div>
                          <div className="text-xs text-zinc-500 mt-1">
                            {c.description}
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-[11px] text-zinc-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {c.durationMinutes} min
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {c._count?.participants || 0} registered
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(c.startTime).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            if (!studentId) return;
                            try {
                              await apiFetch(
                                `/competitive/contests/${c.id}/register`,
                                { method: "POST" },
                              );
                              loadData();
                            } catch {}
                          }}
                          className={`shrink-0 px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                            c.status === "ENDED"
                              ? "bg-zinc-50 text-zinc-400 border-zinc-200 cursor-not-allowed"
                              : "bg-blue-600 hover:bg-blue-700 text-white border-transparent"
                          }`}
                          disabled={c.status === "ENDED"}
                        >
                          {c.status === "ENDED"
                            ? "Ended"
                            : c.status === "LIVE"
                              ? "Join Now"
                              : "Register"}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ── ACHIEVEMENTS ──────────────────────────────────────────────────── */}
            {tab === "achievements" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-zinc-900">
                    Achievements
                  </h2>
                  {profile && (
                    <span className="text-xs text-zinc-500">
                      <strong className="text-zinc-800">
                        {profile.achievements?.length || 0}
                      </strong>{" "}
                      / {achievements.length} unlocked
                    </span>
                  )}
                </div>

                {/* Group by category */}
                {(() => {
                  const unlockedKeys = new Set(
                    (profile?.achievements || []).map(
                      (a: any) => a.achievement?.key,
                    ),
                  );
                  const categories: Record<string, any[]> = {};
                  achievements.forEach((a) => {
                    categories[a.category] = categories[a.category] || [];
                    categories[a.category].push(a);
                  });
                  return Object.entries(categories).map(([cat, items]) => (
                    <div key={cat}>
                      <div className="text-xs uppercase font-bold text-zinc-400 tracking-wider mb-3">
                        {cat.replace(/_/g, " ")}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {items.map((a: any) => {
                          const unlocked = unlockedKeys.has(a.key);
                          const IconEl = ICON_MAP[a.icon] || Award;
                          return (
                            <div
                              key={a.id}
                              className={`rounded-2xl border p-4 flex items-center gap-3 transition-all ${
                                unlocked
                                  ? "bg-amber-50 border-amber-200 shadow-sm"
                                  : "bg-zinc-50 border-zinc-200 opacity-60"
                              }`}
                            >
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                  unlocked
                                    ? "bg-amber-100 border border-amber-300"
                                    : "bg-zinc-100 border border-zinc-200"
                                }`}
                              >
                                {unlocked ? (
                                  <IconEl className="w-5 h-5 text-amber-600" />
                                ) : (
                                  <Lock className="w-4 h-4 text-zinc-400" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div
                                  className={`text-sm font-bold truncate ${unlocked ? "text-zinc-900" : "text-zinc-500"}`}
                                >
                                  {a.title}
                                </div>
                                <div className="text-[11px] text-zinc-400 truncate">
                                  {a.description}
                                </div>
                                <div
                                  className={`text-[10px] font-bold mt-0.5 ${unlocked ? "text-amber-600" : "text-zinc-400"}`}
                                >
                                  +{a.xpReward} XP
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
