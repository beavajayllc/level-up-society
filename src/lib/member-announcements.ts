import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type Announcement = { id: string; body: string; created_at: string };
export type AnnouncementView = { status: "ready"; announcements: Announcement[]; isAdmin: boolean } | { status: "unavailable" };

export async function getAnnouncementView(userId: string): Promise<AnnouncementView> {
  const client = createSupabaseAdminClient();
  const [entries, admin] = await Promise.all([
    client.from("member_announcements").select("id, body, created_at").order("created_at", { ascending: false }).limit(10),
    client.from("announcement_admins").select("lus_user_id").eq("lus_user_id", userId).maybeSingle(),
  ]);
  if (entries.error || admin.error) {
    console.error("[announcements] Unable to load announcements", { entries: entries.error?.code, admin: admin.error?.code });
    return { status: "unavailable" };
  }
  return { status: "ready", announcements: entries.data, isAdmin: Boolean(admin.data) };
}

export async function isAnnouncementAdmin(userId: string): Promise<boolean> {
  const { data, error } = await createSupabaseAdminClient().from("announcement_admins").select("lus_user_id").eq("lus_user_id", userId).maybeSingle();
  if (error) throw new Error(`Announcement admin lookup failed: ${error.code}`);
  return Boolean(data);
}
