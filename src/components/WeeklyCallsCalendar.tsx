"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

// One-off dates are listed here; recurring calls are added in callsForDate.
const calls: Record<string, { title: string; time: string; href?: string }[]> = {
  "2026-10-25": [
    { title: "Community Call", time: "4:00 PM EST" },
    { title: "Delphine - Forex", time: "11:00 PM EST", href: "/members/live-calls" },
  ],
  "2026-10-26": [{ title: "Delphine - Forex", time: "11:00 PM EST", href: "/members/live-calls" }],
  "2026-10-28": [{ title: "Delphine - Forex", time: "11:00 PM EST", href: "/members/live-calls" }],
};

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const fullDateFormat = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });

function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function startOfWeek(date: string) {
  return addDays(date, -new Date(`${date}T00:00:00Z`).getUTCDay());
}

function callsForDate(date: string) {
  const scheduledCalls = [...(calls[date] ?? [])];
  const firstFitnessCall = Date.parse("2026-10-29T00:00:00Z");
  const elapsedDays = (Date.parse(`${date}T00:00:00Z`) - firstFitnessCall) / 86_400_000;
  if (elapsedDays >= 0 && elapsedDays % 14 === 0) {
    scheduledCalls.push({ title: "PJ LaBeach | Fitness", time: "8:00 PM EST" });
  }
  return scheduledCalls;
}

export function WeeklyCallsCalendar({ today }: { today: string }) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today));
  const [selectedDate, setSelectedDate] = useState(today);
  const days = dayNames.map((name, index) => ({ name, date: addDays(weekStart, index) }));
  const selectedCalls = callsForDate(selectedDate);

  function moveWeek(offset: number) {
    const next = addDays(weekStart, offset * 7);
    setWeekStart(next);
    setSelectedDate(next);
  }

  return (
    <section id="weekly-calls" aria-label="Weekly calls calendar" className="mt-6 max-w-[640px] scroll-mt-24 rounded-card border border-silver/10 bg-silver/[0.035] p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-silver">
          <CalendarDays size={16} className="text-crest-gold-text" /> Weekly calls
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => moveWeek(-1)} aria-label="Previous week" className="rounded-full border border-silver/10 p-1.5 text-silver/70 transition hover:border-chrome/50 hover:text-silver"><ChevronLeft size={16} /></button>
          <span className="min-w-[132px] text-center text-xs font-medium text-silver/75" aria-live="polite">
            {dateFormat.format(new Date(`${weekStart}T00:00:00Z`))} – {dateFormat.format(new Date(`${addDays(weekStart, 6)}T00:00:00Z`))}
          </span>
          <button type="button" onClick={() => moveWeek(1)} aria-label="Next week" className="rounded-full border border-silver/10 p-1.5 text-silver/70 transition hover:border-chrome/50 hover:text-silver"><ChevronRight size={16} /></button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1" aria-label="Select a day">
        {days.map(({ name, date }) => (
          <button key={date} type="button" onClick={() => setSelectedDate(date)} aria-pressed={selectedDate === date}
            aria-label={`${fullDateFormat.format(new Date(`${date}T00:00:00Z`))}${callsForDate(date).length ? ", call scheduled" : ""}`}
            className={`flex min-h-[54px] flex-col items-center justify-center gap-0.5 rounded-xl border px-0.5 py-1.5 transition ${selectedDate === date ? "border-chrome/45 bg-chrome/10 text-silver" : "border-transparent text-silver/70 hover:border-silver/15 hover:bg-silver/5"}`}>
            <span className="text-[10px] uppercase tracking-wide sm:text-xs">{name}</span>
            <span className="text-sm font-semibold">{Number(date.slice(-2))}</span>
            <span className={`h-1 w-1 rounded-full ${callsForDate(date).length ? "bg-crest-gold-text" : "bg-transparent"}`} aria-hidden="true" />
          </button>
        ))}
      </div>

      <div className="mt-3 border-t border-silver/10 pt-3" aria-live="polite">
        <p className="text-xs font-medium text-silver/70">{fullDateFormat.format(new Date(`${selectedDate}T00:00:00Z`))}</p>
        {selectedCalls.length ? selectedCalls.map((call) => (
          <div key={`${call.title}-${call.time}`} className="mt-1 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-silver">{call.title} <span className="font-normal text-silver/60">· {call.time}</span></p>
            {call.href ? <Link href={call.href} className="text-xs font-medium text-chrome hover:underline">Go to live calls →</Link> : null}
          </div>
        )) : <p className="mt-2 text-sm text-silver/70">No calls listed for this day.</p>}
      </div>
      {weekStart !== startOfWeek(today) ? (
        <button type="button" onClick={() => { setWeekStart(startOfWeek(today)); setSelectedDate(today); }} className="mt-4 text-xs text-silver/70 underline underline-offset-4 hover:text-silver">Back to this week</button>
      ) : null}
    </section>
  );
}
