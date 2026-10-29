"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, callsForDate, educators, startOfWeek, type EducatorId } from "@/lib/call-schedule";

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const dayFormat = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" });

const educatorColors: Record<EducatorId, string> = {
  pj: "border-[#d7c4e6] bg-[#f2eaf8] text-[#4c2f6f]",
  delphine: "border-[#cfc9ed] bg-[#eceaf8] text-[#403b80]",
  beava: "border-[#e7c8df] bg-[#faedf6] text-[#7d376c]",
};

function dateLabel(date: string): string {
  return dateFormat.format(new Date(`${date}T00:00:00Z`));
}

export function EducatorSchedule({ today }: { today: string }) {
  const currentWeek = startOfWeek(today);
  const [weekStart, setWeekStart] = useState(currentWeek);
  const [educatorId, setEducatorId] = useState<EducatorId | "all">("all");
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const calls = days.flatMap((date) =>
    callsForDate(date)
      .filter((call) => call.educatorId && (educatorId === "all" || call.educatorId === educatorId))
      .map((call) => ({ ...call, date })),
  );
  const hours = Array.from(new Set(calls.map((call) => call.hour))).sort((a, b) => a - b);

  return (
    <section id="educator-schedule" aria-labelledby="educator-schedule-title" className="mt-8 scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-accent">Learn together</p>
          <h1 id="educator-schedule-title" className="mt-2 text-[clamp(2rem,4vw,3rem)] font-semibold leading-tight tracking-[-0.03em] text-silver">Educator schedule</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-silver/70">Choose an educator or scheduled call to open the shared live room. Times are shown in EST.</p>
        </div>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-silver/70">
          Educator
          <select value={educatorId} onChange={(event) => setEducatorId(event.target.value as EducatorId | "all")}
            className="min-h-11 min-w-48 rounded-xl border border-silver/15 bg-white px-4 text-sm text-silver outline-none focus:border-accent">
            <option value="all">All educators</option>
            {educators.map((educator) => <option key={educator.id} value={educator.id}>{educator.name} · {educator.subject}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2" aria-label="Choose week">
          <button type="button" onClick={() => setWeekStart(currentWeek)} aria-pressed={weekStart === currentWeek}
            className={`rounded-pill px-4 py-2 text-sm font-medium transition ${weekStart === currentWeek ? "bg-chrome text-ink" : "text-silver/70 hover:bg-silver/5"}`}>Current week</button>
          <button type="button" onClick={() => setWeekStart(addDays(currentWeek, 7))} aria-pressed={weekStart === addDays(currentWeek, 7)}
            className={`rounded-pill px-4 py-2 text-sm font-medium transition ${weekStart === addDays(currentWeek, 7) ? "bg-chrome text-ink" : "text-silver/70 hover:bg-silver/5"}`}>Next week</button>
        </div>
        <div className="flex items-center gap-3 text-sm font-medium text-silver">
          <button type="button" onClick={() => setWeekStart(addDays(weekStart, -7))} aria-label="Previous schedule week" className="rounded-full border border-silver/15 p-2 transition hover:border-chrome/50"><ChevronLeft size={16} /></button>
          <span className="min-w-[140px] text-center" aria-live="polite">{dateLabel(weekStart)} – {dateLabel(addDays(weekStart, 6))}</span>
          <button type="button" onClick={() => setWeekStart(addDays(weekStart, 7))} aria-label="Next schedule week" className="rounded-full border border-silver/15 p-2 transition hover:border-chrome/50"><ChevronRight size={16} /></button>
        </div>
      </div>

      <div className="mt-5 rounded-card border border-silver/10 bg-white p-4 sm:p-6">
        <div className="flex flex-wrap gap-3 border-b border-silver/10 pb-5">
          {educators.map((educator) => (
            <Link key={educator.id} href="/members/live-calls/watch" aria-label={`Open shared live room, ${educator.name}`}
              className={`inline-flex items-center gap-2 rounded-pill border px-3 py-2 text-xs font-medium transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chrome ${educatorColors[educator.id]}`}>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/70 text-[10px] font-semibold">{educator.initials}</span>
              <span>{educator.name} <span className="opacity-70">· {educator.subject}</span></span>
              <ArrowUpRight size={13} aria-hidden="true" />
            </Link>
          ))}
        </div>

        <p className="mt-4 text-xs text-silver/70 sm:hidden">Swipe sideways to see the full week.</p>
        <div className="mt-4 overflow-x-auto" role="region" aria-label="Weekly educator schedule, scroll horizontally for all days" tabIndex={0}>
          <table className="w-full min-w-[900px] table-fixed border-collapse text-left">
            <thead>
              <tr className="border-b border-silver/10 text-xs font-medium text-silver/70">
                <th scope="col" className="w-24 px-2 py-3">Time</th>
                {days.map((date) => (
                  <th scope="col" key={date} className={`px-2 py-3 ${date === today ? "text-chrome" : ""}`}>
                    {dayFormat.format(new Date(`${date}T00:00:00Z`))} {Number(date.slice(-2))}{date === today ? <span className="ml-1 text-[10px]">· Today</span> : null}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hours.length ? hours.map((hour) => (
                <tr key={hour} className="border-b border-silver/8 last:border-0">
                  <th scope="row" className="px-2 py-3 align-top text-xs font-semibold text-silver/70">{hour > 12 ? hour - 12 : hour}:00 {hour >= 12 ? "PM" : "AM"}</th>
                  {days.map((date) => (
                    <td key={date} className="border-l border-silver/8 p-2 align-top">
                      {calls.filter((call) => call.date === date && call.hour === hour).map((call) => {
                        const educator = educators.find((item) => item.id === call.educatorId)!;
                        return <Link key={`${date}-${educator.id}-${hour}`} href="/members/live-calls/watch"
                          aria-label={`Open shared live room, ${educator.name}, ${educator.subject}, ${dayFormat.format(new Date(`${date}T00:00:00Z`))} ${dateLabel(date)}, ${call.time}`}
                          className={`block min-h-[92px] rounded-xl border p-3 transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chrome ${educatorColors[educator.id]}`}>
                          <p className="text-xs font-semibold leading-snug">{educator.name}</p>
                          <p className="mt-1 text-xs font-medium">{educator.subject}</p>
                          <p className="mt-2 flex items-center justify-between gap-1 text-[11px]">{call.time}<ArrowUpRight size={13} aria-hidden="true" /></p>
                        </Link>;
                      })}
                    </td>
                  ))}
                </tr>
              )) : <tr><td colSpan={8} className="px-2 py-8 text-center text-sm text-silver/70">No educator calls are listed for this week yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
