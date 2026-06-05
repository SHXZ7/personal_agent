export default function SourceCitation({ sources = [] }) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2 select-none">
      {sources.map((source, idx) => (
        <span
          key={idx}
          className="inline-flex items-center rounded-sm border border-white/5 bg-zinc-900/40 px-2 py-0.5 text-[10px] font-mono text-zinc-500 hover:text-zinc-400 hover:border-white/10 transition-colors"
        >
          [{source}]
        </span>
      ))}
    </div>
  );
}
