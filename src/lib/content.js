/**
 * Editable site content store — the persistence layer behind the /admin
 * editor. Mirrors the two-backend pattern of src/lib/auth.js:
 *
 *  - mock mode : one localStorage blob (life.demo content keyed by program)
 *  - supabase   : the `site_content` table — one row per `<programId>:<field>`,
 *                 plus a "registry" row for the programs list. Staff have RLS
 *                 write access; everyone can read (public site renders edits).
 *
 * Only fields actually saved are stored, so a program's data is a thin
 * override layer on top of the bundled JSON (src/data/index.js merges them).
 */
import { supabase } from "./supabase.js";

const MOCK_KEY = "ife.mock.content";

function readMock() {
  try {
    return (
      JSON.parse(localStorage.getItem(MOCK_KEY)) || { programs: {}, registry: null }
    );
  } catch {
    return { programs: {}, registry: null };
  }
}

function writeMock(store) {
  localStorage.setItem(MOCK_KEY, JSON.stringify(store));
}

/** Load the whole editable store (per-program fields + the programs registry). */
export async function loadContentStore() {
  if (supabase) {
    const { data, error } = await supabase.from("site_content").select("key, payload");
    if (error) return { programs: {}, registry: null };
    const programs = {};
    let registry = null;
    for (const row of data || []) {
      if (row.key === "registry") {
        registry = row.payload;
        continue;
      }
      const [programId, field] = row.key.split(":", 2);
      if (!programId || !field) continue;
      programs[programId] = programs[programId] || {};
      programs[programId][field] = row.payload;
    }
    return { programs, registry };
  }
  return readMock();
}

/** Persist one program's field (e.g. ("ife-summer-2026", "story", {...})). */
export async function saveProgramField(programId, field, payload) {
  if (supabase) {
    // RLS allows staff inserts/updates; everyone can select.
    const { error } = await supabase.from("site_content").upsert(
      { key: `${programId}:${field}`, payload, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );
    return { error };
  }
  const store = readMock();
  store.programs = store.programs || {};
  store.programs[programId] = store.programs[programId] || {};
  store.programs[programId][field] = payload;
  writeMock(store);
  return { error: null };
}

/** Persist the programs registry (list + which program is active). */
export async function saveRegistry(registry) {
  if (supabase) {
    const { error } = await supabase.from("site_content").upsert(
      { key: "registry", payload: registry, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );
    return { error };
  }
  const store = readMock();
  store.registry = registry;
  writeMock(store);
  return { error: null };
}

export const isContentEditableInSupabase = true; // staff-only via RLS