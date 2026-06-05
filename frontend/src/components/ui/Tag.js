export default function Tag({ children, className = "" }) {
  return (
    <span
      className={`font-mono text-[11px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-sm select-none transition-colors duration-150 hover:bg-indigo-500/15 ${className}`}
    >
      {children}
    </span>
  );
}
