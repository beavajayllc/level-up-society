export type EducatorId = "pj" | "delphine" | "beava";

export type Educator = {
  id: EducatorId;
  name: string;
  subject: string;
  initials: string;
  description: string;
  schedule: string;
  portrait?: string;
  portraitAiCreated?: boolean;
  portraitAiEdited?: boolean;
  portraitPosition?: string;
  instagram?: { url: string; handle: string };
};

export const educators: Educator[] = [
  { id: "pj", name: "PJ LaBeach", subject: "Fitness", initials: "PJ", description: "PJ LaBeach is a powerbuilding coach and powerlifter who helps people build strength and muscle. His coaching focuses on consistent training and working toward new personal bests.", schedule: "Every other Thursday · 8:00 PM Eastern", portrait: "/educators/pj-labeach-photo.jpg", portraitPosition: "center 25%", instagram: { url: "https://www.instagram.com/iampjlabeach/", handle: "iampjlabeach" } },
  { id: "delphine", name: "Delphine Njuguna", subject: "Forex", initials: "DN", description: "Join Delphine for live sessions exploring forex and the markets with the Level Up community.", schedule: "Sunday, Monday & Wednesday · 11:00 PM Eastern", portrait: "/educators/delphine-njuguna-cutout.png", portraitAiCreated: true },
  { id: "beava", name: "Beava Jay", subject: "Credit / Sales", initials: "BJ", description: "Beava Jay is an entrepreneur and founder of Level Up Society who shares guidance on credit, sales, and personal growth. Through live sessions and mentorship, he helps entrepreneurs build skills and work toward their goals.", schedule: "Every Tuesday · 8:00 PM Eastern", portrait: "/educators/beava-jay-cutout.png", portraitAiEdited: true, instagram: { url: "https://www.instagram.com/beava_jay/", handle: "beava_jay" } },
];

export type ScheduledCall = {
  title: string;
  time: string;
  hour: number;
  educatorId?: EducatorId;
  href?: string;
};

// These are the confirmed one-off calls; recurring calls are added below.
const oneOffCalls: Record<string, ScheduledCall[]> = {
  "2026-10-25": [
    { title: "Community Call", time: "4:00 PM ET", hour: 16 },
  ],
};

export function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function startOfWeek(date: string): string {
  return addDays(date, -new Date(`${date}T00:00:00Z`).getUTCDay());
}

export function callsForDate(date: string): ScheduledCall[] {
  const scheduledCalls = [...(oneOffCalls[date] ?? [])];
  const timestamp = Date.parse(`${date}T00:00:00Z`);
  const weekday = new Date(timestamp).getUTCDay();
  if (timestamp >= Date.parse("2026-10-25T00:00:00Z") && [0, 1, 3].includes(weekday)) {
    scheduledCalls.push({ title: "Delphine - Forex", time: "11:00 PM ET", hour: 23, educatorId: "delphine", href: "/members/live-calls" });
  }
  const firstFitnessCall = Date.parse("2026-10-29T00:00:00Z");
  const elapsedDays = (timestamp - firstFitnessCall) / 86_400_000;
  if (elapsedDays >= 0 && elapsedDays % 14 === 0) {
    scheduledCalls.push({ title: "PJ LaBeach | Fitness", time: "8:00 PM ET", hour: 20, educatorId: "pj" });
  }
  const firstCreditSalesCall = Date.parse("2026-10-27T00:00:00Z");
  const creditSalesDays = (timestamp - firstCreditSalesCall) / 86_400_000;
  if (creditSalesDays >= 0 && creditSalesDays % 7 === 0) {
    scheduledCalls.push({ title: "Beava Jay | Credit / Sales", time: "8:00 PM ET", hour: 20, educatorId: "beava", href: "/members/live-calls" });
  }
  return scheduledCalls;
}

/** Check the schedule using Eastern local dates, including daylight saving time. */
export function educatorIsScheduledNow(educatorId: EducatorId, now: Date): boolean {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value;
  const date = `${part("year")}-${part("month")}-${part("day")}`;
  const scheduled = (day: string) => callsForDate(day).some((call) => call.educatorId === educatorId);
  // Delphine's 11 PM calls can continue until 1 AM the next morning, even
  // when she also has a call scheduled later that day.
  const hour = Number(part("hour"));
  if (educatorId === "delphine") {
    return (hour >= 23 && scheduled(date)) || (hour < 1 && scheduled(addDays(date, -1)));
  }
  return scheduled(date);
}
