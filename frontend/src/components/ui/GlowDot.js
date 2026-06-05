export default function GlowDot({ className = "" }) {
  return (
    <span className={`relative flex h-2.5 w-2.5 ${className}`}>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
    </span>
  );
}
