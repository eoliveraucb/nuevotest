/**
 * Unified auth + privacy API used by the whole app.
 *
 * Two backends behind the same interface:
 *  - supabase : real Postgres/Auth (see supabase/schema.sql for tables + RLS)
 *  - mock     : localStorage simulation so the feature is fully usable without
 *               any Supabase project configured (AUTH_MODE === "mock").
 *
 * The mock is deliberately small: users + privacy rows stored under a single
 * localStorage key, session under another. Nothing here talks to a network.
 */
import { supabase, isSupabaseConfigured, AUTH_MODE } from "./supabase.js";

const MOCK_DB_KEY = "ife.mock.db";
const MOCK_SESSION_KEY = "ife.mock.session";

export const ROLES = ["student", "teacher", "admin"];

function readMockDb() {
  try {
    return JSON.parse(localStorage.getItem(MOCK_DB_KEY)) || { users: {}, privacy: {} };
  } catch {
    return { users: {}, privacy: {} };
  }
}

function writeMockDb(db) {
  localStorage.setItem(MOCK_DB_KEY, JSON.stringify(db));
}

function makeId() {
  return `mock-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Mock-mode only: tell the app (AuthContext) that the localStorage session
 * changed. Real Supabase fires its own auth state changes through the client,
 * so this is a no-op in Supabase mode.
 */
function notifyAuthChanged() {
  if (isSupabaseConfigured) return;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("ife:auth-changed"));
  }
}

function mockSession() {
  const email = localStorage.getItem(MOCK_SESSION_KEY);
  if (!email) return null;
  const db = readMockDb();
  const user = db.users[email.toLowerCase()];
  if (!user) {
    localStorage.removeItem(MOCK_SESSION_KEY);
    return null;
  }
  return { user: { id: user.id, email: user.email } };
}

/* -------------------------------------------------------------------------- */
/* auth                                                                        */
/* -------------------------------------------------------------------------- */

export const authMode = AUTH_MODE;

export function isAuthConfigured() {
  return isSupabaseConfigured;
}

export async function getInitialSession() {
  if (supabase) {
    const { data, error } = await supabase.auth.getSession();
    if (error) return null;
    return data.session;
  }
  return mockSession();
}

/**
 * cb(session | null). Returns an unsubscribe function.
 */
export function onAuthStateChange(cb) {
  if (supabase) {
    const { data } = supabase.auth.onAuthStateChange((_event, session) =>
      cb(session)
    );
    return () => data.subscription.unsubscribe();
  }
  return () => {};
}

export async function signUp({ email, password, role, studentId }) {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !password) {
    return { error: { message: "Email and password are required." } };
  }
  if (!ROLES.includes(role)) {
    return { error: { message: "Please choose a valid role." } };
  }

  if (supabase) {
    const { data, error } = await supabase.auth.signUp({
      email: normalized,
      password,
    });
    if (error) return { error };
    if (!data.user) return { error: { message: "No user returned." } };
    const profile = {
      id: data.user.id,
      email: normalized,
      role,
      student_id: studentId || null,
    };
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(profile);
    return { error: profileError };
  }

  const db = readMockDb();
  if (db.users[normalized]) {
    return { error: { message: "An account with that email already exists." } };
  }
  db.users[normalized] = {
    id: makeId(),
    email: normalized,
    password,
    role,
    student_id: studentId || null,
  };
  writeMockDb(db);
  localStorage.setItem(MOCK_SESSION_KEY, normalized);
  notifyAuthChanged();
  return { error: null };
}

export async function signInWithPassword({ email, password }) {
  const normalized = (email || "").trim().toLowerCase();
  if (supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalized,
      password,
    });
    if (error) return { error };
    return { data, error: null };
  }

  const db = readMockDb();
  const user = db.users[normalized];
  if (!user || user.password !== password) {
    return { error: { message: "Invalid email or password." } };
  }
  localStorage.setItem(MOCK_SESSION_KEY, normalized);
  notifyAuthChanged();
  return { error: null };
}

export async function signInWithMagicLink({ email }) {
  const normalized = (email || "").trim().toLowerCase();
  if (supabase) {
    const { error } = await supabase.auth.signInWithOtp({ email: normalized });
    return { error };
  }

  const db = readMockDb();
  const user = db.users[normalized];
  if (!user) {
    return {
      error: {
        message: "No account found for that email. Sign up first.",
        code: "no_account",
      },
    };
  }
  localStorage.setItem(MOCK_SESSION_KEY, normalized);
  notifyAuthChanged();
  return { error: null };
}

export async function signOut() {
  if (supabase) {
    const { error } = await supabase.auth.signOut();
    return { error };
  }
  localStorage.removeItem(MOCK_SESSION_KEY);
  notifyAuthChanged();
  return { error: null };
}

/* -------------------------------------------------------------------------- */
/* profiles (role + student link)                                              */
/* -------------------------------------------------------------------------- */

export async function fetchProfile(session) {
  if (!session?.user) return null;
  if (supabase) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .maybeSingle();
    if (error || !data) return null;
    return {
      id: data.id,
      email: data.email,
      role: data.role,
      student_id: data.student_id,
    };
  }

  const db = readMockDb();
  const user = db.users[session.user.email.toLowerCase()];
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    student_id: user.student_id || null,
  };
}

/* -------------------------------------------------------------------------- */
/* privacy settings                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Full map of studentId -> { visibility, allowed_emails } from the backend.
 * Defaults to "everyone" for students with no row (preserves today's behavior
 * where nothing is hidden until a student opts in).
 */
export async function fetchPrivacyMap() {
  if (supabase) {
    const { data, error } = await supabase.from("privacy_settings").select("*");
    if (error) return {};
    const map = {};
    for (const row of data || []) {
      map[row.student_id] = {
        visibility: row.visibility || "everyone",
        allowed_emails: row.allowed_emails || [],
      };
    }
    return map;
  }

  const db = readMockDb();
  return db.privacy || {};
}

export async function savePrivacy(studentId, settings) {
  const payload = {
    student_id: studentId,
    visibility: settings.visibility || "everyone",
    allowed_emails: settings.allowed_emails || [],
  };

  if (supabase) {
    const { error } = await supabase.from("privacy_settings").upsert(payload);
    if (error) return { error };
    return { error: null };
  }

  const db = readMockDb();
  db.privacy = db.privacy || {};
  db.privacy[studentId] = payload;
  writeMockDb(db);
  return { error: null };
}

/* -------------------------------------------------------------------------- */
/* accounts management (admin only — the /admin "Accounts" tab)               */
/* -------------------------------------------------------------------------- */

/**
 * List every user profile. In Supabase mode this relies on the RLS policy that
 * lets staff read all profiles; in mock mode it reads the local user store.
 */
export async function listProfiles() {
  if (supabase) {
    const { data, error } = await supabase.from("profiles").select("*");
    if (error) return { error, profiles: [] };
    return {
      profiles: (data || []).map((p) => ({
        id: p.id,
        email: p.email,
        role: p.role,
        student_id: p.student_id,
      })),
      error: null,
    };
  }
  const db = readMockDb();
  return {
    profiles: Object.values(db.users).map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      student_id: u.student_id || null,
    })),
    error: null,
  };
}

/** Update a user's role and/or linked student (admins only). */
export async function updateProfile(userId, patch) {
  const fields = {};
  if (patch.role !== undefined) fields.role = patch.role;
  if (patch.student_id !== undefined) fields.student_id = patch.student_id;

  if (supabase) {
    const { data, error } = await supabase
      .from("profiles")
      .update(fields)
      .eq("id", userId)
      .select("id, email, role, student_id");
    if (error) return { error };
    return {
      profile: data?.[0] || null,
      error: null,
    };
  }

  const db = readMockDb();
  const user = Object.values(db.users).find((u) => u.id === userId);
  if (!user) return { error: { message: "No such account." } };
  if (fields.role !== undefined) user.role = fields.role;
  if ("student_id" in fields) user.student_id = fields.student_id;
  writeMockDb(db);
  return { profile: user, error: null };
}

/* -------------------------------------------------------------------------- */
/* demo helpers (mock mode only)                                               */
/* -------------------------------------------------------------------------- */

/**
 * Seeds a few demo accounts so the flow can be tested with one click.
 * In production teacher/admin accounts are created by an administrator —
 * the demo convenience does not exist in Supabase mode.
 */
export function ensureMockDemoAccounts() {
  if (supabase) return;
  const db = readMockDb();
  const seed = [
    { email: "admin@ife.demo", password: "password", role: "admin", student_id: null },
    { email: "teacher@ife.demo", password: "password", role: "teacher", student_id: null },
  ];
  for (const s of seed) {
    if (!db.users[s.email]) {
      db.users[s.email] = { id: makeId(), ...s };
    }
  }
  writeMockDb(db);
}