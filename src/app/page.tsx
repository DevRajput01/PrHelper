"use client";

import Link from "next/link";
import { Sparkles, Video, Film, Image as ImageIcon, ArrowRight, Play, CheckCircle2 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center pt-8 pb-16 px-4">
      {/* 3D Clay Hero Card */}
      <section className="w-full max-w-4xl mx-auto text-center pt-6 pb-12">
        
        <div className="clay-card p-8 sm:p-12 mb-8">
          {/* Mascot Header */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 rounded-full p-1 bg-white shadow-lg border-2 border-white overflow-hidden">
              <img src="/logo.png" alt="PrHelper Studio" className="w-full h-full object-cover rounded-full" />
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 clay-inset-input text-slate-800 text-xs font-bold mb-5 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-sky-500" />
            <span>3D AI Marketing Generator & Studio</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 leading-[1.1] mb-5">
            Create marketing scripts & studio visuals in 1 click.
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto mb-8 font-medium leading-relaxed">
            Enter your business name, choose Reel, Short, or AI Photo, and get high-converting social media content tailored to your industry.
          </p>

          {/* 3 3D Clay Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8 text-left">
            <Link
              href="/dashboard"
              className="clay-tile-sky p-5 clay-card-hover block group"
            >
              <div className="w-10 h-10 rounded-full bg-white/90 shadow-sm flex items-center justify-center mb-3 text-sky-600">
                <Video className="w-5 h-5" />
              </div>
              <h3 className="font-black text-sm text-slate-900 group-hover:text-sky-700">
                Instagram Reels
              </h3>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                30s hook, scene direction, and CTA script.
              </p>
            </Link>

            <Link
              href="/dashboard"
              className="clay-tile-peach p-5 clay-card-hover block group"
            >
              <div className="w-10 h-10 rounded-full bg-white/90 shadow-sm flex items-center justify-center mb-3 text-orange-600">
                <Film className="w-5 h-5" />
              </div>
              <h3 className="font-black text-sm text-slate-900 group-hover:text-orange-700">
                YouTube Shorts
              </h3>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                Numbered fast-paced scene beats.
              </p>
            </Link>

            <Link
              href="/dashboard"
              className="clay-tile-mint p-5 clay-card-hover block group"
            >
              <div className="w-10 h-10 rounded-full bg-white/90 shadow-sm flex items-center justify-center mb-3 text-emerald-600">
                <ImageIcon className="w-5 h-5" />
              </div>
              <h3 className="font-black text-sm text-slate-900 group-hover:text-emerald-700">
                Studio AI Photos
              </h3>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                Rendered commercial marketing visuals.
              </p>
            </Link>
          </div>

          {/* Primary CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2.5 px-8 py-4 clay-btn-sky text-white font-bold text-sm shadow-lg hover:scale-105 transition-transform"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Launch Marketing Studio</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 px-6 py-4 clay-btn-white text-slate-800 font-bold text-sm hover:scale-105 transition-transform"
            >
              <span>Create Free Account</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
