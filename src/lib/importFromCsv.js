/**
 * Pure, browser-safe port of the real-data import pipeline.
 *
 * Every function here is deterministic and free of Node-only APIs, so the
 * exact same code path runs in:
 *  - `node scripts/importRealData.mjs` (build-time regeneration), and
 *  - the /admin "Import data" tab (in-browser upload for content managers).
 *
 * The algorithm was lifted wholesale from scripts/importRealData.mjs — keep
 * both in sync by defaulting reviewers to this file. Only the fs/console
 * plumbing lives in the script.
 *
 * Input: parsed CSV rows (array of plain objects with the platform's column
 * headers, e.g. "Checkpoint", "Lesson", "Prompt", "Student Name", "Answer 1..42").
 * Output: the full set of program data files plus diagnostics.
 */
import {
  TEAMS,
  SKILL_CATEGORIES,
  CHECKPOINTS,
} from "../../scripts/realDataConstants.mjs";

export const ANSWER_COLS = Array.from({ length: 42 }, (_, i) => `Answer ${i + 1}`);

// Matches the platform's literal placeholder as well as common "no answer"
// variants students typed themselves (N/A, none, no, -, etc). These must be
// treated as blank BEFORE name-matching / position-tracking, not just
// filtered out later — otherwise short tokens like "N/A" can accidentally
// fuzzy-match a short name (e.g. "n/a" is edit-distance 2 from "ava").
const BLANK_PATTERN = /^(\(not submitted\)|n\s*\/?\s*a\.?|none\.?|no\.?|nope\.?|nah\.?|-+|\.)$/i;
export function isNotSubmitted(v) {
  if (v == null) return true;
  const s = String(v).trim();
  return s === "" || BLANK_PATTERN.test(s);
}

export function isNumeric15(v) {
  if (isNotSubmitted(v)) return false;
  return /^[1-5](\.0)?$/.test(String(v).trim());
}

export function toNum(v) {
  return parseFloat(String(v).trim());
}

export function slugify(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Build the student roster from the constant teams; returns ids, names, slugs. */
export function buildRoster(teams = TEAMS) {
  const roster = [];
  const studentIdByName = new Map();
  let counter = 0;
  for (const team of teams) {
    for (const name of team.members) {
      counter += 1;
      const id = `s${String(counter).padStart(3, "0")}`;
      roster.push({ id, name: name.trim(), teamId: team.id, slug: slugify(name) });
      studentIdByName.set(name.trim(), id);
    }
  }
  return { roster, studentIdByName };
}

/** Limit a set of parsed rows to a single checkpoint/lesson/prompt triple. */
export function findRows(rows, { checkpoint, lesson, prompt }) {
  return rows.filter(
    (r) =>
      String(r.Checkpoint).trim() === checkpoint &&
      String(r.Lesson).trim() === lesson &&
      String(r.Prompt).trim() === prompt
  );
}

function computeSkillScoresForRow(row) {
  const scores = {};
  for (const cat of SKILL_CATEGORIES) {
    const [start, end] = cat.range;
    const vals = [];
    for (let i = start; i <= end; i++) {
      const v = row[ANSWER_COLS[i - 1]];
      if (isNumeric15(v)) vals.push(toNum(v));
    }
    if (vals.length > 0) {
      scores[cat.id] = parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2));
    }
  }
  return scores;
}

/**
 * Map every student to their (possibly missing) Onboarding/Exit survey rows
 * and produce skillScores + a coverage report.
 */
export function buildSkillScores({ roster, onboardingRows, exitRows }) {
  const skillScores = [];
  const missingSurvey = { onboardingOnly: [], exitOnly: [], both: 0, neither: [] };

  for (const student of roster) {
    const onboardRow = onboardingRows.find((r) => String(r["Student Name"]).trim() === student.name);
    const exitRow = exitRows.find((r) => String(r["Student Name"]).trim() === student.name);

    if (onboardRow) {
      skillScores.push({
        studentId: student.id,
        checkpoint: "Onboarding",
        scores: computeSkillScoresForRow(onboardRow),
      });
    }
    if (exitRow) {
      skillScores.push({
        studentId: student.id,
        checkpoint: "Exit",
        scores: computeSkillScoresForRow(exitRow),
      });
    }

    if (onboardRow && exitRow) missingSurvey.both += 1;
    else if (onboardRow && !exitRow) missingSurvey.onboardingOnly.push(student.name);
    else if (!onboardRow && exitRow) missingSurvey.exitOnly.push(student.name);
    else missingSurvey.neither.push(student.name);
  }

  return { skillScores, missingSurvey };
}

const SELF_REFLECTION_LABELS = [
  "goingWell",
  "challenge",
  "collaboration",
  "toolsResources",
  "otherThoughts",
];

// A tiny number of teammate mentions were too garbled for safe fuzzy matching
// at a conservative edit-distance threshold (loosening the threshold globally
// risks false-positive matches elsewhere). Handled explicitly instead.
const MANUAL_NAME_OVERRIDES = {
  ereuments: "Erumena Izeghe",
};

function normalizeName(s) {
  return s
    .toLowerCase()
    .replace(/[.,]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function firstToken(s) {
  return normalizeName(s).split(" ")[0] || "";
}

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}

/**
 * Fuzzy-match a free-text name mention (could be a bare name, a full sentence
 * restating the question, or a typo) to one of a student's known teammates.
 * Only ever matches against that student's small set of real teammates, so
 * false positives are effectively impossible.
 */
export function matchTeammate(mention, candidates) {
  const norm = normalizeName(mention);
  if (!norm) return null;

  if (MANUAL_NAME_OVERRIDES[norm] && candidates.includes(MANUAL_NAME_OVERRIDES[norm])) {
    return MANUAL_NAME_OVERRIDES[norm];
  }

  const mentionWords = norm.split(" ").filter(Boolean);

  for (const c of candidates) {
    if (normalizeName(c) === norm) return c;
  }

  for (const c of candidates) {
    const cTokens = normalizeName(c).split(" ").filter(Boolean);
    if (cTokens.length > 1 && cTokens.every((t) => mentionWords.includes(t))) return c;
  }

  for (const c of candidates) {
    const cTokens = normalizeName(c).split(" ").filter(Boolean);
    if (cTokens.some((t) => mentionWords.includes(t))) return c;
  }

  if (mentionWords.length <= 3) {
    for (const c of candidates) {
      const cFirst = firstToken(c);
      for (const w of mentionWords) {
        if (w.length < 3 || cFirst.length < 3) continue;
        if (cFirst.startsWith(w) || w.startsWith(cFirst)) return c;
      }
    }
  }

  if (mentionWords.length <= 3) {
    let best = null;
    let bestDist = Infinity;
    for (const c of candidates) {
      const cFirst = firstToken(c);
      for (const w of mentionWords) {
        const d = levenshtein(w, cFirst);
        if (d < bestDist) {
          bestDist = d;
          best = c;
        }
      }
    }
    if (best && bestDist <= 2) return best;
  }

  return null;
}

const JUNK_PATTERN =
  /^(n ?\/ ?a\.?|none\.?|no\.?|no one\.?|nobody\.?|nope\.?|nah\.?|na\.?|not really\.?|not at (the|this) moment\.?|n\/a|don'?t have (a |one )?(fourth|third|second)?\.?)$/i;
export function isJunkText(s) {
  if (!s) return true;
  const t = s.trim();
  if (t.length < 4) return true;
  return JUNK_PATTERN.test(t);
}

/**
 * Parse the Midway survey for every student: their own self-reflection and
 * the peer feedback they received (name-matched to real teammates).
 */
export function buildMidwayData({ roster, studentIdByName, midwayRows }) {
  const selfReflections = [];
  const peerFeedbackReceived = new Map();
  const unmatchedMentions = [];

  for (const student of roster) {
    const row = midwayRows.find((r) => String(r["Student Name"]).trim() === student.name);
    if (!row) continue;

    const reflection = { studentId: student.id, checkpoint: "Midway" };
    SELF_REFLECTION_LABELS.forEach((label, idx) => {
      const v = row[ANSWER_COLS[4 + idx]];
      if (!isNotSubmitted(v)) reflection[label] = String(v).trim();
    });
    if (Object.keys(reflection).length > 2) selfReflections.push(reflection);

    const team = TEAMS.find((t) => t.id === student.teamId);
    const candidates = team.members.filter((m) => m.trim() !== student.name);

    const FIELD_ORDER = ["didWell", "ideas", "growth", "workStyle", "shoutout"];
    let current = null;
    let pos = 0;

    for (let i = 10; i <= 42; i++) {
      const raw = row[ANSWER_COLS[i - 1]];
      if (isNumeric15(raw)) continue;

      const blank = isNotSubmitted(raw);
      const text = blank ? null : String(raw).trim();
      const matched = text ? matchTeammate(text, candidates) : null;

      const isNameLike = !!text && text.split(/\s+/).length <= 4;
      const midBlockIncomplete = !!current && pos > 0 && pos < FIELD_ORDER.length;
      const trustAsNameMarker = matched && (isNameLike || !midBlockIncomplete);

      if (trustAsNameMarker && current && current.about === matched) {
        continue;
      }
      if (trustAsNameMarker && (!current || current.about !== matched)) {
        current = { from: student.name, about: matched, fieldsByPos: {} };
        pos = 0;
        if (!peerFeedbackReceived.has(studentIdByName.get(matched))) {
          peerFeedbackReceived.set(studentIdByName.get(matched), []);
        }
        peerFeedbackReceived.get(studentIdByName.get(matched)).push(current);
        continue;
      }

      if (current) {
        if (pos < FIELD_ORDER.length) {
          if (text) current.fieldsByPos[pos] = text;
          pos++;
        }
      } else if (text) {
        unmatchedMentions.push({ student: student.name, text: text.slice(0, 60) });
      }
    }
  }

  const glowsGrows = [];
  const peerReviews = [];
  for (const student of roster) {
    const received = (peerFeedbackReceived.get(student.id) || []).filter((b) =>
      Object.values(b.fieldsByPos).some((f) => !isJunkText(f))
    );
    if (received.length === 0) continue;

    const glows = [];
    const grows = [];
    const comments = [];
    for (const block of received) {
      const didWell = block.fieldsByPos[0];
      const ideas = block.fieldsByPos[1];
      const growth = block.fieldsByPos[2];
      const workStyle = block.fieldsByPos[3];
      const shoutout = block.fieldsByPos[4];
      if (!isJunkText(didWell)) glows.push(didWell);
      if (!isJunkText(ideas)) glows.push(ideas);
      if (!isJunkText(growth)) grows.push(growth);
      if (!isJunkText(workStyle)) grows.push(workStyle);
      if (!isJunkText(shoutout)) comments.push(shoutout);
    }

    glowsGrows.push({
      studentId: student.id,
      checkpoint: "Midway",
      glows: glows.slice(0, 4),
      grows: grows.slice(0, 4),
    });
    peerReviews.push({
      studentId: student.id,
      checkpoint: "Midway",
      reviewerCount: received.length,
      comments: comments.slice(0, 4),
    });
  }

  return { selfReflections, glowsGrows, peerReviews, peerFeedbackReceived, unmatchedMentions };
}

function avg(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

/** Recompute the conclusions section from real skill growth numbers. */
export function deriveConclusions({ students, teams, skillScores }) {
  const onboardingScores = skillScores.filter((r) => r.checkpoint === "Onboarding");
  const exitScores = skillScores.filter((r) => r.checkpoint === "Exit");

  const overallPre = avg(onboardingScores.flatMap((r) => Object.values(r.scores)));
  const overallPost = avg(exitScores.flatMap((r) => Object.values(r.scores)));
  const pctGrowth = (((overallPost - overallPre) / overallPre) * 100).toFixed(0);

  const skillGrowth = SKILL_CATEGORIES.map((cat) => {
    const pre = avg(
      onboardingScores.map((r) => r.scores[cat.id]).filter((v) => v != null)
    );
    const post = avg(exitScores.map((r) => r.scores[cat.id]).filter((v) => v != null));
    return { skill: cat.name, pre, post, delta: post - pre };
  }).sort((a, b) => b.delta - a.delta);

  const finalists = teams.filter((t) => t.finalsRank).sort((a, b) => a.finalsRank - b.finalsRank);

  return {
    stats: [
      { label: "Students", value: String((students && students.length) || rosterCount(teams)) },
      { label: "Student-Led Businesses", value: String(teams.length) },
      { label: "Avg. Skill Growth", value: `+${pctGrowth}%` },
      { label: "Most Improved Skill", value: skillGrowth[0].skill },
    ],
    keyFindings: [
      `On average, students grew their self-assessed entrepreneurial skills by ${pctGrowth}% from onboarding to their final exit survey.`,
      `${skillGrowth[0].skill} saw the largest overall gains, followed by ${skillGrowth[1].skill}.`,
      `${teams.length} student-led businesses pitched for real, spanning healthcare access, civic literacy, urban sustainability, legal access, workforce development, nutrition, education, and food security.`,
      `At the Finals, ${finalists[0]?.name} took 1st place, with ${finalists[1]?.name}, ${finalists[2]?.name}, and ${finalists[3]?.name} rounding out the top 4.`,
    ],
    closingStatement:
      "The IFE program is proof that when students are trusted with real problems and real ownership, they rise to meet them. Cambio Labs and Prep for Prep didn't just teach entrepreneurship — they built confidence, leadership, and belief in what these students can accomplish next.",
    finalsRankings: finalists.map((t) => ({ rank: t.finalsRank, teamName: t.name })),
  };
}

function rosterCount(teams) {
  return teams.reduce((n, t) => n + (t.members ? t.members.length : t.memberIds?.length || 0), 0);
}

/** Default story copy — patched with real team counts. */
export function buildStory(teams) {
  return {
    hero: {
      kicker: "A Cambio Labs Impact Story",
      title: "From Idea to Impact",
      subtitle:
        "How students in the Institute for Entrepreneurship built real businesses — and grew right alongside them.",
      scrollCue: "Scroll to begin",
    },
    chapters: [
      {
        id: "cambio",
        heading: "Who is Cambio Labs?",
        body: "Cambio Labs is a nonprofit dedicated to cultivating the next generation of changemakers. Cambio — Spanish for \"change\" — reflects the organization's mission: equipping students with the entrepreneurial mindset and skills to turn the problems they see in their communities into real, sustainable solutions.",
      },
      {
        id: "prepforprep",
        heading: "Partnering with Prep for Prep",
        body: "Prep for Prep identifies talented students of color across New York City and prepares them for leadership at top independent schools and beyond. Together, Cambio Labs and Prep for Prep launched the Institute for Entrepreneurship (IFE) — a program designed to give students hands-on experience building something of their own.",
      },
      {
        id: "ife",
        heading: "What is the IFE Program?",
        body: "Over the course of the program, students are placed into small teams and challenged to design a business that creates real impact in their community. Guided by mentors, they move through ideation, market research, financial planning, and prototyping — culminating in a final pitch to a panel of judges.",
      },
      {
        id: "whattheydid",
        heading: "What the Students Did",
        body: `${teams.length} teams. ${teams.length} community problems. ${teams.length} businesses built from scratch — spanning healthcare access, civic and financial literacy, urban sustainability, legal access, workforce development, nutrition, education, and food security. Along the way, students didn't just build companies. They built skills: teamwork, community impact, financial acumen, and the confidence to pitch an idea to a room of judges.`,
      },
      {
        id: "transition",
        heading: "But building a business was only half the story.",
        body: "Students entered the IFE program with different strengths, experiences, and levels of confidence. Over the course of the program, they worked in teams, developed projects, received feedback, and applied new skills. This is what their growth looked like.",
      },
    ],
  };
}

/**
 * Master entry point. Given parsed CSV rows (platform export), build every
 * program data file the site needs — exactly like scripts/importRealData.mjs.
 */
export function renderProgramData(rows) {
  const onboardingRows = findRows(rows, {
    checkpoint: "1 Initiation",
    lesson: "3 Onboarding Survey",
    prompt: "4 Survey Questions",
  });
  const exitRows = findRows(rows, {
    checkpoint: "8 Final Launchpad",
    lesson: "2 Final Exit Survey",
    prompt: "3 Survey Questions",
  });
  const midwayRows = findRows(rows, {
    checkpoint: "5 Startup Experimentation",
    lesson: "9 IFE Midway Survey",
    prompt: "1 Mid-point Survey Questions",
  });

  const { roster, studentIdByName } = buildRoster();
  const { skillScores, missingSurvey } = buildSkillScores({
    roster,
    onboardingRows,
    exitRows,
  });
  const midway = buildMidwayData({ roster, studentIdByName, midwayRows });

  const teams = TEAMS.map((t, i) => ({
    id: t.id,
    name: t.name,
    tagline: t.tagline,
    businessIdea: t.businessIdea,
    impactArea: t.impactArea,
    colorIndex: i,
    finalsRank: t.finalsRank,
    memberIds: t.members.map((m) => studentIdByName.get(m.trim())),
  }));

  const students = roster.map((s) => ({
    id: s.id,
    name: s.name,
    teamId: s.teamId,
    hasOnboarding: onboardingRows.some((r) => String(r["Student Name"]).trim() === s.name),
    hasExit: exitRows.some((r) => String(r["Student Name"]).trim() === s.name),
  }));

  const skills = SKILL_CATEGORIES.map((c) => ({ id: c.id, name: c.name, description: "" }));
  const conclusions = deriveConclusions({ teams, skillScores });
  const story = buildStory(teams);

  return {
    files: {
      "skills.json": skills,
      "teams.json": teams,
      "students.json": students,
      "skillScores.json": skillScores,
      "checkpoints.json": CHECKPOINTS,
      "peerReviews.json": midway.peerReviews,
      "glowsGrows.json": midway.glowsGrows,
      "selfReflections.json": midway.selfReflections,
      "story.json": story,
      "conclusions.json": conclusions,
    },
    diagnostics: {
      rowCount: rows.length,
      onboardingCount: onboardingRows.length,
      exitCount: exitRows.length,
      midwayCount: midwayRows.length,
      missingSurvey,
      selfReflectionCount: midway.selfReflections.length,
      peerReviewCount: midway.peerReviews.length,
      unmatchedMentions: midway.unmatchedMentions,
    },
  };
}