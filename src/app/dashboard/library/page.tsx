"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import confetti from "canvas-confetti";
import { 
  Search, Filter, Database, ThumbsUp, Copy, Check, ExternalLink, 
  Sparkles, Layers, RefreshCw, Loader2, ArrowLeft 
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function LibraryPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [keptOnly, setKeptOnly] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSyncingRag, setIsSyncingRag] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

  const queryString = `/api/prompts?${new URLSearchParams({
    search,
    type: typeFilter,
    keptOnly: keptOnly ? "true" : "false",
  }).toString()}`;

  const { data, error, mutate, isValidating } = useSWR(queryString, fetcher);
  const prompts = data?.prompts || [];

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleKeep = async (promptId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/prompts/${promptId}/keep`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isKept: !currentStatus }),
      });
      if (res.ok) {
        mutate();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSyncToRag = async () => {
    setIsSyncingRag(true);
    setSyncMessage("");

    try {
      const res = await fetch("/api/rag/promote", { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        setSyncMessage(`🎉 Success! ${json.promotedCount || 0} kept prompts embedded into pgvector style memory.`);
        confetti({
          particleCount: 55,
          spread: 65,
          origin: { y: 0.7 },
          colors: ["#38bdf8", "#fb923c", "#34d399", "#f472b6"],
        });
      } else {
        setSyncMessage(`Error: ${json.error || "Failed to sync"}`);
      }
    } catch (err: any) {
      setSyncMessage(`Error: ${err.message}`);
    } finally {
      setIsSyncingRag(false);
      setTimeout(() => setSyncMessage(""), 5000);
    }
  };

  return (
    <div className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/dashboard"
              className="p-1.5 clay-btn-white rounded-full text-slate-600 hover:text-slate-900 inline-flex items-center"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Marketing Library & History
            </h1>
          </div>
          <p className="text-xs text-slate-600 font-medium ml-7">
            Search, filter, and organize all your AI marketing scripts and visual prompts.
          </p>
        </div>

        {/* Sync Kept Prompts to RAG */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncToRag}
            disabled={isSyncingRag}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full clay-btn-sky text-white text-xs font-bold shadow-md transition-all self-start md:self-auto"
          >
            {isSyncingRag ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
            ) : (
              <Database className="w-3.5 h-3.5 text-sky-100" />
            )}
            <span>Sync Kept to RAG Memory</span>
          </button>
        </div>
      </div>

      {syncMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-teal-100/90 border border-teal-300 text-xs font-bold text-teal-900 shadow-md">
          {syncMessage}
        </div>
      )}

      {/* Filter and Search Controls (Clay Look) */}
      <div className="clay-card p-4 sm:p-5 mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Inset Search bar */}
          <div className="clay-inset-input px-4 py-2.5 flex items-center gap-2.5 flex-1">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search scripts, visual descriptions, topics, or business names..."
              className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none"
            />
          </div>

          {/* Type Filter */}
          <div className="clay-inset-input px-4 py-2.5">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
            >
              <option value="all">All Content Types</option>
              <option value="reel">Instagram Reels</option>
              <option value="short">YouTube Shorts</option>
              <option value="image">Studio Images</option>
            </select>
          </div>

          {/* Kept Only Toggle */}
          <button
            onClick={() => setKeptOnly(!keptOnly)}
            className={`px-5 py-2.5 rounded-full text-xs font-black transition-all flex items-center justify-center gap-2 ${
              keptOnly
                ? "clay-btn-mint text-white shadow-md"
                : "clay-btn-white text-slate-700 hover:scale-105"
            }`}
          >
            <ThumbsUp className={`w-3.5 h-3.5 ${keptOnly ? "fill-white" : ""}`} />
            <span>Favorites Only</span>
          </button>
        </div>
      </div>

      {/* Prompts Cards Grid */}
      {isValidating && prompts.length === 0 && (
        <div className="py-12 text-center text-slate-500 text-xs font-medium">
          <Loader2 className="w-6 h-6 animate-spin text-sky-600 mx-auto mb-2" />
          Loading library assets...
        </div>
      )}

      {prompts.length === 0 && !isValidating && (
        <div className="clay-card p-12 text-center my-6">
          <Layers className="w-10 h-10 text-sky-400 mx-auto mb-3" />
          <h3 className="text-base font-black text-slate-900 mb-1">No Assets Match Filter</h3>
          <p className="text-xs text-slate-600 max-w-sm mx-auto mb-4 font-medium">
            Try clearing your search query or generate new items from the dashboard generator.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full clay-btn-sky text-white text-xs font-bold shadow-md"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Open Generator
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {prompts.map((prompt: any) => {
          const isKept = prompt.is_kept;
          return (
            <div
              key={prompt.id}
              className={`clay-card p-5 flex flex-col justify-between ${
                isKept ? "border-2 border-emerald-400 shadow-[0_10px_25px_rgba(52,211,153,0.25)]" : ""
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-0.5 rounded-full clay-btn-white text-slate-800 text-[10px] font-black uppercase tracking-wider">
                    {prompt.type === "reel" ? "Reel" : prompt.type === "short" ? "Short" : "Image"}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        handleCopy(
                          prompt.id,
                          `${prompt.title}\n\n${prompt.prompt_text}\n\nDescription:\n${prompt.description || ""}`
                        )
                      }
                      title="Copy script / prompt"
                      className="w-8 h-8 clay-circle-btn flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors"
                    >
                      {copiedId === prompt.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      onClick={() => handleToggleKeep(prompt.id, isKept)}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black transition-all ${
                        isKept
                          ? "clay-btn-mint text-white"
                          : "clay-btn-white text-slate-700 hover:scale-105"
                      }`}
                    >
                      <ThumbsUp className={`w-3 h-3 ${isKept ? "fill-white" : ""}`} />
                      <span>{isKept ? "Saved" : "Save"}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-bold block">
                    {prompt.business_name} • {prompt.business_industry}
                  </span>
                  <h3 className="text-sm font-black text-slate-900 leading-snug line-clamp-2 mt-0.5">
                    {prompt.title}
                  </h3>
                </div>

                <div className="clay-inset-input p-3.5 rounded-2xl text-xs text-slate-800 line-clamp-4 leading-relaxed font-medium">
                  {prompt.prompt_text}
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                <span>{prompt.tone || "Standard"}</span>
                <Link
                  href={`/dashboard/requests/${prompt.request_id}`}
                  className="text-sky-700 hover:underline font-bold"
                >
                  View Details →
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
