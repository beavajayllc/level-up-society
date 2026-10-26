interface D1Meta {
  changes?: number;
}

interface D1Result<T = unknown> {
  success: boolean;
  results?: T[];
  meta?: D1Meta;
}

interface D1PreparedStatement {
  bind(...values: Array<string | number | null>): D1PreparedStatement;
  first<T>(): Promise<T | null>;
  all<T>(): Promise<D1Result<T>>;
  run(): Promise<D1Result>;
}

interface D1Database {
  prepare(sql: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<D1Result[]>;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
}

interface ScheduledController {
  cron: string;
  scheduledTime: number;
}

interface Env {
  DB: D1Database;
  LUS_GATEWAY_SECRET: string;
  SITE_ACCESS_CHECK_URL: string;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_BOT_USERNAME: string;
  TELEGRAM_CHAT_ID?: string;
  TELEGRAM_WEBHOOK_SECRET: string;
}

interface AccountRow {
  whop_user_id: string;
  telegram_user_id: string;
  telegram_chat_id: string;
  membership_state: "active" | "inactive";
  telegram_state: "pending" | "joined" | "left" | "banned" | "granting" | "revoking";
}

interface InviteRow {
  invite_link: string;
  whop_user_id: string;
  telegram_user_id: string;
  expires_at: number;
  status: "pending" | "approved" | "declined" | "revoked" | "expired";
}

interface TelegramUser {
  id: number;
}

interface TelegramChat {
  id: number;
  type: string;
}

interface TelegramChatMember {
  status: string;
  is_member?: boolean;
  can_invite_users?: boolean;
  can_restrict_members?: boolean;
}

interface TelegramChatInviteLink {
  invite_link: string;
}

interface TelegramMessage {
  text?: string;
  chat: TelegramChat;
  from?: TelegramUser;
}

interface TelegramJoinRequest {
  chat: TelegramChat;
  from: TelegramUser;
  invite_link?: TelegramChatInviteLink;
}

interface TelegramChatMemberUpdate {
  chat: TelegramChat;
  old_chat_member: TelegramChatMember;
  new_chat_member: TelegramChatMember & { user: TelegramUser };
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  chat_join_request?: TelegramJoinRequest;
  chat_member?: TelegramChatMemberUpdate;
  my_chat_member?: TelegramChatMemberUpdate;
}

type MembershipState = "active" | "trialing" | "inactive" | "unknown";

class GatewayError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
  ) {
    super(code);
    this.name = "GatewayError";
  }
}

const encoder = new TextEncoder();
const LINK_TTL_SECONDS = 10 * 60;
const INVITE_TTL_SECONDS = 10 * 60;

function json(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

function isValidUserId(value: unknown): value is string {
  return typeof value === "string" && /^user_[A-Za-z0-9_-]{4,96}$/.test(value);
}

function asTelegramId(value: number): string {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new GatewayError("invalid_telegram_user", 400);
  }
  return String(value);
}

function telegramIdNumber(value: string): number {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0 || String(id) !== value) {
    throw new GatewayError("invalid_telegram_user", 400);
  }
  return id;
}

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function randomCode(): Promise<string> {
  return base64Url(crypto.getRandomValues(new Uint8Array(24)));
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return base64Url(new Uint8Array(digest));
}

async function telegram<T>(env: Env, method: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(
    `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  const result: unknown = await response.json().catch(() => null);
  if (
    !response.ok ||
    !isRecord(result) ||
    result.ok !== true ||
    !("result" in result)
  ) {
    console.error(`[telegram] ${method} failed with HTTP ${response.status}`);
    throw new GatewayError(`telegram_${method.toLowerCase()}_failed`, 503);
  }

  return result.result as T;
}

async function membershipFor(env: Env, whopUserId: string): Promise<MembershipState> {
  const response = await fetch(env.SITE_ACCESS_CHECK_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.LUS_GATEWAY_SECRET}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ whopUserIds: [whopUserId] }),
    signal: AbortSignal.timeout(10_000),
  }).catch(() => {
    throw new GatewayError("site_access_check_unavailable", 503);
  });

  if (!response.ok) {
    console.error(`[telegram] site access check responded ${response.status}`);
    throw new GatewayError("site_access_check_failed", 503);
  }

  const payload: unknown = await response.json().catch(() => null);
  if (!isRecord(payload) || !isRecord(payload.memberships)) {
    throw new GatewayError("site_access_check_invalid_response", 503);
  }

  const state = payload.memberships[whopUserId];
  if (state === "active" || state === "trialing" || state === "inactive") return state;
  return "unknown";
}

async function membershipsFor(
  env: Env,
  whopUserIds: string[],
): Promise<Record<string, MembershipState>> {
  const response = await fetch(env.SITE_ACCESS_CHECK_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.LUS_GATEWAY_SECRET}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ whopUserIds }),
    signal: AbortSignal.timeout(30_000),
  }).catch(() => {
    throw new GatewayError("site_access_check_unavailable", 503);
  });

  if (!response.ok) {
    console.error(`[telegram] batch site access check responded ${response.status}`);
    throw new GatewayError("site_access_check_failed", 503);
  }

  const payload: unknown = await response.json().catch(() => null);
  if (!isRecord(payload) || !isRecord(payload.memberships)) {
    throw new GatewayError("site_access_check_invalid_response", 503);
  }

  const memberships: Record<string, MembershipState> = {};
  for (const userId of whopUserIds) {
    const state = payload.memberships[userId];
    memberships[userId] =
      state === "active" || state === "trialing" || state === "inactive"
        ? state
        : "unknown";
  }
  return memberships;
}

async function telegramTargetChatId(env: Env): Promise<string> {
  const setting = await env.DB.prepare(
    "SELECT setting_value FROM telegram_settings WHERE setting_key = 'target_chat_id'",
  ).first<{ setting_value: string }>();
  const configuredId = env.TELEGRAM_CHAT_ID?.trim();
  if (configuredId && setting && configuredId !== setting.setting_value) {
    throw new GatewayError("telegram_chat_id_mismatch", 503);
  }

  const chatId = setting?.setting_value ?? configuredId;
  if (!chatId || !/^-?\d+$/.test(chatId)) {
    throw new GatewayError("telegram_group_not_connected", 503);
  }
  return chatId;
}

async function ensureTelegramWebhook(env: Env, requestUrl: string): Promise<void> {
  if (!/^[A-Za-z0-9_-]{1,256}$/.test(env.TELEGRAM_WEBHOOK_SECRET)) {
    throw new GatewayError("telegram_webhook_secret_invalid", 503);
  }

  const webhookUrl = new URL("/telegram/webhook", requestUrl).toString();
  const current = await telegram<{ url?: string }>(env, "getWebhookInfo", {});
  if (current.url === webhookUrl) return;
  if (current.url) {
    throw new GatewayError("telegram_webhook_already_configured", 409);
  }

  await telegram<boolean>(env, "setWebhook", {
    url: webhookUrl,
    secret_token: env.TELEGRAM_WEBHOOK_SECRET,
    allowed_updates: ["message", "chat_member", "chat_join_request", "my_chat_member"],
  });
}

async function sendMessage(
  env: Env,
  chatId: string,
  text: string,
  inviteUrl?: string,
): Promise<void> {
  const body: Record<string, unknown> = { chat_id: chatId, text };
  if (inviteUrl) {
    body.reply_markup = {
      inline_keyboard: [[{ text: "Request to join Trade Ideas", url: inviteUrl }]],
    };
  }
  await telegram<unknown>(env, "sendMessage", body);
}

async function createJoinRequestInvite(
  env: Env,
  account: AccountRow,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + INVITE_TTL_SECONDS;
  const chatId = await telegramTargetChatId(env);
  const invite = await telegram<TelegramChatInviteLink>(env, "createChatInviteLink", {
    chat_id: chatId,
    name: "Level Up Pro member",
    expire_date: expiresAt,
    creates_join_request: true,
  });

  try {
    const result = await env.DB.prepare(
      `INSERT INTO telegram_invites
        (invite_link, whop_user_id, telegram_user_id, created_at, expires_at, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
    )
      .bind(
        invite.invite_link,
        account.whop_user_id,
        account.telegram_user_id,
        now,
        expiresAt,
      )
      .run();
    if (!result.success) throw new GatewayError("invite_store_failed", 503);
  } catch (error) {
    await telegram<boolean>(env, "revokeChatInviteLink", {
      chat_id: chatId,
      invite_link: invite.invite_link,
    });
    throw error;
  }

  return invite.invite_link;
}

async function revokePendingInvites(env: Env, whopUserId: string): Promise<void> {
  const { results = [] } = await env.DB.prepare(
    `SELECT invite_link, whop_user_id, telegram_user_id, expires_at, status
       FROM telegram_invites
      WHERE whop_user_id = ? AND status = 'pending'`,
  )
    .bind(whopUserId)
    .all<InviteRow>();

  const chatId = results.length > 0 ? await telegramTargetChatId(env) : null;

  for (const invite of results) {
    if (invite.expires_at > Math.floor(Date.now() / 1000)) {
      await telegram<boolean>(env, "revokeChatInviteLink", {
        chat_id: chatId,
        invite_link: invite.invite_link,
      });
    }
    await env.DB.prepare(
      "UPDATE telegram_invites SET status = 'revoked' WHERE invite_link = ? AND status = 'pending'",
    )
      .bind(invite.invite_link)
      .run();
  }
}

async function sendJoinInvite(env: Env, account: AccountRow): Promise<void> {
  const invite = await createJoinRequestInvite(env, account);
  await sendMessage(
    env,
    account.telegram_chat_id,
    "Your Level Up Pro membership is active. Tap below to request entry to the Trade Ideas chat. The bot checks this Telegram account before approving you.",
    invite,
  );
}

async function isInChat(env: Env, telegramUserId: string): Promise<boolean> {
  const chatId = await telegramTargetChatId(env);
  const member = await telegram<TelegramChatMember>(env, "getChatMember", {
    chat_id: chatId,
    user_id: telegramIdNumber(telegramUserId),
  });
  return (
    member.status === "creator" ||
    member.status === "administrator" ||
    member.status === "member" ||
    (member.status === "restricted" && member.is_member === true)
  );
}

async function createLinkRequest(env: Env, request: Request): Promise<Response> {
  const body: unknown = await request.json().catch(() => null);
  const whopUserId = isRecord(body) ? body.whopUserId : undefined;
  if (!isValidUserId(whopUserId)) return json({ error: "invalid_user" }, 400);

  const membership = await membershipFor(env, whopUserId);
  if (membership === "unknown") throw new GatewayError("membership_unavailable", 503);
  if (membership !== "active" && membership !== "trialing") {
    return json({ error: "membership_inactive" }, 403);
  }

  await ensureTelegramWebhook(env, request.url);

  const code = await randomCode();
  const now = Math.floor(Date.now() / 1000);
  const result = await env.DB.prepare(
    `INSERT INTO telegram_link_claims
       (whop_user_id, token_hash, created_at, expires_at, consumed_at)
     VALUES (?, ?, ?, ?, NULL)
     ON CONFLICT(whop_user_id) DO UPDATE SET
       token_hash = excluded.token_hash,
       created_at = excluded.created_at,
       expires_at = excluded.expires_at,
       consumed_at = NULL`,
  )
    .bind(whopUserId, await sha256(code), now, now + LINK_TTL_SECONDS)
    .run();

  if (!result.success) throw new GatewayError("link_claim_store_failed", 503);

  return json({
    telegramUrl: `https://t.me/${env.TELEGRAM_BOT_USERNAME.replace(/^@/, "")}?start=${code}`,
    expiresInSeconds: LINK_TTL_SECONDS,
  });
}

async function handleStart(env: Env, message: TelegramMessage): Promise<void> {
  const telegramUser = message.from;
  const text = message.text ?? "";
  const match = text.match(/^\/start(?:@[A-Za-z0-9_]+)?(?:\s+([A-Za-z0-9_-]{20,80}))?\s*$/);
  if (!telegramUser || message.chat.type !== "private" || !match?.[1]) {
    if (telegramUser && message.chat.type === "private") {
      await sendMessage(
        env,
        String(message.chat.id),
        "To connect, sign in to the Level Up Society members area and create your personal Telegram link from the Trade Ideas page.",
      );
    }
    return;
  }

  const telegramUserId = asTelegramId(telegramUser.id);
  const codeHash = await sha256(match[1]);
  const now = Math.floor(Date.now() / 1000);
  const claim = await env.DB.prepare(
    `SELECT whop_user_id, token_hash, created_at, expires_at, consumed_at
       FROM telegram_link_claims
      WHERE token_hash = ? AND consumed_at IS NULL AND expires_at > ?`,
  )
    .bind(codeHash, now)
    .first<{ whop_user_id: string }>();

  if (!claim) {
    await sendMessage(
      env,
      String(message.chat.id),
      "That connection link has expired or was already used. Create a fresh one from the Trade Ideas page while signed in.",
    );
    return;
  }

  const membership = await membershipFor(env, claim.whop_user_id);
  if (membership === "unknown") throw new GatewayError("membership_unavailable", 503);
  if (membership !== "active" && membership !== "trialing") {
    await sendMessage(
      env,
      String(message.chat.id),
      "This WHOP account does not have an active Level Up Pro membership, so it cannot join the Trade Ideas chat.",
    );
    return;
  }

  const existingForWhop = await env.DB.prepare(
    `SELECT whop_user_id, telegram_user_id, telegram_chat_id, membership_state, telegram_state
       FROM telegram_accounts WHERE whop_user_id = ?`,
  )
    .bind(claim.whop_user_id)
    .first<AccountRow>();
  const existingForTelegram = await env.DB.prepare(
    `SELECT whop_user_id, telegram_user_id, telegram_chat_id, membership_state, telegram_state
       FROM telegram_accounts WHERE telegram_user_id = ?`,
  )
    .bind(telegramUserId)
    .first<AccountRow>();

  if (
    (existingForWhop && existingForWhop.telegram_user_id !== telegramUserId) ||
    (existingForTelegram && existingForTelegram.whop_user_id !== claim.whop_user_id)
  ) {
    await sendMessage(
      env,
      String(message.chat.id),
      "This WHOP or Telegram account is already linked to a different account. Please contact Level Up Society support to update the connection.",
    );
    return;
  }

  const consumed = await env.DB.prepare(
    `UPDATE telegram_link_claims SET consumed_at = ?
      WHERE whop_user_id = ? AND token_hash = ? AND consumed_at IS NULL AND expires_at > ?
      RETURNING whop_user_id`,
  )
    .bind(now, claim.whop_user_id, codeHash, now)
    .first<{ whop_user_id: string }>();
  if (!consumed) {
    await sendMessage(
      env,
      String(message.chat.id),
      "That connection link was already used. Create a fresh one from the Trade Ideas page.",
    );
    return;
  }

  let account: AccountRow;
  if (existingForWhop) {
    account = {
      ...existingForWhop,
      telegram_chat_id: String(message.chat.id),
      membership_state: "active",
    };
    await env.DB.prepare(
      `UPDATE telegram_accounts SET telegram_chat_id = ?, membership_state = 'active', updated_at = ?
        WHERE whop_user_id = ?`,
    )
      .bind(account.telegram_chat_id, now, claim.whop_user_id)
      .run();
  } else {
    account = {
      whop_user_id: claim.whop_user_id,
      telegram_user_id: telegramUserId,
      telegram_chat_id: String(message.chat.id),
      membership_state: "active",
      telegram_state: "granting",
    };
    try {
      const result = await env.DB.prepare(
        `INSERT INTO telegram_accounts
          (whop_user_id, telegram_user_id, telegram_chat_id, membership_state, telegram_state, linked_at, updated_at)
         VALUES (?, ?, ?, 'active', 'granting', ?, ?)`,
      )
        .bind(
          account.whop_user_id,
          account.telegram_user_id,
          account.telegram_chat_id,
          now,
          now,
        )
        .run();
      if (!result.success) throw new GatewayError("telegram_account_link_failed", 503);
    } catch (error) {
      const [whopConflict, telegramConflict] = await Promise.all([
        env.DB.prepare("SELECT whop_user_id FROM telegram_accounts WHERE whop_user_id = ?")
          .bind(claim.whop_user_id)
          .first<{ whop_user_id: string }>(),
        env.DB.prepare("SELECT telegram_user_id FROM telegram_accounts WHERE telegram_user_id = ?")
          .bind(telegramUserId)
          .first<{ telegram_user_id: string }>(),
      ]);
      if (!whopConflict && !telegramConflict) throw error;

      console.warn("[telegram] a WHOP or Telegram account link conflicted");
      await sendMessage(
        env,
        String(message.chat.id),
        "This WHOP or Telegram account is already linked to a different account. Please contact Level Up Society support to update the connection.",
      );
      return;
    }
  }

  if (account.telegram_state === "joined" && (await isInChat(env, telegramUserId))) {
    await sendMessage(env, String(message.chat.id), "You’re already connected to the Trade Ideas chat. Your Level Up Pro membership is active.");
    return;
  }

  await telegram<boolean>(env, "unbanChatMember", {
    chat_id: await telegramTargetChatId(env),
    user_id: telegramIdNumber(telegramUserId),
    only_if_banned: true,
  });

  await env.DB.prepare(
    `UPDATE telegram_accounts SET membership_state = 'active', telegram_state = 'granting', updated_at = ?
      WHERE whop_user_id = ?`,
  )
    .bind(now, claim.whop_user_id)
    .run();

  if (await isInChat(env, telegramUserId)) {
    await env.DB.prepare(
      `UPDATE telegram_accounts SET membership_state = 'active', telegram_state = 'joined', updated_at = ?
        WHERE whop_user_id = ?`,
    )
      .bind(now, claim.whop_user_id)
      .run();
    await sendMessage(env, String(message.chat.id), "Your active Level Up Pro membership is verified, and your Telegram account is already in the Trade Ideas chat.");
    return;
  }

  await revokePendingInvites(env, claim.whop_user_id);
  await sendJoinInvite(env, account);
  await env.DB.prepare(
    `UPDATE telegram_accounts SET membership_state = 'active', telegram_state = 'pending', updated_at = ?
      WHERE whop_user_id = ?`,
  )
    .bind(now, claim.whop_user_id)
    .run();
}

async function declineJoinRequest(
  env: Env,
  request: TelegramJoinRequest,
  message?: string,
): Promise<void> {
  await telegram<boolean>(env, "declineChatJoinRequest", {
    chat_id: request.chat.id,
    user_id: request.from.id,
  });
  if (message) {
    await sendMessage(env, String(request.from.id), message).catch(() => undefined);
  }
}

async function handleJoinRequest(env: Env, request: TelegramJoinRequest): Promise<void> {
  if (String(request.chat.id) !== (await telegramTargetChatId(env))) return;

  const telegramUserId = asTelegramId(request.from.id);
  const inviteLink = request.invite_link?.invite_link;
  if (!inviteLink) {
    await declineJoinRequest(
      env,
      request,
      "Please create a new personal join link from the Trade Ideas page while signed in.",
    );
    return;
  }

  const invite = await env.DB.prepare(
    `SELECT invite_link, whop_user_id, telegram_user_id, expires_at, status
       FROM telegram_invites WHERE invite_link = ?`,
  )
    .bind(inviteLink)
    .first<InviteRow>();

  if (
    !invite ||
    (invite.status !== "pending" && invite.status !== "approved") ||
    invite.expires_at <= Math.floor(Date.now() / 1000) ||
    invite.telegram_user_id !== telegramUserId
  ) {
    await declineJoinRequest(
      env,
      request,
      "This join request does not match your active Level Up Pro account. Create a fresh personal link from the Trade Ideas page.",
    );
    return;
  }

  if (invite.status === "approved" && !(await isInChat(env, telegramUserId))) {
    await declineJoinRequest(
      env,
      request,
      "This join link has already been used. Create a fresh personal link from the Trade Ideas page.",
    );
    return;
  }

  const membership = await membershipFor(env, invite.whop_user_id);
  if (membership === "unknown") throw new GatewayError("membership_unavailable", 503);
  if (membership !== "active" && membership !== "trialing") {
    await declineJoinRequest(
      env,
      request,
      "Your Level Up Pro membership is no longer active, so this request was not approved.",
    );
    await env.DB.prepare(
      `UPDATE telegram_accounts SET membership_state = 'inactive', telegram_state = 'revoking', updated_at = ?
        WHERE whop_user_id = ?`,
    )
      .bind(Math.floor(Date.now() / 1000), invite.whop_user_id)
      .run();
    await telegram<boolean>(env, "banChatMember", {
      chat_id: await telegramTargetChatId(env),
      user_id: request.from.id,
    });
    await env.DB.prepare(
      `UPDATE telegram_accounts SET telegram_state = 'banned', updated_at = ?
        WHERE whop_user_id = ?`,
    )
      .bind(Math.floor(Date.now() / 1000), invite.whop_user_id)
      .run();
    return;
  }

  if (!(await isInChat(env, telegramUserId))) {
    await telegram<boolean>(env, "approveChatJoinRequest", {
      chat_id: request.chat.id,
      user_id: request.from.id,
    });
  }
  const now = Math.floor(Date.now() / 1000);
  await env.DB.prepare(
    `UPDATE telegram_invites SET status = 'approved' WHERE invite_link = ? AND status = 'pending'`,
  )
    .bind(inviteLink)
    .run();
  await env.DB.prepare(
    `UPDATE telegram_accounts SET membership_state = 'active', telegram_state = 'joined', updated_at = ?
      WHERE whop_user_id = ? AND telegram_user_id = ?`,
  )
    .bind(now, invite.whop_user_id, telegramUserId)
    .run();
  await revokePendingInvites(env, invite.whop_user_id);
}

function isPresent(member: TelegramChatMember): boolean {
  return (
    member.status === "creator" ||
    member.status === "administrator" ||
    member.status === "member" ||
    (member.status === "restricted" && member.is_member === true)
  );
}

async function handleChatMemberUpdate(
  env: Env,
  update: TelegramChatMemberUpdate,
): Promise<void> {
  const chatId = await telegramTargetChatId(env);
  if (String(update.chat.id) !== chatId) return;

  const telegramUserId = asTelegramId(update.new_chat_member.user.id);
  const now = Math.floor(Date.now() / 1000);

  if (isPresent(update.old_chat_member) && !isPresent(update.new_chat_member)) {
    const nextState = update.new_chat_member.status === "kicked" ? "banned" : "left";
    await env.DB.prepare(
      `UPDATE telegram_accounts SET telegram_state = ?, updated_at = ? WHERE telegram_user_id = ?`,
    )
      .bind(nextState, now, telegramUserId)
      .run();
    return;
  }

  if (isPresent(update.old_chat_member) || !isPresent(update.new_chat_member)) return;

  const account = await env.DB.prepare(
    `SELECT whop_user_id, telegram_user_id, telegram_chat_id, membership_state, telegram_state
       FROM telegram_accounts WHERE telegram_user_id = ?`,
  )
    .bind(telegramUserId)
    .first<AccountRow>();

  if (!account) {
    await telegram<boolean>(env, "banChatMember", {
      chat_id: chatId,
      user_id: telegramIdNumber(telegramUserId),
    });
    return;
  }

  const membership = await membershipFor(env, account.whop_user_id);
  if (membership === "unknown") throw new GatewayError("membership_unavailable", 503);
  if (membership !== "active" && membership !== "trialing") {
    await revokePendingInvites(env, account.whop_user_id);
    await telegram<boolean>(env, "banChatMember", {
      chat_id: chatId,
      user_id: telegramIdNumber(telegramUserId),
    });
    await env.DB.prepare(
      `UPDATE telegram_accounts SET membership_state = 'inactive', telegram_state = 'banned', updated_at = ?
        WHERE whop_user_id = ?`,
    )
      .bind(now, account.whop_user_id)
      .run();
    return;
  }

  await env.DB.prepare(
    `UPDATE telegram_accounts SET membership_state = 'active', telegram_state = 'joined', updated_at = ?
      WHERE whop_user_id = ?`,
  )
    .bind(now, account.whop_user_id)
    .run();
}

async function processTelegramUpdate(env: Env, update: TelegramUpdate): Promise<void> {
  if (update.message) await handleStart(env, update.message);
  if (update.chat_join_request) await handleJoinRequest(env, update.chat_join_request);
  if (update.chat_member) await handleChatMemberUpdate(env, update.chat_member);
  if (update.my_chat_member) await handleBotChatMemberUpdate(env, update.my_chat_member);
}

async function handleBotChatMemberUpdate(
  env: Env,
  update: TelegramChatMemberUpdate,
): Promise<void> {
  if (
    update.chat.type !== "group" &&
    update.chat.type !== "supergroup" &&
    update.chat.type !== "channel"
  ) return;

  const botMembership = update.new_chat_member;
  if (
    botMembership.status !== "administrator" ||
    botMembership.can_invite_users !== true ||
    botMembership.can_restrict_members !== true
  ) {
    console.warn("[telegram setup] bot needs invite and member restriction permissions in the target chat");
    return;
  }

  const chatId = String(update.chat.id);
  if (env.TELEGRAM_CHAT_ID && env.TELEGRAM_CHAT_ID !== chatId) {
    console.warn("[telegram setup] bot was added to a chat that does not match the configured target");
    return;
  }

  const existing = await env.DB.prepare(
    "SELECT setting_value FROM telegram_settings WHERE setting_key = 'target_chat_id'",
  ).first<{ setting_value: string }>();
  if (existing && existing.setting_value !== chatId) {
    console.warn("[telegram setup] another Telegram chat is already connected; the target was left unchanged");
    return;
  }

  const result = await env.DB.prepare(
    `INSERT INTO telegram_settings (setting_key, setting_value, updated_at)
     VALUES ('target_chat_id', ?, ?)
     ON CONFLICT(setting_key) DO NOTHING`,
  )
    .bind(chatId, Math.floor(Date.now() / 1000))
    .run();
  if (!result.success) throw new GatewayError("telegram_group_setup_failed", 503);
}

async function createLinkRequestRoute(env: Env, request: Request): Promise<Response> {
  if (!constantTimeEqual(request.headers.get("authorization") ?? "", `Bearer ${env.LUS_GATEWAY_SECRET}`)) {
    return json({ error: "unauthorized" }, 401);
  }
  return createLinkRequest(env, request);
}

async function syncMemberRoute(env: Env, request: Request): Promise<Response> {
  if (!constantTimeEqual(request.headers.get("authorization") ?? "", `Bearer ${env.LUS_GATEWAY_SECRET}`)) {
    return json({ error: "unauthorized" }, 401);
  }

  const body: unknown = await request.json().catch(() => null);
  const whopUserId = isRecord(body) ? body.whopUserId : undefined;
  if (!isValidUserId(whopUserId)) return json({ error: "invalid_user" }, 400);

  const state = await membershipFor(env, whopUserId);
  if (state === "unknown") throw new GatewayError("membership_unavailable", 503);
  await syncAccount(env, whopUserId, state === "active" || state === "trialing");
  return json({ synced: true });
}

function hasGatewayAuthorization(request: Request, env: Env): boolean {
  return constantTimeEqual(
    request.headers.get("authorization") ?? "",
    `Bearer ${env.LUS_GATEWAY_SECRET}`,
  );
}

function validDigest(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{43}$/.test(value);
}

function validSessionPayload(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 20_000;
}

async function mobileAuthRoute(
  env: Env,
  request: Request,
  operation: "codes" | "exchange" | "resolve" | "update" | "revoke",
): Promise<Response> {
  if (!hasGatewayAuthorization(request, env)) {
    return json({ error: "unauthorized" }, 401);
  }

  const body: unknown = await request.json().catch(() => null);
  if (!isRecord(body)) return json({ error: "invalid_body" }, 400);
  const now = Math.floor(Date.now() / 1000);

  if (operation === "codes") {
    const { codeHash, sessionPayload, createdAt, expiresAt } = body;
    if (
      !validDigest(codeHash) ||
      !validSessionPayload(sessionPayload) ||
      typeof createdAt !== "number" ||
      !Number.isInteger(createdAt) ||
      typeof expiresAt !== "number" ||
      !Number.isInteger(expiresAt) ||
      createdAt > now + 30 ||
      expiresAt <= now ||
      expiresAt > now + 5 * 60
    ) {
      return json({ error: "invalid_code" }, 400);
    }

    const result = await env.DB.prepare(
      `INSERT INTO mobile_auth_codes (code_hash, session_payload, created_at, expires_at)
       VALUES (?, ?, ?, ?)`,
    )
      .bind(codeHash, sessionPayload, createdAt, expiresAt)
      .run();
    if (!result.success) throw new GatewayError("mobile_auth_code_store_failed", 503);
    return json({ ok: true });
  }

  if (operation === "exchange") {
    const { codeHash, sessionHash, expiresAt } = body;
    if (
      !validDigest(codeHash) ||
      !validDigest(sessionHash) ||
      typeof expiresAt !== "number" ||
      !Number.isInteger(expiresAt) ||
      expiresAt <= now ||
      expiresAt > now + 30 * 24 * 60 * 60
    ) {
      return json({ error: "invalid_code" }, 400);
    }

    const [inserted] = await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO mobile_auth_sessions (session_hash, session_payload, created_at, expires_at)
         SELECT ?, session_payload, ?, ? FROM mobile_auth_codes
          WHERE code_hash = ? AND expires_at > ?`,
      ).bind(sessionHash, now, expiresAt, codeHash, now),
      env.DB.prepare("DELETE FROM mobile_auth_codes WHERE code_hash = ?").bind(codeHash),
    ]);
    if (!inserted?.success) throw new GatewayError("mobile_auth_session_store_failed", 503);
    if ((inserted.meta?.changes ?? 0) !== 1) {
      return json({ error: "invalid_code" }, 401);
    }

    const session = await env.DB.prepare(
      `SELECT session_payload FROM mobile_auth_sessions
        WHERE session_hash = ? AND revoked_at IS NULL AND expires_at > ?`,
    )
      .bind(sessionHash, now)
      .first<{ session_payload: string }>();
    if (!session) throw new GatewayError("mobile_auth_session_missing", 503);
    return json({ ok: true, sessionPayload: session.session_payload });
  }

  if (operation === "resolve") {
    const { sessionHash } = body;
    if (!validDigest(sessionHash)) return json({ error: "invalid_session" }, 400);
    const session = await env.DB.prepare(
      `SELECT session_payload FROM mobile_auth_sessions
        WHERE session_hash = ? AND revoked_at IS NULL AND expires_at > ?`,
    )
      .bind(sessionHash, now)
      .first<{ session_payload: string }>();
    return json(
      session
        ? { active: true, sessionPayload: session.session_payload }
        : { active: false },
    );
  }

  if (operation === "update") {
    const { sessionHash, sessionPayload } = body;
    if (!validDigest(sessionHash) || !validSessionPayload(sessionPayload)) {
      return json({ error: "invalid_session" }, 400);
    }
    const result = await env.DB.prepare(
      `UPDATE mobile_auth_sessions SET session_payload = ?
        WHERE session_hash = ? AND revoked_at IS NULL AND expires_at > ?`,
    )
      .bind(sessionPayload, sessionHash, now)
      .run();
    return json({ active: (result.meta?.changes ?? 0) === 1 });
  }

  const { sessionHash } = body;
  if (!validDigest(sessionHash)) return json({ error: "invalid_session" }, 400);
  const result = await env.DB.prepare(
    `UPDATE mobile_auth_sessions SET revoked_at = ?
      WHERE session_hash = ? AND revoked_at IS NULL`,
  )
    .bind(now, sessionHash)
    .run();
  return json({ revoked: (result.meta?.changes ?? 0) === 1 });
}

async function syncAccount(
  env: Env,
  whopUserId: string,
  active: boolean,
): Promise<void> {
  const account = await env.DB.prepare(
    `SELECT whop_user_id, telegram_user_id, telegram_chat_id, membership_state, telegram_state
       FROM telegram_accounts WHERE whop_user_id = ?`,
  )
    .bind(whopUserId)
    .first<AccountRow>();
  if (!account) return;

  const now = Math.floor(Date.now() / 1000);
  const chatId = await telegramTargetChatId(env);
  if (!active) {
    if (account.membership_state === "inactive" && account.telegram_state === "banned") return;
    await env.DB.prepare(
      `UPDATE telegram_accounts SET membership_state = 'inactive', telegram_state = 'revoking', updated_at = ?
        WHERE whop_user_id = ?`,
    )
      .bind(now, whopUserId)
      .run();
    await revokePendingInvites(env, whopUserId);
    await telegram<boolean>(env, "banChatMember", {
      chat_id: chatId,
      user_id: telegramIdNumber(account.telegram_user_id),
    });
    await env.DB.prepare(
      `UPDATE telegram_accounts SET membership_state = 'inactive', telegram_state = 'banned', updated_at = ?
        WHERE whop_user_id = ?`,
    )
      .bind(now, whopUserId)
      .run();
    return;
  }

  if (account.membership_state === "active" && account.telegram_state === "joined") {
    if (await isInChat(env, account.telegram_user_id)) return;
  }
  if (account.membership_state === "active" && account.telegram_state === "pending") {
    const pendingInvite = await env.DB.prepare(
      `SELECT invite_link FROM telegram_invites
        WHERE whop_user_id = ? AND status = 'pending' AND expires_at > ? LIMIT 1`,
    )
      .bind(whopUserId, now)
      .first<{ invite_link: string }>();
    if (pendingInvite) return;
  }

  await env.DB.prepare(
    `UPDATE telegram_accounts SET membership_state = 'active', telegram_state = 'granting', updated_at = ?
      WHERE whop_user_id = ?`,
  )
    .bind(now, whopUserId)
    .run();

  await telegram<boolean>(env, "unbanChatMember", {
    chat_id: chatId,
    user_id: telegramIdNumber(account.telegram_user_id),
    only_if_banned: true,
  });

  const updated: AccountRow = { ...account, membership_state: "active", telegram_state: "pending" };
  await revokePendingInvites(env, whopUserId);
  await sendJoinInvite(env, updated);
  await env.DB.prepare(
    `UPDATE telegram_accounts SET membership_state = 'active', telegram_state = 'pending', updated_at = ?
      WHERE whop_user_id = ?`,
  )
    .bind(now, whopUserId)
    .run();
}

async function handleTelegramWebhook(env: Env, request: Request): Promise<Response> {
  if (
    !constantTimeEqual(
      request.headers.get("x-telegram-bot-api-secret-token") ?? "",
      env.TELEGRAM_WEBHOOK_SECRET,
    )
  ) {
    return json({ error: "unauthorized" }, 401);
  }

  const payload: unknown = await request.json().catch(() => null);
  if (!isRecord(payload) || typeof payload.update_id !== "number") {
    return json({ error: "invalid_update" }, 400);
  }

  try {
    await processTelegramUpdate(env, payload as unknown as TelegramUpdate);
  } catch (error) {
    const code = error instanceof GatewayError ? error.code : "telegram_update_failed";
    console.error(`[telegram webhook] ${code}`);
    return json({ error: code }, error instanceof GatewayError ? error.status : 503);
  }

  return json({ ok: true });
}

async function reconcile(env: Env): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await env.DB.prepare("DELETE FROM mobile_auth_codes WHERE expires_at < ?")
    .bind(now - 86_400)
    .run();
  await env.DB.prepare("DELETE FROM mobile_auth_sessions WHERE expires_at < ? OR revoked_at < ?")
    .bind(now - 86_400, now - 30 * 24 * 60 * 60)
    .run();
  await env.DB.prepare(
    "DELETE FROM telegram_link_claims WHERE expires_at < ?",
  )
    .bind(now - 86_400)
    .run();
  await env.DB.prepare(
    `UPDATE telegram_invites SET status = 'expired'
      WHERE status = 'pending' AND expires_at <= ?`,
  )
    .bind(now)
    .run();
  await env.DB.prepare(
    "DELETE FROM telegram_invites WHERE expires_at < ? AND status != 'pending'",
  )
    .bind(now - 2_592_000)
    .run();

  const { results = [] } = await env.DB.prepare(
    `SELECT whop_user_id, telegram_user_id, telegram_chat_id, membership_state, telegram_state
       FROM telegram_accounts ORDER BY linked_at`,
  ).all<AccountRow>();

  for (let index = 0; index < results.length; index += 100) {
    const batch = results.slice(index, index + 100);
    const states = await membershipsFor(env, batch.map((account) => account.whop_user_id));
    for (const account of batch) {
      const state = states[account.whop_user_id];
      if (state === "unknown") {
        console.warn("[telegram reconcile] a membership could not be verified; access state was left unchanged");
        continue;
      }
      await syncAccount(env, account.whop_user_id, state === "active" || state === "trialing");
    }
  }
}

async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);

  try {
    if (url.pathname === "/telegram/webhook" && request.method === "POST") {
      return await handleTelegramWebhook(env, request);
    }

    if (url.pathname === "/v1/link-requests" && request.method === "POST") {
      return await createLinkRequestRoute(env, request);
    }

    if (url.pathname === "/v1/members/sync" && request.method === "POST") {
      return await syncMemberRoute(env, request);
    }

    const mobileAuthMatch = url.pathname.match(/^\/v1\/mobile-auth\/(codes|exchange|resolve|update|revoke)$/);
    if (mobileAuthMatch && request.method === "POST") {
      return await mobileAuthRoute(
        env,
        request,
        mobileAuthMatch[1] as "codes" | "exchange" | "resolve" | "update" | "revoke",
      );
    }

    if (url.pathname === "/health" && request.method === "GET") {
      return json({ status: "ok" });
    }

    return json({ error: "not_found" }, 404);
  } catch (error) {
    const code = error instanceof GatewayError ? error.code : "gateway_request_failed";
    console.error(`[telegram gateway] ${code}`);
    return json({ error: code }, error instanceof GatewayError ? error.status : 503);
  }
}

const worker = {
  fetch(request: Request, env: Env): Promise<Response> {
    return handleRequest(request, env);
  },

  scheduled(
    _controller: ScheduledController,
    env: Env,
    context: ExecutionContext,
  ): void {
    context.waitUntil(
      reconcile(env).catch((error: unknown) => {
        const code = error instanceof GatewayError ? error.code : "reconcile_failed";
        console.error(`[telegram reconcile] ${code}`);
      }),
    );
  },
};

export default worker;
