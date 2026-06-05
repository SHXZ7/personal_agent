export default function InputBar({ input, setInput, onSubmit, isLoading }) {
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSubmit();
  };

  return (
    <form
      onSubmit={handleFormSubmit}
      className="flex gap-2 p-4 bg-[#0f0f1a] border-t border-white/5"
    >
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={isLoading}
        placeholder={
          isLoading
            ? "Representative is formulating answer..."
            : "Query projects, resumes, or commit history..."
        }
        className="flex-1 bg-[#080810] border border-white/10 rounded-sm px-4 py-3 text-sm text-[#f0f0ff] placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#6366F1] focus:border-[#6366F1] transition-all disabled:opacity-50 font-mono text-xs"
      />
      <button
        type="submit"
        disabled={isLoading || !input.trim()}
        className="bg-[#6366F1] hover:bg-[#4f46e5] text-white rounded-sm px-5 py-3 text-xs font-semibold tracking-tight transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        <span>Send</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className="w-3.5 h-3.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
          />
        </svg>
      </button>
    </form>
  );
}
