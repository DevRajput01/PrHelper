"use client";

import Image from "next/image";
import { Sparkles } from "lucide-react";

export function BrandLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-16 h-16",
  }[size];

  return (
    <div className={`relative ${sizeClasses} rounded-full p-0.5 bg-white shadow-[0_6px_16px_rgba(2,132,199,0.25)] border-2 border-white flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform shrink-0`}>
      <img
        src="/logo.png"
        alt="PrHelper Logo"
        className="w-full h-full object-cover rounded-full"
      />
    </div>
  );
}
