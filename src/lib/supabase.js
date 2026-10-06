import { createClient } from "@supabase/supabase-js";

/**
 * Thin wrapper around the Supabase client.
 *
 * The app works in two modes:
 *  - "supabase" when VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY are set:
 *    real Postgres + Auth + Row Level Security.
 *  - "mock" otherwise: everything is simulated in localStorage so the whole
 *    accounts/privacy flow can be built and demoed before any backend exists.
 *    See src/lib/auth.js for the mock implementation.
 */
export const isSupabaseConfigured = Boolean(
  typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_SUPABASE_URL &&
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const AUTH_MODE = isSupabaseConfigured ? "supabase" : "mock";