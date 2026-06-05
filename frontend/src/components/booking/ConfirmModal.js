"use client";

import { useState } from "react";

export default function ConfirmModal({ isOpen, onClose, date, slot, onConfirm }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setSubmitting(true);
    try {
      await onConfirm({ name, email });
    } catch (err) {
      console.error("Booking error in modal:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0f0f1a] border border-white/10 p-6 rounded-sm w-full max-w-md animate-fadeIn">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="font-display text-lg text-white mb-1">Confirm Schedule</h3>
            <p className="font-mono text-[10px] text-zinc-500">
              June {date}, 2026 at {slot} IST
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-white font-mono text-xs cursor-pointer focus:outline-none"
          >
            [ESC]
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
              Your Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Rivera"
              className="w-full bg-[#080810] border border-white/5 rounded-sm px-3 py-2.5 text-xs text-[#f0f0ff] focus:outline-none focus:ring-1 focus:ring-[#6366F1] font-mono"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. alex@company.com"
              className="w-full bg-[#080810] border border-white/5 rounded-sm px-3 py-2.5 text-xs text-[#f0f0ff] focus:outline-none focus:ring-1 focus:ring-[#6366F1] font-mono"
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-white/5 bg-[#16162a] text-zinc-300 rounded-sm py-3 text-xs font-semibold hover:border-white/10 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-[#6366F1] text-white rounded-sm py-3 text-xs font-semibold hover:bg-[#4f46e5] disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "Booking..." : "Confirm Invitation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
