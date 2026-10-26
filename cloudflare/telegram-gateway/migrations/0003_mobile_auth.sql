CREATE TABLE IF NOT EXISTS mobile_auth_codes (
  code_hash TEXT PRIMARY KEY,
  session_payload TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS mobile_auth_codes_expiry_idx
  ON mobile_auth_codes(expires_at);

CREATE TABLE IF NOT EXISTS mobile_auth_sessions (
  session_hash TEXT PRIMARY KEY,
  session_payload TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  revoked_at INTEGER
);

CREATE INDEX IF NOT EXISTS mobile_auth_sessions_expiry_idx
  ON mobile_auth_sessions(expires_at);
