export default function TypingIndicator() {
  return (
    <div className="flex w-full flex-col gap-1 items-start animate-fadeIn">
      <span className="text-[10px] font-semibold text-zinc-600 px-1 uppercase tracking-wider font-mono">
        AI Representative
      </span>
      <div className="bg-[#16162a]/50 border border-white/5 text-zinc-400 rounded-sm rounded-tl-none px-4 py-3 text-sm flex items-center gap-1.5 backdrop-blur-md">
        <span className="h-1.5 w-1.5 rounded-full bg-[#6366F1] animate-dot-wave [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-[#6366F1] animate-dot-wave [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-[#6366F1] animate-dot-wave" />
      </div>
    </div>
  );
}
