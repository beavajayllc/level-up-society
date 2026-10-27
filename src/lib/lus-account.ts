import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { z } from "zod";
import { getEnv, isLusAuthConfigured } from "@/lib/env";
import type { WhopTokens, WhopUserInfo } from "@/lib/whop-oauth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseReadClient } from "@/lib/supabase/server";

const whopUserSchema = z.object({
  sub: z.string().min(1),
  name: z.string().optional(),
  preferred_username: z.string().optional(),
  picture: z.url().optional(),
  email: z.email().optional(),
  email_verified: z.boolean().optional(),
});

const whopTokensSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
  id_token: z.string().optional(),
  scope: z.string().optional(),
  token_type: z.string().min(1),
  expires_in: z.number().positive(),
});

const credentialsSchema = z.object({
  user: whopUserSchema,
  tokens: whopTokensSchema,
  obtainedAt: z.number().int().positive(),
});

export interface LusUser {
  id: string;
  email: string;
  username: string;
}

export interface LinkedWhopAccount {
  user: WhopUserInfo;
  tokens: WhopTokens;
  obtainedAt: number;
}

export class WhopAccountLinkError extends Error {
  constructor(
    message: string,
    readonly reason: "already_linked" | "conflict" = "conflict",
  ) {
    super(message);
    this.name = "WhopAccountLinkError";
  }
}

function encryptionKey(): Buffer {
  return createHash("sha256")
    .update(`level-up-society/whop-linked-account/v1\0${getEnv().SESSION_SECRET}`)
    .digest();
}

function encryptCredentials(value: LinkedWhopAccount): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(value), "utf8"),
    cipher.final(),
  ]);
  return [
    "v1",
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

function decryptCredentials(value: string): LinkedWhopAccount {
  const [version, ivValue, tagValue, ciphertextValue, extra] = value.split(".");
  if (version !== "v1" || !ivValue || !tagValue || !ciphertextValue || extra) {
    throw new Error("The linked Whop credentials have an unsupported format.");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(ivValue, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
  const parsed = credentialsSchema.parse(JSON.parse(plaintext));
  return parsed;
}

export async function getCurrentLusUser(): Promise<LusUser | null> {
  if (!isLusAuthConfigured()) return null;

  const auth = await createSupabaseReadClient();
  const { data, error } = await auth.auth.getUser();
  if (error && error.name !== "AuthSessionMissingError") {
    throw new Error("LUS account verification is temporarily unavailable.");
  }
  if (!data.user || !data.user.email || !data.user.email_confirmed_at) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("username")
    .eq("id", data.user.id)
    .maybeSingle();
  if (profileError) {
    throw new Error("LUS account profile lookup failed.");
  }
  if (!profile) return null;

  return {
    id: data.user.id,
    email: data.user.email,
    username: profile.username,
  };
}

export async function getLinkedWhopAccount(
  lusUserId: string,
): Promise<LinkedWhopAccount | null> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("whop_accounts")
    .select("credentials_ciphertext")
    .eq("lus_user_id", lusUserId)
    .maybeSingle();

  if (error) throw new Error("Linked Whop account lookup failed.");
  if (!data) return null;
  return decryptCredentials(data.credentials_ciphertext);
}

export async function hasLinkedWhopAccount(lusUserId: string): Promise<boolean> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("whop_accounts")
    .select("lus_user_id")
    .eq("lus_user_id", lusUserId)
    .maybeSingle();

  if (error) throw new Error("Linked Whop account lookup failed.");
  return data !== null;
}

export async function saveLinkedWhopAccount(
  lusUserId: string,
  user: WhopUserInfo,
  tokens: WhopTokens,
  obtainedAt: number,
): Promise<void> {
  const admin = createSupabaseAdminClient();
  const { data: linkedToWhop, error: whopLookupError } = await admin
    .from("whop_accounts")
    .select("lus_user_id")
    .eq("whop_user_id", user.sub)
    .maybeSingle();
  if (whopLookupError) throw new Error("Whop account link lookup failed.");
  if (linkedToWhop && linkedToWhop.lus_user_id !== lusUserId) {
    throw new WhopAccountLinkError(
      "That Whop account is already linked to a different Level Up Society account.",
      "conflict",
    );
  }

  const { data: linkedToLus, error: lusLookupError } = await admin
    .from("whop_accounts")
    .select("whop_user_id")
    .eq("lus_user_id", lusUserId)
    .maybeSingle();
  if (lusLookupError) throw new Error("Level Up Society account link lookup failed.");
  if (linkedToLus) {
    if (linkedToLus.whop_user_id === user.sub) {
      throw new WhopAccountLinkError(
        "This Level Up Society account is already connected to that Whop account.",
        "already_linked",
      );
    }
    throw new WhopAccountLinkError(
      "This Level Up Society account is already connected to a different Whop account.",
      "conflict",
    );
  }

  const account = credentialsSchema.parse({ user, tokens, obtainedAt });
  const { error: saveError } = await admin.from("whop_accounts").insert(
    {
      lus_user_id: lusUserId,
      whop_user_id: user.sub,
      user_info: user,
      credentials_ciphertext: encryptCredentials(account),
      token_obtained_at: obtainedAt,
      updated_at: new Date().toISOString(),
    },
  );
  if (saveError) {
    if (saveError.code === "23505") {
      throw new WhopAccountLinkError(
        "This Whop account or Level Up Society account already has a link.",
        "conflict",
      );
    }
    throw new Error("Whop account credentials could not be saved.");
  }
}

/** Update rotating OAuth credentials without changing the one-time account link. */
export async function saveRefreshedWhopCredentials(
  lusUserId: string,
  whopUserId: string,
  user: WhopUserInfo,
  tokens: WhopTokens,
  obtainedAt: number,
): Promise<void> {
  const admin = createSupabaseAdminClient();
  const account = credentialsSchema.parse({ user, tokens, obtainedAt });
  const { data, error } = await admin
    .from("whop_accounts")
    .update({
      user_info: user,
      credentials_ciphertext: encryptCredentials(account),
      token_obtained_at: obtainedAt,
      updated_at: new Date().toISOString(),
    })
    .eq("lus_user_id", lusUserId)
    .eq("whop_user_id", whopUserId)
    .select("lus_user_id")
    .maybeSingle();

  if (error) throw new Error("Refreshed Whop credentials could not be saved.");
  if (!data) throw new Error("The linked Whop account record no longer exists.");
}
