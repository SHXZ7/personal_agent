export default function ProjectCard({ name, onAskAI }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 bg-[#0f0f1a]/80 border border-white/5 rounded-sm hover:border-white/10 transition-all select-none">
      <span className="font-mono text-xs text-zinc-300 font-semibold tracking-tight">
        {name}
      </span>
      <button
        onClick={() => onAskAI(name)}
        className="text-[10px] font-mono text-[#818cf8] hover:text-[#a5b4fc] transition-colors focus:outline-none cursor-pointer"
      >
        Ask AI ↗
      </button>
    </div>
  );
}
