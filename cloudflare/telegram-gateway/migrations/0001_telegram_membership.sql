CREATE TABLE IF NOT EXISTS telegram_link_claims (
  whop_user_id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  consumed_at INTEGER
);

CREATE INDEX IF NOT EXISTS telegram_link_claims_expiry_idx
  ON telegram_link_claims(expires_at);

CREATE TABLE IF NOT EXISTS telegram_accounts (
  whop_user_id TEXT PRIMARY KEY,
  telegram_user_id TEXT NOT NULL UNIQUE,
  telegram_chat_id TEXT NOT NULL,
  membership_state TEXT NOT NULL CHECK (membership_state IN ('active', 'inactive')),
  telegram_state TEXT NOT NULL CHECK (telegram_state IN ('pending', 'joined', 'left', 'banned', 'granting', 'revoking')),
  linked_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS telegram_invites (
  invite_link TEXT PRIMARY KEY,
  whop_user_id TEXT NOT NULL,
  telegram_user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'declined', 'revoked', 'expired'))
);

CREATE INDEX IF NOT EXISTS telegram_invites_account_idx
  ON telegram_invites(whop_user_id, status);

CREATE INDEX IF NOT EXISTS telegram_invites_expiry_idx
  ON telegram_invites(expires_at);
