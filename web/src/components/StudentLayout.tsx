"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Code2,
  Trophy,
  Bot,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: BookOpen, label: "Assessments", href: "/student/assessments" },
  { icon: Code2, label: "Playground", href: "/student/playground" },
  { icon: Trophy, label: "Competitive", href: "/student/competitive" },
  { icon: Bot, label: "AI Tutor", href: "/student/ai-tutor" },
];

export function StudentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-[#F5F5F7]">
      {/* Fixed Left Sidebar */}
      <aside className="fixed top-0 left-0 h-screen w-14 bg-white border-r border-zinc-200 flex flex-col items-center py-4 z-30 shadow-sm">
        {/* Logo Mark */}
        <div className="w-8 h-8 bg-[#111111] rounded-lg flex items-center justify-center mb-6 shrink-0">
          <span className="text-white font-bold text-[11px] tracking-tight">
            PS
          </span>
        </div>

        {/* Nav Icons */}
        <nav className="flex flex-col items-center gap-1 flex-1 w-full px-2">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                title={item.label}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#111111] text-white shadow-sm"
                    : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                }`}
              >
                <item.icon className="w-4.5 h-4.5" />
              </button>
            );
          })}
        </nav>

        {/* Sign Out */}
        <button
          onClick={() => logout()}
          title="Sign Out"
          className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:bg-zinc-100 hover:text-red-500 transition-all cursor-pointer shrink-0"
        >
          <LogOut className="w-4.5 h-4.5" />
        </button>
      </aside>

      {/* Main Content — offset by sidebar width */}
      <div className="flex-1 ml-14 min-h-screen">{children}</div>
    </div>
  );
}
