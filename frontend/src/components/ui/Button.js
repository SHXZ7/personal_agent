import Link from "next/link";

export default function Button({
  children,
  onClick,
  href,
  variant = "primary",
  disabled = false,
  className = "",
  type = "button"
}) {
  const baseStyles = "inline-flex items-center justify-center rounded-sm font-semibold text-xs tracking-tight transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-[#6366F1] hover:bg-[#4f46e5] text-white px-5 py-3 shadow-md shadow-indigo-950/20",
    secondary: "border border-white/10 hover:border-white/20 hover:bg-white/5 text-zinc-300 px-5 py-3",
    ghost: "text-zinc-400 hover:text-white px-3 py-2",
  };

  const styles = `${baseStyles} ${variants[variant] || variants.primary} ${className}`;

  if (href) {
    return (
      <Link href={href} className={styles}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={styles}
    >
      {children}
    </button>
  );
}
