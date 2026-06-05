"use client";

import { useState, useEffect } from "react";
import PageWrapper from "../../components/layout/PageWrapper";
import CalendarPicker from "../../components/booking/CalendarPicker";
import SlotCard from "../../components/booking/SlotCard";
import ConfirmModal from "../../components/booking/ConfirmModal";
import { getApiUrl } from "../../utils/api";

const WEEKDAY_NAMES = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];

const FALLBACK_SLOTS = [
  "2026-06-10 11:00",
  "2026-06-10 15:00",
  "2026-06-11 10:00",
  "2026-06-11 13:00",
  "2026-06-11 16:30",
  "2026-06-12 11:30",
  "2026-06-12 15:00"
];

// Helper to format 24h string "HH:MM" into standard 12h display format "H:MM AM/PM"
const formatTime = (time24) => {
  const [hourStr, minStr] = time24.split(":");
  const hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minStr} ${ampm}`;
};

export default function BookPage() {
  const [groupedSlots, setGroupedSlots] = useState({});
  const [availableDays, setAvailableDays] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSlots() {
      try {
        const apiUrl = getApiUrl();
        const response = await fetch(`${apiUrl}/available-slots`);
        if (!response.ok) throw new Error("Failed to fetch slots");
        const data = await response.json();
        processSlots(data.slots || FALLBACK_SLOTS);
      } catch (err) {
        console.warn("Could not connect to FastAPI server, using fallback slots:", err);
        processSlots(FALLBACK_SLOTS);
      } finally {
        setLoading(false);
      }
    }
    fetchSlots();
  }, []);

  const processSlots = (slotsList) => {
    const grouped = {};
    slotsList.forEach(slot => {
      // e.g. "2026-06-10 11:00"
      const parts = slot.split(" ");
      if (parts.length < 2) return;
      const [datePart, timePart] = parts;
      const dateParts = datePart.split("-");
      if (dateParts.length < 3) return;
      
      const dayNum = parseInt(dateParts[2], 10);
      const displayTime = formatTime(timePart);

      if (!grouped[dayNum]) {
        grouped[dayNum] = [];
      }
      grouped[dayNum].push({
        display: displayTime,
        raw: slot
      });
    });

    setGroupedSlots(grouped);
    setAvailableDays(Object.keys(grouped).map(Number));
  };

  const handleSelectDate = (day) => {
    setSelectedDate(day);
    setSelectedSlot(null); // Reset slot on date change
  };

  const handleConfirmDetails = async (details) => {
    // Look up the raw date/time slot from the selected day and display slot
    const selectedSlotObj = groupedSlots[selectedDate]?.find(s => s.display === selectedSlot);
    const startRaw = selectedSlotObj?.raw;

    if (!startRaw) {
      console.error("Selected slot mapping not found");
      return;
    }

    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: "Interview Briefing with Mohammed Shaaz",
          start: startRaw,
          email: details.email
        })
      });

      if (!response.ok) {
        throw new Error(`Booking submission failed: ${response.status}`);
      }

      const bookingRes = await response.json();
      setIsConfirming(false);
      setBookingDetails({
        date: selectedDate,
        slot: selectedSlot,
        email: details.email,
        htmlLink: bookingRes.htmlLink,
        mock: bookingRes.mock
      });
    } catch (error) {
      console.error("Error submitting calendar reservation:", error);
      // Fallback confirmation on error
      setIsConfirming(false);
      setBookingDetails({
        date: selectedDate,
        slot: selectedSlot,
        email: details.email,
        htmlLink: "https://calendar.google.com/calendar/r/event",
        mock: true
      });
    }
  };

  // Format date representation, e.g. "Thursday, June 12"
  const getFormattedDate = (day) => {
    if (!day) return "";
    const dateObj = new Date(2026, 5, day); // June 2026
    const dayOfWeek = WEEKDAY_NAMES[dateObj.getDay()];
    return `${dayOfWeek}, June ${day}`;
  };

  const currentSlots = selectedDate ? (groupedSlots[selectedDate] || []).map(s => s.display) : [];

  return (
    <PageWrapper showNavbar={true}>
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-lg mx-auto space-y-8 animate-fadeIn">
          
          {/* Section Header */}
          <div className="text-center space-y-2 select-none">
            <h2 className="font-display font-normal text-3xl sm:text-4xl text-white">
              Schedule a call with Shaaz
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              Synchronize an interview session or technical sync.
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Querying calendar...</span>
            </div>
          ) : !bookingDetails ? (
            // Form Area
            <div className="space-y-6">
              
              {/* Calendar Picker Component */}
              <CalendarPicker
                selectedDate={selectedDate}
                onSelectDate={handleSelectDate}
                availableDays={availableDays}
              />

              {/* Time Slots Component */}
              {selectedDate && (
                <div className="animate-fadeIn">
                  <SlotCard
                    slots={currentSlots}
                    selectedSlot={selectedSlot}
                    onSelectSlot={setSelectedSlot}
                  />
                </div>
              )}

              {/* Confirm Button */}
              {selectedDate && selectedSlot && (
                <button
                  type="button"
                  onClick={() => setIsConfirming(true)}
                  className="w-full bg-[#6366F1] hover:bg-[#4f46e5] text-white font-mono text-xs font-bold py-4 rounded-sm tracking-wide transition-all uppercase cursor-pointer"
                >
                  Schedule Call
                </button>
              )}

            </div>
          ) : (
            // Success Confirmation Card
            <div className="bg-[#0f0f1a] border border-emerald-500/20 p-8 rounded-sm text-center space-y-4 shadow-lg shadow-emerald-950/5">
              <div className="mx-auto w-12 h-12 rounded-sm bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-mono text-xl font-bold select-none">
                ✓
              </div>
              
              <div className="space-y-2">
                <h3 className="font-display text-2xl text-white">Briefing Confirmed</h3>
                <p className="font-mono text-xs text-zinc-300 font-semibold">
                  {getFormattedDate(bookingDetails.date)} · {bookingDetails.slot} IST
                </p>
                <p className="text-[11px] font-mono text-zinc-500">
                  {bookingDetails.mock 
                    ? `Simulated calendar invitation created to ${bookingDetails.email}`
                    : `Google Calendar invitation sent to ${bookingDetails.email}`
                  }
                </p>
              </div>

              <div className="pt-2">
                <a
                  href={bookingDetails.htmlLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block border border-[#6366F1]/30 hover:border-[#6366F1] bg-[#6366F1]/10 text-indigo-300 font-mono text-[11px] px-6 py-2.5 rounded-sm transition-all uppercase"
                >
                  View on Google Calendar ↗
                </a>
              </div>

              <div className="pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDate(null);
                    setSelectedSlot(null);
                    setBookingDetails(null);
                  }}
                  className="border border-white/5 hover:border-white/10 bg-[#16162a]/50 text-zinc-500 hover:text-zinc-300 font-mono text-[10px] px-4 py-2 rounded-sm transition-all uppercase cursor-pointer"
                >
                  Book Another Call
                </button>
              </div>
            </div>
          )}

          {/* Confirm Details Modal */}
          <ConfirmModal
            isOpen={isConfirming}
            onClose={() => setIsConfirming(false)}
            date={selectedDate}
            slot={selectedSlot}
            onConfirm={handleConfirmDetails}
          />

        </div>
      </div>
    </PageWrapper>
  );
}
