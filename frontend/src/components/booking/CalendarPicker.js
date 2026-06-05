"use client";

import { useState } from "react";

export default function CalendarPicker({ selectedDate, onSelectDate, availableDays = [], monthName = "June 2026" }) {
  const year = 2026;
  const month = 5; // June (0-indexed in JS Dates)
  
  const daysInMonth = 30;
  const startDayOfWeek = 1; // Monday

  const isDateAvailable = (day) => {
    return availableDays.includes(day);
  };

  const days = [];
  // Add empty spaces for padding before the 1st of the month
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(null);
  }
  // Add days of the month
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(d);
  }

  const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <div className="w-full max-w-sm mx-auto bg-[#0f0f1a] border border-white/5 p-5 rounded-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-mono text-xs uppercase tracking-wider text-zinc-400">
          {monthName}
        </h3>
        <span className="text-[10px] font-mono text-zinc-500">UTC+5:30</span>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-2 mb-3 text-center">
        {weekdays.map((w, idx) => (
          <span key={idx} className="text-[10px] font-mono text-zinc-600 font-bold uppercase">
            {w}
          </span>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2 text-center">
        {days.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="w-10 h-10" />;
          }

          const available = isDateAvailable(day);
          const isSelected = selectedDate === day;

          return (
            <button
              key={`day-${day}`}
              type="button"
              disabled={!available}
              onClick={() => onSelectDate(day)}
              className={`w-10 h-10 font-mono text-xs flex items-center justify-center rounded-sm transition-all focus:outline-none ${
                isSelected
                  ? "bg-[#6366F1] text-white font-bold"
                  : available
                  ? "bg-[#16162a] text-zinc-300 hover:bg-[#6366F1]/20 hover:text-white cursor-pointer"
                  : "text-zinc-700 opacity-30 cursor-not-allowed pointer-events-none"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
