import SourceCitation from "./SourceCitation";

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex w-full flex-col gap-1 ${isUser ? "items-end" : "items-start"} animate-fadeIn`}>
      <span className="text-[10px] font-semibold text-zinc-500 px-1 uppercase tracking-wider font-mono">
        {isUser ? "You" : "AI Representative"}
      </span>
      <div
        className={`max-w-[80%] rounded-sm px-4 py-3 text-[14px] leading-relaxed shadow-sm transition-all duration-300 ${
          isUser
            ? "bg-[#6366F1]/15 border border-[#6366F1]/20 text-[#f0f0ff] rounded-tr-none"
            : "bg-[#16162a] border border-white/5 text-[#f0f0ff] border-l-2 border-l-[#6366F1] rounded-tl-none"
        }`}
      >
        <div className="whitespace-pre-line">{message.text}</div>
        {!isUser && message.sources && (
          <SourceCitation sources={message.sources} />
        )}
      </div>
    </div>
  );
}
