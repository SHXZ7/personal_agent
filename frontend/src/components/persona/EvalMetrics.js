export default function EvalMetrics() {
  const metrics = [
    { value: "< 1.4s", label: "avg latency" },
    { value: "98.5%", label: "task completion" },
    { value: "< 2.0%", label: "hallucination rate" }
  ];

  return (
    <div className="w-full border-t border-b border-white/5 bg-[#0f0f1a]/30 py-4 select-none stagger-2">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4 sm:px-0">
        {metrics.map((m, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="font-mono text-xs text-indigo-400 font-semibold">
              {m.value}
            </span>
            <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider">
              {m.label}
            </span>
            {idx < metrics.length - 1 && (
              <span className="hidden sm:inline font-mono text-zinc-700 ml-8">·</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
