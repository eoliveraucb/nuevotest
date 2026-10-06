/**
 * Real-data import script for the IFE Summer 2026 cohort.
 *
 * Reads the raw platform export (raw-data/ife-summer-2026-submissions.csv) and produces
 * every JSON file the site needs in src/data/programs/ife-summer-2026/.
 *
 * The parsing/build logic lives in src/lib/importFromCsv.js (browser-safe, reused
 * by the /admin "Import data" tab). This script only handles file I/O and logging.
 *
 * Data sources used from the raw CSV:
 *   - Checkpoint 1 "Onboarding Survey"      -> pre-program skill self-ratings (42 Qs)
 *   - Checkpoint 8 "Final Exit Survey"      -> post-program skill self-ratings (42 Qs)
 *   - Checkpoint 5 "IFE Midway Survey"      -> self-reflection + peer evaluation of teammates
 *
 * Run with: node scripts/importRealData.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parse } from "csv-parse/sync";
import { renderProgramData } from "../src/lib/importFromCsv.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const CSV_PATH = path.join(ROOT, "raw-data", "ife-summer-2026-submissions.csv");
const OUT_DIR = path.join(ROOT, "src", "data", "programs", "ife-summer-2026");

const raw = fs.readFileSync(CSV_PATH, "utf-8");
const rows = parse(raw, { columns: true, skip_empty_lines: true });
console.log(`Loaded ${rows.length} submission rows from raw CSV.`);

const { files, diagnostics } = renderProgramData(rows);

console.log(
  `Onboarding rows: ${diagnostics.onboardingCount}, Exit rows: ${diagnostics.exitCount}, Midway rows: ${diagnostics.midwayCount}`
);
console.log(`Built roster: ${files["students.json"].length} students across ${files["teams.json"].length} teams.`);

console.log("\nSurvey coverage:");
console.log("  Both onboarding + exit:", diagnostics.missingSurvey.both);
console.log("  Onboarding only:", diagnostics.missingSurvey.onboardingOnly);
console.log("  Exit only:", diagnostics.missingSurvey.exitOnly);
console.log("  Neither (no skill data):", diagnostics.missingSurvey.neither);

console.log(`\nSelf reflections captured: ${diagnostics.selfReflectionCount}`);
console.log(`Students with peer feedback received: ${diagnostics.peerReviewCount}`);

if (process.env.DEBUG_STUDENT) {
  const { buildRoster, buildMidwayData, findRows } = await import("../src/lib/importFromCsv.js");
  const { roster, studentIdByName } = buildRoster();
  const midwayRows = findRows(rows, {
    checkpoint: "5 Startup Experimentation",
    lesson: "9 IFE Midway Survey",
    prompt: "1 Mid-point Survey Questions",
  });
  const { peerFeedbackReceived } = buildMidwayData({ roster, studentIdByName, midwayRows });
  const debugId = studentIdByName.get(process.env.DEBUG_STUDENT);
  const blocks = peerFeedbackReceived.get(debugId) || [];
  console.log(`\n[DEBUG] ${blocks.length} blocks received for ${process.env.DEBUG_STUDENT}:`);
  blocks.forEach((b, i) => {
    const vals = Object.entries(b.fieldsByPos).map(([p, f]) => `[${p}]${f.slice(0, 40)}`);
    console.log(`  Block ${i + 1} (from ${b.from}):`, vals);
  });
}
if (diagnostics.unmatchedMentions.length) {
  console.log(`\n${diagnostics.unmatchedMentions.length} text fragments before any name match (informational, usually harmless):`);
  diagnostics.unmatchedMentions.slice(0, 5).forEach((m) => console.log("  ", m.student, "->", m.text));
}

// ---------------------------------------------------------------------------
// Write files
// ---------------------------------------------------------------------------
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

Object.entries(files).forEach(([filename, data]) => {
  fs.writeFileSync(path.join(OUT_DIR, filename), JSON.stringify(data, null, 2));
  console.log("Wrote", filename);
});

console.log("\nDone. Real data written to", OUT_DIR);