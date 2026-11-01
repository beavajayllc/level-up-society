"use client";

import { useActionState } from "react";
import { Bell } from "lucide-react";
import { deleteAnnouncement, postAnnouncement } from "@/app/members/announcement-actions";
import type { AnnouncementView } from "@/lib/member-announcements";

const initial = { status: "idle" as const, message: "" };
const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/New_York" });

function RemoveAnnouncement({ id }: { id: string }) {
  const [state, action, pending] = useActionState(deleteAnnouncement, initial);
  return <form action={action} className="mt-2"><input type="hidden" name="id" value={id} /><button disabled={pending} type="submit" className="text-xs text-silver/55 underline underline-offset-2 hover:text-silver disabled:opacity-50">{pending ? "Removing…" : "Remove"}</button><p role="status" className="text-xs text-silver/70">{state.message}</p></form>;
}

export function MemberAnnouncements({ view }: { view: AnnouncementView }) {
  const [state, action, pending] = useActionState(postAnnouncement, initial);
  return (
    <section aria-labelledby="announcements-title" className="rounded-card border border-silver/10 bg-silver/[0.035] p-5 sm:p-6">
      <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-accent-strong"><Bell size={14} /> Stay in the loop</p>
      <h2 id="announcements-title" className="mt-2 text-lg font-semibold text-silver">Announcements</h2>
      {view.status === "unavailable" ? <p className="mt-4 text-sm text-silver/65">Announcements are temporarily unavailable.</p> : <>
        {view.announcements.length ? <ul className="mt-4 space-y-4">{view.announcements.map((item) => <li key={item.id} className="border-t border-silver/10 pt-3"><p className="whitespace-pre-wrap text-sm leading-relaxed text-silver/80">{item.body}</p><time dateTime={item.created_at} className="mt-2 block text-xs text-silver/50">{dateFormat.format(new Date(item.created_at))}</time>{view.isAdmin ? <RemoveAnnouncement id={item.id} /> : null}</li>)}</ul> : <p className="mt-4 text-sm leading-relaxed text-silver/65">No announcements yet. Check back for updates from Level Up Society.</p>}
        {view.isAdmin ? <form action={action} className="mt-5 space-y-3 border-t border-silver/10 pt-4"><label htmlFor="announcement-body" className="block text-xs font-medium text-silver/75">Post an update</label><textarea id="announcement-body" name="body" required maxLength={1000} rows={3} className="w-full rounded-xl border border-silver/15 bg-ink px-3 py-2 text-sm text-silver outline-none focus:border-accent-strong" /><div className="flex items-center gap-3"><button disabled={pending} type="submit" className="rounded-pill bg-accent-strong px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{pending ? "Posting…" : "Post announcement"}</button><p role="status" className="text-xs text-silver/70">{state.message}</p></div></form> : null}
      </>}
    </section>
  );
}
