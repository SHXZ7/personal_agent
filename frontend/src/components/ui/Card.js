export default function Card({ children, className = "" }) {
  return (
    <div className={`bg-[#0f0f1a] border border-white/5 rounded-sm p-5 shadow-lg shadow-black/25 ${className}`}>
      {children}
    </div>
  );
}
