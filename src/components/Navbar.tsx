"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { LogIn, LogOut, UserPlus } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { getUserAvatar } from "@/lib/avatar";

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isAuthPage = pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");
  if (isAuthPage) return null;

  const userAvatar = getUserAvatar(session?.user?.name || session?.user?.email || "Guest");

  return (
    <header className="sticky top-3 z-50 w-full max-w-[1340px] mx-auto px-4">
      <div className="clay-card px-6 h-16 flex items-center justify-between">
        {/* Brand Logo with 3D Studio Icon */}
        <Link href="/" className="flex items-center gap-3 group">
          <BrandLogo size="md" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-slate-900 font-sans">
                PrHelper
              </span>
              <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full clay-tile-sky text-sky-800 text-xs">
                3D Studio
              </span>
            </div>
          </div>
        </Link>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center clay-inset-input p-1 gap-1">
          <Link
            href="/dashboard"
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              pathname === "/dashboard"
                ? "clay-btn-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard/library"
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              pathname === "/dashboard/library"
                ? "clay-btn-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Saved Library
          </Link>
        </nav>

        {/* Action buttons & User Session */}
        <div className="flex items-center gap-2.5">
          {session?.user ? (
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2 pl-2">
                <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-sm bg-sky-50">
                  <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <span className="text-xs font-black text-slate-800 hidden lg:inline-block max-w-[130px] truncate">
                  {session.user.name || session.user.email}
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  title="Sign out"
                  className="p-1.5 text-slate-500 hover:text-red-600 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/sign-in"
                className="inline-flex items-center gap-1.5 px-4 py-2 clay-btn-white text-slate-800 text-xs font-bold transition-all hover:scale-105"
              >
                <LogIn className="w-3.5 h-3.5 text-slate-600" />
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full clay-btn-sky text-white text-xs font-bold transition-all shadow-sm hover:scale-105"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
