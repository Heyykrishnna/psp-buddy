"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types";

export default function AuthPage() {
  const { login, sendVerificationCode, register, loginAsDemo } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const role: UserRole = "STUDENT";

  // Email Confirmation Code state
  const [verificationCode, setVerificationCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [infoMessage, setInfoMessage] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    setError("");
    setInfoMessage("");

    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address first.");
      return;
    }

    setLoading(true);
    try {
      await sendVerificationCode(email.trim());
      setCodeSent(true);
      setInfoMessage(
        "Confirmation code sent to your email address! Please check your inbox.",
      );
    } catch (err: any) {
      setError(err.message || "Failed to send confirmation code.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfoMessage("");

    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (isSignUp) {
      if (!firstName.trim() || !lastName.trim()) {
        setError("First and Last Name are required.");
        return;
      }

      if (!codeSent || !verificationCode.trim()) {
        setError("Please request and enter your confirmation code first.");
        return;
      }
    }

    setLoading(true);

    try {
      if (isSignUp) {
        await register(
          firstName.trim(),
          lastName.trim(),
          email.trim(),
          password,
          verificationCode.trim(),
          role,
        );
      } else {
        await login(email.trim(), password);
      }
    } catch (err: any) {
      setError(
        err.message || "Authentication failed. Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white text-[#111111] grid grid-cols-1 lg:grid-cols-12 selection:bg-[#111111] selection:text-white font-sans">
      {/* Left Column: Form Area (7 Columns) */}
      <div className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-12 lg:p-16 max-w-2xl mx-auto w-full">
        {/* Top Brand Header */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2.5">
            <span className="text-xl"></span>
            <span className="font-semibold text-lg tracking-tight text-[#111111]">
              PSP Lumora
            </span>
          </div>
        </div>

        {/* Form Body */}
        <div className="my-auto py-6">
          <h1 className="font-serif text-4xl sm:text-5xl font-normal tracking-tight text-[#111111] mb-2">
            {isSignUp ? "Create an Account" : "Welcome Back !"}
          </h1>

          <p className="text-xs text-zinc-500 mb-8">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
                setInfoMessage("");
                setCodeSent(false);
              }}
              className="text-[#111111] font-semibold underline underline-offset-4 hover:opacity-75 transition-opacity ml-1 cursor-pointer"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </p>

          {error && (
            <div className="mb-6 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => setError("")}
                className="text-red-400 hover:text-red-700 ml-2"
              ></button>
            </div>
          )}

          {infoMessage && (
            <div className="mb-6 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-md flex items-center justify-between">
              <span>{infoMessage}</span>
              <button
                onClick={() => setInfoMessage("")}
                className="text-emerald-500 hover:text-emerald-800 ml-2"
              ></button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-600 font-medium mb-1.5">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Jane"
                    className="w-full px-3.5 py-3 bg-[#F4F4F6] border border-transparent rounded-md text-sm text-[#111111] placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-[#111111] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-600 font-medium mb-1.5">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="w-full px-3.5 py-3 bg-[#F4F4F6] border border-transparent rounded-md text-sm text-[#111111] placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-[#111111] transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs text-zinc-600 font-medium mb-1.5">
                Email Address
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-3 bg-[#F4F4F6] border border-transparent rounded-md text-sm text-[#111111] placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-[#111111] transition-all"
                />
                {isSignUp && (
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={loading}
                    className="px-4 py-3 bg-zinc-800 hover:bg-black text-white text-xs font-medium rounded-md whitespace-nowrap transition-all cursor-pointer disabled:opacity-50"
                  >
                    {codeSent ? "Resend Code" : "Send Code"}
                  </button>
                )}
              </div>
            </div>

            {isSignUp && codeSent && (
              <div>
                <label className="block text-xs text-zinc-600 font-medium mb-1.5">
                  Email Confirmation Code
                </label>
                <input
                  type="text"
                  required
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="w-full px-3.5 py-3 bg-[#F4F4F6] border border-zinc-300 rounded-md text-sm font-mono text-[#111111] placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-[#111111] transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-xs text-zinc-600 font-medium mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (min 6 chars)"
                className="w-full px-3.5 py-3 bg-[#F4F4F6] border border-transparent rounded-md text-sm text-[#111111] placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-[#111111] transition-all"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 bg-[#111111] hover:bg-black text-white text-sm font-medium rounded-md transition-all disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {loading
                  ? "Processing..."
                  : isSignUp
                    ? "Verify & Create Account"
                    : "Sign In"}
              </button>
            </div>
          </form>
        </div>

        {/* Bottom Footer */}
        <div className="text-[11px] text-zinc-400 flex items-center justify-between pt-6">
          <span>© 2026 PSP Lumora. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-zinc-700">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-zinc-700">
              Terms of Service
            </a>
          </div>
        </div>
      </div>

      {/* Right Column: Side Banner */}
      <div className="hidden lg:flex lg:col-span-5 bg-[#111111] text-white p-12 flex-col justify-between relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative z-10 max-w-md my-auto space-y-6">
          <h2 className="font-serif text-4xl lg:text-5xl font-normal leading-tight text-zinc-100">
            Secured Email & Password Access.
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed font-sans">
            Every user is verified via a 6-digit confirmation code before
            account registration, ensuring 100% database security and data
            integrity.
          </p>
        </div>

        <div className="relative z-10 pt-8 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500 font-mono"></div>
      </div>
    </div>
  );
}
