import NoiseOverlay from "./NoiseOverlay";
import Navbar from "./Navbar";

export default function PageWrapper({ children, showNavbar = true, fixedHeight = false }) {
  return (
    <div className={`flex flex-col bg-[#080810] text-[#f0f0ff] relative ${fixedHeight ? "h-screen overflow-hidden" : "min-h-screen"}`}>
      {/* 3px System Bar at very top */}
      <div className="w-full bg-[#0d0d1f] border-b border-white/5 text-zinc-500 font-mono text-[10px] flex justify-between px-6 py-1.5 select-none z-50">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Voice Agent: Active</span>
          <span className="text-zinc-700">|</span>
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Chat: Online</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Latency: ~1.4s avg</span>
          <span className="text-zinc-700">|</span>
          <span>Powered by Llama 3.3 + RAG</span>
        </div>
      </div>

      {/* Navbar */}
      {showNavbar && <Navbar />}

      {/* Main page content container */}
      <div className={`flex-1 flex flex-col relative z-10 ${fixedHeight ? "min-h-0 overflow-hidden" : ""}`}>
        {children}
      </div>

      {/* Decorative radial glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-indigo-500/5 rounded-full blur-[90px] pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[450px] h-[450px] bg-violet-600/5 rounded-full blur-[110px] pointer-events-none z-0" />

      {/* Subtly textured noise overlay */}
      <NoiseOverlay />
    </div>
  );
}
