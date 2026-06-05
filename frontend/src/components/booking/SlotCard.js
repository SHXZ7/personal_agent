"use client";

export default function SlotCard({ slots = [], selectedSlot, onSelectSlot }) {
  if (slots.length === 0) {
    return (
      <div className="text-center py-4 text-xs font-mono text-zinc-500">
        Select a date to view available time slots.
      </div>
    );
  }

  return (
    <div className="w-full">
      <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 mb-3">
        Available Times (IST)
      </p>
      
      {/* Scrollable Container */}
      <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
        {slots.map((slot, idx) => {
          const isSelected = selectedSlot === slot;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectSlot(slot)}
              className={`flex-shrink-0 px-4 py-2 text-xs font-mono rounded-sm transition-all focus:outline-none cursor-pointer ${
                isSelected
                  ? "bg-[#6366F1] text-white border border-[#6366F1] font-bold"
                  : "bg-[#0f0f1a] text-zinc-300 border border-white/5 hover:border-[#6366F1]/30 hover:bg-[#16162a]"
              }`}
            >
              {slot}
            </button>
          );
        })}
      </div>
    </div>
  );
}
