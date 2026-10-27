import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getLusAuthEnv } from "@/lib/env";
import type { Database } from "./database.types";

/** Server-only client for private profile lookups and Whop account records. */
export function createSupabaseAdminClient() {
  const env = getLusAuthEnv();
  return createClient<Database>(env.url, env.secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
