"use client";

import Link from "next/link";
import GlowDot from "../ui/GlowDot";
import TypingText from "../ui/TypingText";

export default function HeroSection() {
  return (
    <section className="flex flex-col items-start text-left max-w-4xl mx-auto w-full select-none stagger-1">
      {/* Live Badge */}
      <div className="flex items-center gap-1.5 rounded-sm border border-emerald-500/10 bg-emerald-500/5 px-2.5 py-1 text-[11px] font-mono text-emerald-400 mb-6 uppercase tracking-wider">
        <GlowDot />
        <span>System Live</span>
      </div>

      {/* Name */}
      <h1 className="font-display font-normal text-[56px] sm:text-[72px] md:text-[96px] lg:text-[110px] leading-[0.95] text-white tracking-tight mb-4">
        MOHAMMED<br />
        SHAAZ<span className="text-[#6366F1] font-sans font-bold">.</span>
      </h1>

      {/* Title Tagline */}
      <p className="font-mono text-xs md:text-sm text-zinc-400 uppercase tracking-widest mb-8">
        <TypingText text="AI / Full-Stack Engineer" speed={80} delay={400} />
      </p>

      {/* Divider */}
      <div className="w-full border-t border-white/5 mb-8" />

      {/* CTA Buttons */}
      <div className="flex flex-wrap gap-4 w-full sm:w-auto">
        <Link
          href="/chat"
          className="flex-1 sm:flex-initial text-center bg-[#6366F1] hover:bg-[#4f46e5] text-white font-mono text-xs px-5 py-4 rounded-sm tracking-wide transition-all border border-[#6366F1] hover:border-[#4f46e5]"
        >
          Talk to my AI ↗
        </Link>
        <Link
          href="/voice"
          className="flex-1 sm:flex-initial text-center border border-[#6366F1]/35 hover:border-[#6366F1] bg-[#0f0f1a] hover:bg-[#6366F1]/10 text-[#818cf8] hover:text-white font-mono text-xs px-5 py-4 rounded-sm tracking-wide transition-all"
        >
          Talk to Voice Agent ↗
        </Link>
        <Link
          href="/book"
          className="flex-1 sm:flex-initial text-center border border-white/5 hover:border-white/10 bg-[#0f0f1a] hover:bg-[#16162a] text-zinc-300 font-mono text-xs px-5 py-4 rounded-sm tracking-wide transition-all"
        >
          Book a call ↗
        </Link>
      </div>
    </section>
  );
}
