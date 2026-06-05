import Link from "next/link";
import GlowDot from "../ui/GlowDot";

export default function Navbar() {
  return (
    <nav className="w-full border-b border-white/5 bg-[#080810]/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <span className="font-display text-lg font-normal tracking-tight text-white">
            MOHAMMED SHAAZ<span className="text-[#6366F1] font-sans font-bold">®</span>
          </span>
          <div className="flex items-center gap-1.5 rounded-full bg-[#6366F1]/10 px-2 py-0.5 text-[10px] font-mono text-[#818cf8]">
            <GlowDot />
            System Live
          </div>
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-xs font-semibold tracking-tight text-zinc-400 hover:text-white transition-colors"
          >
            Home
          </Link>
          <Link
            href="/chat"
            className="text-xs font-semibold tracking-tight text-zinc-400 hover:text-white transition-colors"
          >
            Talk to AI
          </Link>
          <Link
            href="/voice"
            className="text-xs font-semibold tracking-tight text-zinc-400 hover:text-white transition-colors"
          >
            Talk to Voice
          </Link>
          <Link
            href="/book"
            className="text-xs font-semibold tracking-tight text-[#818cf8] hover:text-[#a5b4fc] transition-colors"
          >
            Book Call ↗
          </Link>
        </div>
      </div>
    </nav>
  );
}
