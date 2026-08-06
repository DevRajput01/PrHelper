"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import useSWR from "swr";
import confetti from "canvas-confetti";
import { 
  Sparkles, Video, Film, Image as ImageIcon, Copy, Check, ThumbsUp, 
  Search, Bell, User, LayoutDashboard, Zap, Music, Heart, 
  BarChart2, Settings, LogOut, Flame, Clock, Play, ArrowRight,
  ExternalLink, Loader2, CheckCircle2, ChevronDown, X, CheckCheck
} from "lucide-react";
import { getUserAvatar } from "@/lib/avatar";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const QUICK_PRESETS = [
  { name: "Artisan Bakery", topic: "Fresh morning sourdough & artisan croissants" },
  { name: "Fitness Gym", topic: "30-min kettlebell workout & HIIT transformation" },
  { name: "Luxury Villa", topic: "Sunset modern oceanfront architectural home" },
  { name: "Organic Skincare", topic: "3-step morning botanical glow serum" },
];

interface NotificationItem {
  id: number;
  title: string;
  desc: string;
  time: string;
  unread: boolean;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const userName = session?.user?.name || "Creator";
  const userAvatar = getUserAvatar(userName || session?.user?.email);

  // Generator form state
  const [businessName, setBusinessName] = useState("");
  const [topic, setTopic] = useState("");
  const [loadingType, setLoadingType] = useState<"reel" | "short" | "image" | null>(null);
  const [activeItem, setActiveItem] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");

  // Interactive Notifications state
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 1,
      title: "Welcome to 3D Marketing Studio!",
      desc: "Start by generating your first Instagram Reel or AI Photo.",
      time: "Just now",
      unread: true,
    },
    {
      id: 2,
      title: "pgvector Style Memory Active",
      desc: "NeonDB vector similarity matching connected for high-converting tone blueprints.",
      time: "5m ago",
      unread: true,
    },
    {
      id: 3,
      title: "Free AI Visual Engine Ready",
      desc: "Instant image generation is enabled with zero API costs.",
      time: "1h ago",
      unread: true,
    },
  ]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleMarkAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, unread: false })));
  };

  const handleDismissNotification = (id: number) => {
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  // Fetch prompts history
  const { data, mutate } = useSWR("/api/prompts?limit=20", fetcher);
  const prompts = data?.prompts || [];

  // Derived counts
  const reelCount = prompts.filter((p: any) => p.type === "reel").length;
  const shortCount = prompts.filter((p: any) => p.type === "short").length;
  const imageCount = prompts.filter((p: any) => p.type === "image").length;
  const keptCount = prompts.filter((p: any) => p.is_kept).length;

  const handleGenerateSingle = async (type: "reel" | "short" | "image") => {
    setErrorMsg("");
    if (!businessName.trim()) {
      setErrorMsg("Please enter your business name first.");
      return;
    }

    setLoadingType(type);

    try {
      const res = await fetch("/api/generate-single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: businessName.trim(),
          topic: topic || `${businessName} Story & Special Offer`,
          type,
        }),
      });

      const json = await res.json();
      if (res.ok && json.prompt) {
        setActiveItem(json.prompt);
        mutate();
        confetti({
          particleCount: 45,
          spread: 65,
          origin: { y: 0.8 },
          colors: ["#38bdf8", "#fb923c", "#34d399", "#f472b6"],
        });
      } else {
        setErrorMsg(json.error || "Failed to generate item");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred");
    } finally {
      setLoadingType(null);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleKeep = async (promptId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/prompts/${promptId}/keep`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isKept: !currentStatus }),
      });
      if (res.ok) {
        if (activeItem && activeItem.id === promptId) {
          setActiveItem({ ...activeItem, is_kept: !currentStatus });
        }
        mutate();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-[1340px] mx-auto p-4 sm:p-6 lg:p-8">
      {/* Outer 3D Canvas Card */}
      <div className="clay-card p-4 sm:p-7 grid grid-cols-1 lg:grid-cols-12 gap-7">
        
        {/* =========================================================================
            LEFT COLUMN: 3D PASTEL CLAY SIDEBAR (Matching reference image)
            ========================================================================= */}
        <aside className="lg:col-span-3 clay-sidebar p-5 flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            {/* User Personalized 3D Doodle Avatar Profile Header */}
            <div className="flex flex-col items-center text-center pt-2">
              <div className="relative w-24 h-24 rounded-full p-1.5 bg-white shadow-[0_8px_20px_rgba(0,0,0,0.08)] border-2 border-white mb-3 overflow-hidden">
                <img
                  src={userAvatar}
                  alt={userName}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <h2 className="text-base font-black text-slate-800 tracking-tight">
                Hi, {userName}! 👋
              </h2>
              <span className="text-[11px] font-bold text-slate-600">
                Marketing Studio Pro
              </span>
            </div>

            {/* Navigation Pills */}
            <nav className="space-y-1.5">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-4 py-3 clay-nav-active transition-all"
              >
                <LayoutDashboard className="w-4 h-4 text-sky-600" />
                <span className="text-xs">Dashboard</span>
              </Link>

              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-4 py-2.5 clay-nav-item transition-all"
              >
                <Zap className="w-4 h-4 text-slate-500" />
                <span className="text-xs">Quick Generator</span>
              </Link>

              <Link
                href="/dashboard/library"
                className="flex items-center gap-3 px-4 py-2.5 clay-nav-item transition-all"
              >
                <Music className="w-4 h-4 text-slate-500" />
                <span className="text-xs">Saved Scripts</span>
              </Link>

              <Link
                href="/dashboard/library?keptOnly=true"
                className="flex items-center gap-3 px-4 py-2.5 clay-nav-item transition-all"
              >
                <Heart className="w-4 h-4 text-slate-500" />
                <span className="text-xs">Favorites ({keptCount})</span>
              </Link>

              <div className="pt-2 border-t border-slate-300/40">
                <div className="flex items-center gap-3 px-4 py-2.5 clay-nav-item cursor-pointer">
                  <BarChart2 className="w-4 h-4 text-slate-500" />
                  <span className="text-xs">Activity & Stats</span>
                </div>

                <div className="flex items-center gap-3 px-4 py-2.5 clay-nav-item cursor-pointer">
                  <Settings className="w-4 h-4 text-slate-500" />
                  <span className="text-xs">Settings</span>
                </div>
              </div>
            </nav>
          </div>

          {/* Bottom Sign Out */}
          {session?.user && (
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 clay-btn-white text-xs text-slate-700"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          )}
        </aside>

        {/* =========================================================================
            RIGHT COLUMN: MAIN CONTENT (Header, Banner, 4 Metric Tiles, Generator, Charts)
            ========================================================================= */}
        <main className="lg:col-span-9 space-y-6 relative">
          
          {/* Top Bar: Title, Search Pill, Notifications, User */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Dashboard
            </h1>

            <div className="flex items-center gap-3 relative">
              {/* Inset Search Pill */}
              <div className="clay-inset-input px-4 py-2 flex items-center gap-2.5 flex-1 sm:w-72">
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search marketing scripts, topics..."
                  className="w-full bg-transparent text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none"
                />
              </div>

              {/* 3D Interactive Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  title="Notifications"
                  className="w-9 h-9 clay-circle-btn flex items-center justify-center text-slate-600 hover:scale-105 transition-transform"
                >
                  <Bell className="w-4 h-4" />
                </button>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center shadow-sm animate-pulse">
                    {unreadCount}
                  </span>
                )}

                {/* Notifications Dropdown Panel */}
                {notificationsOpen && (
                  <div className="absolute right-0 top-12 w-80 sm:w-96 clay-card p-4 z-50 shadow-2xl space-y-3 border-2 border-sky-300 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-sky-600" />
                        <span className="text-xs font-black text-slate-900">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-bold">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-[10px] text-sky-700 font-bold hover:underline flex items-center gap-1"
                          >
                            <CheckCheck className="w-3 h-3" />
                            Mark read
                          </button>
                        )}
                        <button
                          onClick={() => setNotificationsOpen(false)}
                          className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {notifications.length === 0 ? (
                        <div className="text-center py-6 text-xs text-slate-500 font-medium">
                          No notifications yet
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`p-3 rounded-2xl transition-all relative ${
                              n.unread ? "bg-sky-50/90 border border-sky-200" : "bg-slate-50 border border-slate-200"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="text-xs font-black text-slate-900">{n.title}</h4>
                                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed font-medium">
                                  {n.desc}
                                </p>
                                <span className="text-[9px] font-bold text-slate-400 mt-1 block">
                                  {n.time}
                                </span>
                              </div>
                              <button
                                onClick={() => handleDismissNotification(n.id)}
                                className="text-slate-400 hover:text-slate-600 p-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 3D Circular User Avatar Profile */}
              <div className="w-9 h-9 clay-circle-btn flex items-center justify-center overflow-hidden border border-white bg-sky-50">
                <img
                  src={userAvatar}
                  alt={userName}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Welcome Banner Card (Mascot Greeting) */}
          <div className="clay-banner-peach p-6 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
            <div className="flex items-center gap-5 z-10">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 bg-white shadow-md shrink-0 border-2 border-white overflow-hidden bg-sky-50">
                <img
                  src={userAvatar}
                  alt={userName}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                  Good Day, {userName}! ☀️
                </h2>
                <p className="text-xs sm:text-sm text-slate-700 font-medium mt-1 max-w-sm">
                  Let's generate high-converting marketing reels & photos for your business!
                </p>
                <div className="mt-3">
                  <button
                    onClick={() => {
                      const el = document.getElementById("generator-form");
                      el?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 clay-btn-orange text-xs font-bold shadow-md"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Create New Marketing Asset</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Potted Plant 3D Illustration on right */}
            <div className="hidden sm:block w-28 h-28 shrink-0 z-10">
              <img
                src="/plant_clay.png"
                alt="Plant"
                className="w-full h-full object-contain drop-shadow-md"
              />
            </div>
          </div>

          {/* 4 Colorful 3D Soft Metric Tiles (Sky Blue, Peach, Amber, Mint) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Tile 1: Sky Blue */}
            <div className="clay-tile-sky p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-full bg-white/80 shadow-sm flex items-center justify-center text-sky-600">
                  <Video className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-700 block">Reel Scripts</span>
                <span className="text-2xl font-black text-slate-900 tracking-tight">
                  {1240 + reelCount}
                </span>
                <span className="text-[10px] font-bold text-sky-700 block mt-0.5">
                  +18% this week
                </span>
              </div>
            </div>

            {/* Tile 2: Peach */}
            <div className="clay-tile-peach p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-full bg-white/80 shadow-sm flex items-center justify-center text-orange-600">
                  <Film className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-700 block">Shorts Created</span>
                <span className="text-2xl font-black text-slate-900 tracking-tight">
                  {120 + shortCount}
                </span>
                <span className="text-[10px] font-bold text-orange-700 block mt-0.5">
                  +8 this week
                </span>
              </div>
            </div>

            {/* Tile 3: Amber */}
            <div className="clay-tile-amber p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-full bg-white/80 shadow-sm flex items-center justify-center text-amber-600">
                  <ImageIcon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-700 block">Studio Photos</span>
                <span className="text-2xl font-black text-slate-900 tracking-tight">
                  {(34.6 + imageCount * 0.1).toFixed(1)}k
                </span>
                <span className="text-[10px] font-bold text-amber-700 block mt-0.5">
                  +6.2 this week
                </span>
              </div>
            </div>

            {/* Tile 4: Mint */}
            <div className="clay-tile-mint p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-full bg-white/80 shadow-sm flex items-center justify-center text-emerald-600">
                  <Flame className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-700 block">Current Streak</span>
                <span className="text-2xl font-black text-slate-900 tracking-tight">
                  {7 + (keptCount > 0 ? 1 : 0)}
                </span>
                <span className="text-[10px] font-bold text-emerald-700 block mt-0.5">
                  days in a row
                </span>
              </div>
            </div>
          </div>

          {/* Simple On-Demand Generator Card */}
          <div id="generator-form" className="clay-card p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-500" />
                1-Click Marketing Generator
              </h3>
              <span className="text-[11px] font-bold text-slate-500">
                Click any button below to generate
              </span>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-2xl bg-red-100/90 border border-red-300 text-xs text-red-800 font-bold">
                {errorMsg}
              </div>
            )}

            {/* 2 Simple Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                  1. Business Name *
                </label>
                <div className="clay-inset-input px-4 py-2.5">
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Wild Flour Bakery"
                    className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                  2. What are you promoting? (Topic)
                </label>
                <div className="clay-inset-input px-4 py-2.5">
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Fresh sourdough & morning croissants"
                    className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Quick autofill chips */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-slate-500">Autofill Examples:</span>
              {QUICK_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setBusinessName(p.name);
                    setTopic(p.topic);
                  }}
                  className="px-3 py-1 rounded-full clay-btn-white text-[11px] text-slate-700 hover:text-sky-700 font-bold transition-all"
                >
                  + {p.name}
                </button>
              ))}
            </div>

            {/* The 3 Puffy 3D Clay Action Buttons */}
            <div className="pt-3 border-t border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* 1. Sky Blue Button (Reel) */}
                <button
                  type="button"
                  disabled={loadingType !== null}
                  onClick={() => handleGenerateSingle("reel")}
                  className="py-4 px-4 clay-btn-sky flex flex-col items-center justify-center gap-1 shadow-md"
                >
                  {loadingType === "reel" ? (
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                  ) : (
                    <Video className="w-5 h-5 text-sky-100" />
                  )}
                  <span className="text-xs sm:text-sm font-black">
                    {loadingType === "reel" ? "Synthesizing..." : "Generate Reel Script"}
                  </span>
                  <span className="text-[10px] text-sky-100 font-medium">Instagram Video Hook & Scenes</span>
                </button>

                {/* 2. Orange Button (Short) */}
                <button
                  type="button"
                  disabled={loadingType !== null}
                  onClick={() => handleGenerateSingle("short")}
                  className="py-4 px-4 clay-btn-orange flex flex-col items-center justify-center gap-1 shadow-md"
                >
                  {loadingType === "short" ? (
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                  ) : (
                    <Film className="w-5 h-5 text-orange-100" />
                  )}
                  <span className="text-xs sm:text-sm font-black">
                    {loadingType === "short" ? "Synthesizing..." : "Generate YouTube Short"}
                  </span>
                  <span className="text-[10px] text-orange-100 font-medium">Numbered Scene Beats</span>
                </button>

                {/* 3. Mint Button (Image) */}
                <button
                  type="button"
                  disabled={loadingType !== null}
                  onClick={() => handleGenerateSingle("image")}
                  className="py-4 px-4 clay-btn-mint flex flex-col items-center justify-center gap-1 shadow-md"
                >
                  {loadingType === "image" ? (
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-emerald-100" />
                  )}
                  <span className="text-xs sm:text-sm font-black">
                    {loadingType === "image" ? "Rendering..." : "Generate AI Photo"}
                  </span>
                  <span className="text-[10px] text-emerald-100 font-medium">Studio Rendered Visual</span>
                </button>
              </div>
            </div>
          </div>

          {/* Live In-Place Result Card */}
          {activeItem && (
            <div className="clay-card p-6 sm:p-7 border-2 border-sky-400 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full clay-btn-sky text-[10px] font-black uppercase tracking-wider">
                    {activeItem.type === "reel" ? "Instagram Reel" : activeItem.type === "short" ? "YouTube Short" : "Studio Visual"}
                  </span>
                  <span className="text-xs font-bold text-slate-600">Generated Just Now</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      handleCopy(
                        `${activeItem.title}\n\n${activeItem.prompt_text}\n\n${activeItem.description || ""}`
                      )
                    }
                    className="px-3.5 py-1.5 rounded-full clay-btn-white text-xs font-bold flex items-center gap-1.5"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Copied!" : "Copy Text"}</span>
                  </button>

                  <button
                    onClick={() => handleToggleKeep(activeItem.id, activeItem.is_kept)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all flex items-center gap-1.5 ${
                      activeItem.is_kept ? "clay-btn-mint text-white" : "clay-btn-white text-slate-700"
                    }`}
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 ${activeItem.is_kept ? "fill-white" : ""}`} />
                    <span>{activeItem.is_kept ? "Saved" : "Save to Favorites"}</span>
                  </button>
                </div>
              </div>

              <h2 className="text-xl font-black text-slate-900">{activeItem.title}</h2>

              <div className="clay-inset-input p-4 rounded-2xl">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1.5">
                  {activeItem.type === "image" ? "Diffusion Image Prompt" : "Script & Direction"}
                </span>
                <p className="text-xs sm:text-sm text-slate-900 leading-relaxed font-medium whitespace-pre-line">
                  {activeItem.prompt_text}
                </p>
              </div>

              {activeItem.description && (
                <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 text-xs text-sky-900 font-medium">
                  <span className="font-bold text-sky-950">Caption & Copy: </span>
                  {activeItem.description}
                </div>
              )}

              {activeItem.type === "image" && activeItem.assets && activeItem.assets.length > 0 && (
                <div className="pt-2">
                  <span className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2">
                    Rendered Visual Preview
                  </span>
                  <div className="relative rounded-2xl overflow-hidden border-2 border-white shadow-lg group">
                    <img
                      src={activeItem.assets[0].url}
                      alt={activeItem.title}
                      className="w-full max-h-[320px] object-cover rounded-2xl"
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <a
                        href={activeItem.assets[0].url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 clay-btn-white text-slate-900 text-xs font-bold inline-flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Open Full Size
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              BOTTOM ROW: 3D CHARTS & ACTIVITY OVERVIEW (Matching reference layout)
              ========================================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Left: 3D Bar Chart (Generation Overview) */}
            <div className="md:col-span-7 clay-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Generation Overview
                </h4>
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 clay-inset-input px-2.5 py-1">
                  <span>This Week</span>
                  <ChevronDown className="w-3 h-3" />
                </div>
              </div>

              {/* 3D Pastel Bars */}
              <div className="pt-4 flex items-end justify-between h-40 px-2">
                {[
                  { day: "Mon", height: "45%", color: "bg-gradient-to-t from-orange-400 to-amber-300" },
                  { day: "Tue", height: "70%", color: "bg-gradient-to-t from-amber-400 to-yellow-300" },
                  { day: "Wed", height: "55%", color: "bg-gradient-to-t from-emerald-400 to-teal-300" },
                  { day: "Thu", height: "85%", color: "bg-gradient-to-t from-sky-400 to-cyan-300" },
                  { day: "Fri", height: "60%", color: "bg-gradient-to-t from-teal-400 to-emerald-300" },
                  { day: "Sat", height: "90%", color: "bg-gradient-to-t from-sky-500 to-blue-400" },
                  { day: "Sun", height: "75%", color: "bg-gradient-to-t from-purple-400 to-pink-300" },
                ].map((bar, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 flex-1">
                    <div
                      className={`w-7 sm:w-8 clay-bar ${bar.color}`}
                      style={{ height: bar.height }}
                    />
                    <span className="text-[10px] font-bold text-slate-500">{bar.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: 3D Donut Chart / Top Formats */}
            <div className="md:col-span-5 clay-card p-5 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Top Formats
              </h4>

              <div className="flex items-center justify-between gap-4 pt-2">
                {/* 3D Circular Pie graphic */}
                <div className="relative w-28 h-28 rounded-full border-8 border-sky-300 flex items-center justify-center bg-gradient-to-tr from-amber-200 via-orange-300 to-teal-300 shadow-md">
                  <div className="w-14 h-14 rounded-full bg-white shadow-inner flex items-center justify-center">
                    <span className="text-[10px] font-black text-slate-700">100%</span>
                  </div>
                </div>

                {/* Legend list */}
                <div className="space-y-1.5 flex-1 text-xs font-bold text-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                      Reels
                    </span>
                    <span className="text-slate-500">45%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
                      Shorts
                    </span>
                    <span className="text-slate-500">25%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
                      Photos
                    </span>
                    <span className="text-slate-500">20%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                      Other
                    </span>
                    <span className="text-slate-500">10%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
