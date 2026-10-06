/**
 * Central data access layer — program-aware and now admin-editable.
 *
 * Real program data lives in ./programs/<program-id>/*.json. This module
 * loads whichever program is marked "active" in ./programs.json and exposes
 * the exact same helper API regardless of which program is active, so
 * components never need to change when a new cohort's data is added.
 *
 * The /admin editor persists overrides through src/lib/content.js and pushes
 * them in here via applyProgramField() / applyRegistry() — the exported data
 * consts are live bindings, so saved edits are reflected the next time any
 * page renders. Overrides are a thin layer on top of the bundled JSON.
 */
import programsRegistry from "./programs.json";

// Eagerly load every JSON file from every program folder at build time.
const modules = import.meta.glob("./programs/*/*.json", { eager: true });

function loadProgramData(programId) {
  const prefix = `./programs/${programId}/`;
  const data = {};
  for (const [filePath, mod] of Object.entries(modules)) {
    if (!filePath.startsWith(prefix)) continue;
    const filename = filePath.slice(prefix.length).replace(/\.json$/, "");
    data[filename] = mod.default ?? mod;
  }
  return data;
}

export const availablePrograms = programsRegistry;
export let currentProgram =
  programsRegistry.find((p) => p.active) || programsRegistry[0];

let active = loadProgramData(currentProgram.id);

export let skills = active.skills || [];
export let teams = active.teams || [];
export let students = active.students || [];
export let skillScores = active.skillScores || [];
export let peerReviews = active.peerReviews || [];
export let glowsGrows = active.glowsGrows || [];
export let selfReflections = active.selfReflections || [];
export let story = active.story || { hero: {}, chapters: [] };
export let conclusions = active.conclusions || { stats: [], keyFindings: [] };
export let checkpoints = active.checkpoints || [];

// programId -> { field: data } for admin-saved overrides (live layer).
const overrides = {};

const ARRAY_FIELDS = [
  "skills",
  "teams",
  "students",
  "skillScores",
  "peerReviews",
  "glowsGrows",
  "selfReflections",
  "checkpoints",
];

function applyField(field, data) {
  if (field === "story") {
    Object.assign(story, data || { hero: {}, chapters: [] });
    return;
  }
  if (field === "conclusions") {
    Object.assign(conclusions, data || { stats: [], keyFindings: [] });
    return;
  }
  if (ARRAY_FIELDS.includes(field)) {
    const target = {
      skills,
      teams,
      students,
      skillScores,
      peerReviews,
      glowsGrows,
      selfReflections,
      checkpoints,
    }[field];
    const next = Array.isArray(data) ? data : [];
    target.splice(0, target.length, ...next);
  }
}

/**
 * Save an admin edit for a program. Mutates the live exports immediately (so
 * the next render shows it) and stores it for persistence/hydration.
 */
export function applyProgramField(programId, field, data) {
  overrides[programId] = overrides[programId] || {};
  if (data === null || data === undefined) {
    delete overrides[programId][field];
  } else {
    overrides[programId][field] = data;
  }
  if (programId === currentProgram.id) applyField(field, data);
}

/** Swap which program is active and re-hydrate exports (bundled + overrides). */
export function setActiveProgram(programId) {
  const registered = programsRegistry.find((p) => p.id === programId);
  if (!registered) return false;
  programsRegistry.forEach((p) => {
    p.active = p.id === programId;
  });
  currentProgram = registered;

  active = loadProgramData(programId);
  skills = active.skills || [];
  teams = active.teams || [];
  students = active.students || [];
  skillScores = active.skillScores || [];
  peerReviews = active.peerReviews || [];
  glowsGrows = active.glowsGrows || [];
  selfReflections = active.selfReflections || [];
  story = active.story || { hero: {}, chapters: [] };
  conclusions = active.conclusions || { stats: [], keyFindings: [] };
  checkpoints = active.checkpoints || [];

  const progOverrides = overrides[programId];
  if (progOverrides) {
    for (const [field, data] of Object.entries(progOverrides)) {
      if (data !== undefined) applyField(field, data);
    }
  }
  return true;
}

/**
 * Apply a full programs registry (from the admin "Programs" tab or a saved
 * site_content "registry" row). Adds/removes entries and activates the
 * active one — effectively creating new programs without code changes.
 */
export function applyRegistry(registry) {
  if (!Array.isArray(registry) || registry.length === 0) return false;
  programsRegistry.forEach((p, i) => {
    const next = registry[i] || p;
    p.id = next.id;
    p.label = next.label;
    p.active = Boolean(next.active);
  });
  // Grow/shrink the shared array to match the saved registry.
  programsRegistry.splice(registry.length, programsRegistry.length - registry.length);
  while (programsRegistry.length < registry.length) {
    const r = registry[programsRegistry.length];
    programsRegistry.push({ id: r.id, label: r.label, active: Boolean(r.active) });
  }

  const activeId = programsRegistry.find((p) => p.active)?.id;
  setActiveProgram(activeId || programsRegistry[0].id);
  return true;
}

const TEAM_COLOR_COUNT = 9;
export const teamColor = (colorIndex) =>
  `var(--team-color-${colorIndex % TEAM_COLOR_COUNT})`;

export function getTeamById(teamId) {
  return teams.find((t) => t.id === teamId);
}

export function getStudentById(studentId) {
  return students.find((s) => s.id === studentId);
}

export function getStudentsForTeam(teamId) {
  const team = getTeamById(teamId);
  if (!team) return [];
  return team.memberIds.map((id) => getStudentById(id)).filter(Boolean);
}

export function getSkillScoresForStudent(studentId) {
  return skillScores
    .filter((r) => r.studentId === studentId)
    .sort((a, b) => checkpoints.indexOf(a.checkpoint) - checkpoints.indexOf(b.checkpoint));
}

/** A student's single Midway peer-feedback snapshot (name, comments, count), if any. */
export function getPeerReviewForStudent(studentId) {
  return peerReviews.find((r) => r.studentId === studentId) || null;
}

/** A student's single Midway glows/grows snapshot, if any. */
export function getGlowsGrowsForStudent(studentId) {
  return glowsGrows.find((r) => r.studentId === studentId) || null;
}

export function getSelfReflectionForStudent(studentId) {
  return selfReflections.find((r) => r.studentId === studentId) || null;
}

export function getSkillById(skillId) {
  return skills.find((s) => s.id === skillId);
}

/** Average a skill across all students who have data at a given checkpoint. */
export function getAverageSkillAtCheckpoint(skillId, checkpoint) {
  const rows = skillScores.filter((r) => r.checkpoint === checkpoint);
  const values = rows.map((r) => r.scores[skillId]).filter((v) => v != null);
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** Average overall (all skills) score for a student at a checkpoint. */
export function getOverallScoreForStudent(studentId, checkpoint) {
  const row = skillScores.find(
    (r) => r.studentId === studentId && r.checkpoint === checkpoint
  );
  if (!row) return null;
  const values = Object.values(row.scores);
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** Average overall score for a whole team at a checkpoint (only counts students with data). */
export function getOverallScoreForTeam(teamId, checkpoint) {
  const memberIds = getTeamById(teamId)?.memberIds || [];
  const values = memberIds
    .map((id) => getOverallScoreForStudent(id, checkpoint))
    .filter((v) => v != null);
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * A team's average growth (last checkpoint minus first) — used by the Team
 * Race visual. Returns null if there isn't enough data for that team yet.
 */
export function getTeamGrowth(teamId) {
  if (checkpoints.length < 2) return null;
  const first = getOverallScoreForTeam(teamId, checkpoints[0]);
  const last = getOverallScoreForTeam(teamId, checkpoints[checkpoints.length - 1]);
  if (first == null || last == null) return null;
  return { first, last, delta: last - first };
}

/** Whether a student has complete data for every skill checkpoint. */
export function hasFullSkillData(studentId) {
  const student = getStudentById(studentId);
  if (!student) return false;
  if (student.hasOnboarding != null || student.hasExit != null) {
    return Boolean(student.hasOnboarding && student.hasExit);
  }
  return checkpoints.every((cp) =>
    skillScores.some((r) => r.studentId === studentId && r.checkpoint === cp)
  );
}

/** Class-wide average skill scores at the first checkpoint (onboarding view). */
export function getOnboardingSkillAverages() {
  const firstCheckpoint = checkpoints[0];
  return skills.map((sk) => ({
    skill: sk,
    value: getAverageSkillAtCheckpoint(sk.id, firstCheckpoint),
  }));
}

/** Class-wide skill averages per checkpoint, for the growth trend chart. */
export function getGrowthSeries() {
  return skills.map((sk) => ({
    skill: sk,
    series: checkpoints.map((cp) => ({
      checkpoint: cp,
      value: getAverageSkillAtCheckpoint(sk.id, cp),
    })),
  }));
}