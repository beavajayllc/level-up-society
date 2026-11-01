"use server";

import { revalidatePath } from "next/cache";
import { requireMember } from "@/lib/member-access";
import { isAnnouncementAdmin } from "@/lib/member-announcements";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type AnnouncementActionState = { status: "idle" | "success" | "error"; message: string };

export async function postAnnouncement(_state: AnnouncementActionState, formData: FormData): Promise<AnnouncementActionState> {
  const value = formData.get("body");
  const body = typeof value === "string" ? value.trim() : "";
  if (!body || body.length > 1000) return { status: "error", message: "Enter an announcement of up to 1,000 characters." };
  const { lusUser } = await requireMember();
  try {
    if (!await isAnnouncementAdmin(lusUser.id)) return { status: "error", message: "You don't have permission to post announcements." };
    const { error } = await createSupabaseAdminClient().from("member_announcements").insert({ body, created_by: lusUser.id });
    if (error) throw error;
  } catch (error) {
    console.error("[announcements] Unable to post announcement", error instanceof Error ? error.message : "database error");
    return { status: "error", message: "The announcement couldn't be posted. Please try again." };
  }
  revalidatePath("/members");
  return { status: "success", message: "Announcement posted." };
}

export async function deleteAnnouncement(_state: AnnouncementActionState, formData: FormData): Promise<AnnouncementActionState> {
  const id = formData.get("id");
  if (typeof id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return { status: "error", message: "That announcement couldn't be found." };
  const { lusUser } = await requireMember();
  try {
    if (!await isAnnouncementAdmin(lusUser.id)) return { status: "error", message: "You don't have permission to remove announcements." };
    const { data, error } = await createSupabaseAdminClient().from("member_announcements").delete().eq("id", id).select("id");
    if (error) throw error;
    if (data.length === 0) return { status: "error", message: "That announcement couldn't be found." };
  } catch (error) {
    console.error("[announcements] Unable to remove announcement", error instanceof Error ? error.message : "database error");
    return { status: "error", message: "The announcement couldn't be removed. Please try again." };
  }
  revalidatePath("/members");
  return { status: "success", message: "Announcement removed." };
}
