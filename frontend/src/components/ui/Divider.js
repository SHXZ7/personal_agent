export default function Divider({ label, className = "" }) {
  return (
    <div className={`relative flex items-center ${className}`}>
      <div className="flex-grow border-t border-white/5"></div>
      {label && (
        <span className="flex-shrink mx-3 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
          {label}
        </span>
      )}
      <div className="flex-grow border-t border-white/5"></div>
    </div>
  );
}
