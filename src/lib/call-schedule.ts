export type EducatorId = "pj" | "delphine" | "beava";

export const educators: { id: EducatorId; name: string; subject: string; initials: string }[] = [
  { id: "pj", name: "PJ LaBeach", subject: "Fitness", initials: "PJ" },
  { id: "delphine", name: "Delphine Njuguna", subject: "Forex", initials: "DN" },
  { id: "beava", name: "Beava Jay", subject: "Credit / Sales", initials: "BJ" },
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
    { title: "Community Call", time: "4:00 PM EST", hour: 16 },
    { title: "Delphine - Forex", time: "11:00 PM EST", hour: 23, educatorId: "delphine", href: "/members/live-calls" },
  ],
  "2026-10-26": [{ title: "Delphine - Forex", time: "11:00 PM EST", hour: 23, educatorId: "delphine", href: "/members/live-calls" }],
  "2026-10-28": [{ title: "Delphine - Forex", time: "11:00 PM EST", hour: 23, educatorId: "delphine", href: "/members/live-calls" }],
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
  const firstFitnessCall = Date.parse("2026-10-29T00:00:00Z");
  const elapsedDays = (Date.parse(`${date}T00:00:00Z`) - firstFitnessCall) / 86_400_000;
  if (elapsedDays >= 0 && elapsedDays % 14 === 0) {
    scheduledCalls.push({ title: "PJ LaBeach | Fitness", time: "8:00 PM EST", hour: 20, educatorId: "pj" });
  }
  const firstCreditSalesCall = Date.parse("2026-11-03T00:00:00Z");
  const creditSalesDays = (Date.parse(`${date}T00:00:00Z`) - firstCreditSalesCall) / 86_400_000;
  if (creditSalesDays >= 0 && creditSalesDays % 14 === 0) {
    scheduledCalls.push({ title: "Beava Jay | Credit / Sales", time: "8:00 PM EST", hour: 20, educatorId: "beava", href: "/members/live-calls" });
  }
  return scheduledCalls;
}
