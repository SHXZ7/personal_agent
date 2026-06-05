export default function Badge({ children, variant = "default", className = "" }) {
  const baseStyles = "inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-mono border";
  
  const variants = {
    default: "bg-zinc-900/40 border-white/5 text-zinc-400",
    accent: "bg-accent-dim/30 border-accent/20 text-[#818cf8]",
    success: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  };

  return (
    <span className={`${baseStyles} ${variants[variant] || variants.default} ${className}`}>
      {children}
    </span>
  );
}
