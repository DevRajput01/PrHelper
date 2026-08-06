"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, Lock, Mail, User, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";

import { BrandLogo } from "@/components/BrandLogo";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill out all fields.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    try {
      // 1. Register user in database
      const regRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });

      const regData = await regRes.json();

      if (!regRes.ok) {
        setError(regData.error || "Failed to create account. Please try again.");
        setLoading(false);
        return;
      }

      setSuccess(true);

      // 2. Automatically sign in the registered user
      const loginRes = await signIn("credentials", {
        redirect: false,
        email: email.trim(),
        password,
      });

      if (loginRes?.error) {
        router.push("/sign-in?registered=true");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6 flex flex-col items-center">
          <Link href="/" className="inline-flex items-center gap-2.5 group mb-3">
            <BrandLogo size="lg" />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Create Free Account</h1>
          <p className="text-xs text-slate-600 font-semibold mt-1">Join PrHelper 3D Marketing Studio</p>
        </div>

        {/* 3D Clay Card */}
        <div className="clay-card p-6 sm:p-8 space-y-5">
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-100/90 border border-red-300 text-xs text-red-800 font-bold">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-2xl bg-teal-100/90 border border-teal-300 text-xs text-teal-900 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>Account created successfully! Logging in...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                Full Name *
              </label>
              <div className="clay-inset-input px-4 py-2.5 flex items-center gap-2.5">
                <User className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Sarah Jenkins"
                  className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                Email Address *
              </label>
              <div className="clay-inset-input px-4 py-2.5 flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sarah@yourbusiness.com"
                  className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                Password (min 6 characters) *
              </label>
              <div className="clay-inset-input px-4 py-2.5 flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-3.5 px-4 rounded-full clay-btn-sky text-white font-black text-xs sm:text-sm shadow-lg transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-sky-100" />
                  <span>Register & Launch</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>

          <div className="text-center text-xs text-slate-600 font-medium pt-3 border-t border-slate-200">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-sky-700 font-bold hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
