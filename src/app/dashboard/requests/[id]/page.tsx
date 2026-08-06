"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import confetti from "canvas-confetti";
import { 
  Sparkles, Video, Film, Image as ImageIcon, Copy, Check, ThumbsUp, 
  ArrowLeft, Loader2, ExternalLink, CheckCircle2
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function RequestDetailsPage() {
  const params = useParams();
  const requestId = params.id as string;

  const [activeFilter, setActiveFilter] = useState<"all" | "reel" | "short" | "image">("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [keepingId, setKeepingId] = useState<string | null>(null);

  // Poll status endpoint every 2.5s while processing
  const { data, error, mutate } = useSWR(
    requestId ? `/api/requests/${requestId}/status` : null,
    fetcher,
    {
      refreshInterval: (data) => (data?.status === "complete" ? 0 : 2500),
    }
  );

  const request = data?.request;
  const prompts = data?.prompts || [];
  const status = data?.status || "pending";

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleKeep = async (promptId: string, currentStatus: boolean) => {
    setKeepingId(promptId);
    const newStatus = !currentStatus;

    try {
      const res = await fetch(`/api/prompts/${promptId}/keep`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isKept: newStatus }),
      });

      if (res.ok) {
        if (newStatus) {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.8 },
            colors: ["#a855f7", "#2dd4bf", "#f472b6", "#38bdf8"],
          });
        }
        mutate();
      }
    } catch (err) {
      console.error("Failed to toggle keep status:", err);
    } finally {
      setKeepingId(null);
    }
  };

  const filteredPrompts = prompts.filter((p: any) => {
    if (activeFilter === "all") return true;
    return p.type === activeFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
      {/* Back link & Campaign Header */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-950 transition-colors mb-4 font-bold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Generator Dashboard
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-4xl font-black text-stone-950 tracking-tight">
                {request?.business_name || "Marketing Campaign"}
              </h1>
              <span
                className={`text-[11px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider ${
                  status === "complete"
                    ? "liquid-gel-teal text-white"
                    : status === "processing"
                    ? "bg-amber-400 text-amber-950 animate-pulse"
                    : "liquid-pill text-stone-700"
                }`}
              >
                {status}
              </span>
            </div>
            <p className="text-xs text-stone-600 font-medium mt-1">
              Topic: {request?.topic} • Tone: {request?.tone} • Target Duration: {request?.duration_seconds}s
            </p>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full liquid-gel-purple text-white text-xs font-bold shadow-md transition-all self-start md:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Generate Another
          </Link>
        </div>
      </div>

      {/* Video Rendering Coming Soon Banner */}
      <div className="liquid-glass p-4 mb-8 flex items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 liquid-glass-orb flex items-center justify-center shrink-0">
            <Video className="w-4 h-4 text-purple-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-stone-900">
                Direct Video Rendering
              </span>
              <span className="text-[10px] uppercase font-black px-2 py-0.2 rounded-full liquid-gel-teal text-white">
                Coming Soon
              </span>
            </div>
            <p className="text-[11px] text-stone-600 font-medium">
              This version outputs video-ready scripts and studio prompts for CapCut, Premiere, or Sora. Images are generated immediately below.
            </p>
          </div>
        </div>
      </div>

      {/* Loading state while generating */}
      {status === "processing" && prompts.length === 0 && (
        <div className="liquid-glass-card p-12 text-center my-8">
          <Loader2 className="w-10 h-10 animate-spin text-purple-600 mx-auto mb-4" />
          <h3 className="text-lg font-black text-stone-950 mb-1">
            Generating Your Liquid Content Package...
          </h3>
          <p className="text-xs text-stone-600 max-w-md mx-auto font-medium">
            Retrieving nearest style blueprints from NeonDB pgvector, running Gemini prompt synthesizer, and rendering open-source image visuals.
          </p>
        </div>
      )}

      {/* Filter Tabs */}
      {prompts.length > 0 && (
        <div className="flex items-center justify-between gap-4 mb-6 border-b border-white/60 pb-3">
          <div className="flex items-center gap-2 overflow-x-auto liquid-segmented-pill">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-4 py-1.5 rounded-full text-xs font-black transition-all ${
                activeFilter === "all"
                  ? "bg-white text-stone-950 shadow-sm"
                  : "text-stone-600 hover:text-stone-950"
              }`}
            >
              All Assets ({prompts.length})
            </button>
            <button
              onClick={() => setActiveFilter("reel")}
              className={`px-4 py-1.5 rounded-full text-xs font-black transition-all ${
                activeFilter === "reel"
                  ? "bg-white text-stone-950 shadow-sm"
                  : "text-stone-600 hover:text-stone-950"
              }`}
            >
              Reels ({prompts.filter((p: any) => p.type === "reel").length})
            </button>
            <button
              onClick={() => setActiveFilter("short")}
              className={`px-4 py-1.5 rounded-full text-xs font-black transition-all ${
                activeFilter === "short"
                  ? "bg-white text-stone-950 shadow-sm"
                  : "text-stone-600 hover:text-stone-950"
              }`}
            >
              Shorts ({prompts.filter((p: any) => p.type === "short").length})
            </button>
            <button
              onClick={() => setActiveFilter("image")}
              className={`px-4 py-1.5 rounded-full text-xs font-black transition-all ${
                activeFilter === "image"
                  ? "bg-white text-stone-950 shadow-sm"
                  : "text-stone-600 hover:text-stone-950"
              }`}
            >
              Images ({prompts.filter((p: any) => p.type === "image").length})
            </button>
          </div>

          <div className="text-xs text-stone-600 font-medium hidden sm:block">
            Tag <span className="text-purple-700 font-bold">Keep</span> on prompts to improve future RAG memory
          </div>
        </div>
      )}

      {/* Prompts Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredPrompts.map((prompt: any) => {
          const isKept = prompt.is_kept;
          const isReelOrShort = prompt.type === "reel" || prompt.type === "short";
          const assets = prompt.assets || [];

          return (
            <div
              key={prompt.id}
              className={`liquid-glass-card p-6 flex flex-col justify-between ${
                isKept ? "ring-2 ring-teal-400/80 shadow-[0_0_35px_rgba(45,212,191,0.25)]" : ""
              }`}
            >
              <div className="space-y-4">
                {/* Card Top: Type & Keep / Copy Actions */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full liquid-pill text-stone-800 text-[10px] font-black uppercase tracking-wider">
                      {prompt.type === "reel" ? "Reel Script" : prompt.type === "short" ? "YouTube Short" : "Studio Image"}
                    </span>
                    {prompt.estimated_duration_seconds && (
                      <span className="text-[11px] text-stone-600 font-bold">
                        {prompt.estimated_duration_seconds}s
                      </span>
                    )}
                    {prompt.aspect_ratio && (
                      <span className="text-[11px] text-stone-600 font-bold">
                        {prompt.aspect_ratio}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Copy Button */}
                    <button
                      onClick={() =>
                        handleCopy(
                          prompt.id,
                          `${prompt.title}\n\n${prompt.prompt_text}\n\nDescription:\n${prompt.description || ""}`
                        )
                      }
                      title="Copy script / prompt"
                      className="w-8 h-8 liquid-glass-orb flex items-center justify-center text-stone-600 hover:text-stone-900 transition-colors"
                    >
                      {copiedId === prompt.id ? (
                        <Check className="w-3.5 h-3.5 text-teal-600 font-bold" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Keep / Discard Button */}
                    <button
                      onClick={() => handleToggleKeep(prompt.id, isKept)}
                      disabled={keepingId === prompt.id}
                      title={isKept ? "Kept in style library" : "Mark as kept"}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black transition-all ${
                        isKept
                          ? "liquid-gel-teal text-white"
                          : "liquid-pill text-stone-700 hover:scale-105"
                      }`}
                    >
                      <ThumbsUp className={`w-3 h-3 ${isKept ? "fill-white" : ""}`} />
                      <span>{isKept ? "Kept" : "Keep"}</span>
                    </button>
                  </div>
                </div>

                {/* Prompt Title */}
                <h3 className="text-lg font-black text-stone-950 leading-snug">
                  {prompt.title}
                </h3>

                {/* Visual / Prompt Text Content */}
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-stone-500 mb-1">
                    {isReelOrShort ? "Scene & Visual Direction" : "Diffusion Image Prompt"}
                  </h4>
                  <div className="liquid-glass p-4 rounded-2xl text-xs text-stone-800 leading-relaxed font-medium">
                    {prompt.prompt_text}
                  </div>
                </div>

                {/* Description / Caption */}
                {prompt.description && (
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-stone-500 mb-1">
                      Caption & Copy
                    </h4>
                    <div className="liquid-pill p-3 rounded-2xl text-[11px] text-stone-700 font-medium">
                      {prompt.description}
                    </div>
                  </div>
                )}

                {/* Generated Image Asset View (if type = image) */}
                {prompt.type === "image" && assets.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-stone-500">
                      Generated High-Resolution Visual
                    </h4>
                    {assets.map((asset: any) => (
                      <div
                        key={asset.id}
                        className="relative rounded-2xl overflow-hidden border-2 border-white shadow-md group"
                      >
                        <img
                          src={asset.url}
                          alt={prompt.title}
                          className="w-full h-auto object-cover max-h-[300px] rounded-2xl"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                          <a
                            href={asset.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 liquid-pill text-stone-950 text-xs font-bold shadow-md inline-flex items-center gap-1 hover:scale-105 transition-transform"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            View Full Size
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom tag info */}
              <div className="pt-4 mt-4 border-t border-white/60 flex items-center justify-between text-[11px] text-stone-500 font-semibold">
                <span>Tone: {prompt.tone || request?.tone || "Standard"}</span>
                {isKept && (
                  <span className="text-teal-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                    Eligible for RAG Memory
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
