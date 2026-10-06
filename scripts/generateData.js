/**
 * Placeholder data generator for the Cambio Labs x Prep for Prep IFE Dashboard.
 *
 * This script produces realistic, internally-consistent SAMPLE data so the full
 * site can be built and previewed before real program data is available.
 *
 * HOW TO REPLACE WITH REAL DATA:
 *   Each output file in /src/data/*.json documents its own schema at the top of
 *   this file. Once real data is ready, either:
 *     1) Replace the JSON files directly (keeping the same shape), or
 *     2) Point a new import script at CSV/Google Sheets exports that map to
 *        these same shapes, then re-run `node scripts/generateData.js` is NOT
 *        needed anymore — just overwrite the JSON in /src/data.
 *
 * Run with: node scripts/generateData.js
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "src", "data");

// ---------- Seeded RNG for reproducible placeholder data ----------
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260811);
const randInt = (min, max) => Math.floor(rand() * (max - min + 1)) + min;
const randFloat = (min, max, dp = 1) =>
  parseFloat((rand() * (max - min) + min).toFixed(dp));
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const pickMany = (arr, n) => {
  const copy = [...arr];
  const out = [];
  for (let i = 0; i < n && copy.length; i++) {
    out.push(copy.splice(Math.floor(rand() * copy.length), 1)[0]);
  }
  return out;
};
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ---------------------------------------------------------------------------
// SKILLS
// Schema: array of { id, name, description }
// These are the core entrepreneurship / professional competencies tracked
// across the IFE program.
// ---------------------------------------------------------------------------
const skills = [
  {
    id: "communication",
    name: "Communication",
    description: "Articulating ideas clearly to teammates, mentors, and audiences.",
  },
  {
    id: "leadership",
    name: "Leadership",
    description: "Taking initiative and guiding a team toward shared goals.",
  },
  {
    id: "problemSolving",
    name: "Problem Solving",
    description: "Identifying root causes and generating practical solutions.",
  },
  {
    id: "financialLiteracy",
    name: "Financial Literacy",
    description: "Understanding budgets, pricing, and business fundamentals.",
  },
  {
    id: "publicSpeaking",
    name: "Public Speaking",
    description: "Presenting confidently to investors, peers, and panels.",
  },
  {
    id: "teamwork",
    name: "Teamwork",
    description: "Collaborating effectively and resolving conflict within a team.",
  },
  {
    id: "businessStrategy",
    name: "Business Strategy",
    description: "Designing viable, impact-driven business models.",
  },
  {
    id: "confidence",
    name: "Confidence",
    description: "Self-assurance in pitching ideas and taking entrepreneurial risks.",
  },
];

const CHECKPOINTS = ["Pre-Program", "Mid-Program", "Final Pitch"];

// ---------------------------------------------------------------------------
// TEAMS
// Schema: array of {
//   id, name, tagline, businessIdea, impactArea, color, memberIds: []
// }
// ---------------------------------------------------------------------------
const teamSeed = [
  {
    id: "team-verdant",
    name: "Verdant Roots",
    tagline: "Growing food access, one rooftop at a time.",
    businessIdea:
      "A subscription service that installs and maintains small hydroponic gardens in NYC apartment buildings, selling fresh produce back to residents at below-market prices.",
    impactArea: "Food Access & Sustainability",
  },
  {
    id: "team-luma",
    name: "Luma Learning",
    tagline: "Peer tutoring that pays it forward.",
    businessIdea:
      "A near-peer tutoring marketplace where high schoolers earn stipends teaching middle schoolers, with proceeds reinvested into under-resourced classrooms.",
    impactArea: "Education Equity",
  },
  {
    id: "team-thread",
    name: "ThreadBack",
    tagline: "Turning fast fashion waste into first jobs.",
    businessIdea:
      "A textile upcycling cooperative that hires local youth to repair and resell donated clothing, splitting profits between workers and a re-investment fund.",
    impactArea: "Sustainability & Youth Employment",
  },
  {
    id: "team-pulse",
    name: "PulseCheck",
    tagline: "Mental health check-ins, built by teens for teens.",
    businessIdea:
      "A peer-support app pairing trained student ambassadors with classmates for anonymous, low-barrier mental health check-ins and resource referrals.",
    impactArea: "Youth Mental Health",
  },
];

// ---------------------------------------------------------------------------
// STUDENTS
// Schema: array of {
//   id, name, teamId, role, bio, avatarSeed
// }
// ---------------------------------------------------------------------------
const firstNames = [
  "Amara", "Jayden", "Sofia", "Marcus", "Layla", "Elijah", "Camila", "Isaiah",
  "Nia", "Xavier", "Destiny", "Malik", "Genesis", "Josiah", "Aaliyah", "Kwame",
  "Valentina", "Micah",
];
const lastInitials = ["R.", "T.", "M.", "B.", "C.", "D.", "S.", "L.", "P.", "W.", "F.", "G.", "H.", "J.", "K.", "N.", "O.", "V."];
const roles = ["Team Lead", "Finance Lead", "Design Lead", "Operations Lead", "Marketing Lead"];

const bioTemplates = [
  "Joined IFE wanting to turn a community problem into a real business plan.",
  "Came into the program shy about public speaking but curious about entrepreneurship.",
  "Has always been the organizer among friends and wanted to build real leadership skills.",
  "Interested in finance and wanted hands-on experience pricing and budgeting a product.",
  "Passionate about their community's needs and eager to design a solution from scratch.",
  "New to teamwork in a business setting, excited to learn how to pitch ideas.",
];

let studentCounter = 0;
const usedNames = new Set();
function makeStudentName() {
  let name;
  do {
    name = `${pick(firstNames)} ${pick(lastInitials)}`;
  } while (usedNames.has(name));
  usedNames.add(name);
  return name;
}

const teams = [];
const students = [];

teamSeed.forEach((t, ti) => {
  const teamSize = randInt(4, 5);
  const memberIds = [];
  const assignedRoles = pickMany(roles, teamSize);
  for (let i = 0; i < teamSize; i++) {
    const id = `s${String(++studentCounter).padStart(3, "0")}`;
    const name = makeStudentName();
    students.push({
      id,
      name,
      teamId: t.id,
      role: assignedRoles[i] || "Team Member",
      bio: pick(bioTemplates),
      avatarSeed: studentCounter,
    });
    memberIds.push(id);
  }
  teams.push({
    id: t.id,
    name: t.name,
    tagline: t.tagline,
    businessIdea: t.businessIdea,
    impactArea: t.impactArea,
    colorIndex: ti,
    memberIds,
  });
});

// ---------------------------------------------------------------------------
// SKILL SCORES (self-assessed, 1-5 scale) across checkpoints
// Schema: array of { studentId, checkpoint, scores: { [skillId]: number } }
// Growth trend: each student improves on average over time, with some
// individual variance and one or two skills that dip before recovering
// (realistic noise) so charts don't look artificially perfect.
// ---------------------------------------------------------------------------
const skillScores = [];

students.forEach((student) => {
  // baseline per-student aptitude offsets so people differ realistically
  const baseline = {};
  skills.forEach((sk) => {
    baseline[sk.id] = randFloat(1.4, 3.0);
  });

  CHECKPOINTS.forEach((checkpoint, ci) => {
    const scores = {};
    skills.forEach((sk) => {
      const progress = ci / (CHECKPOINTS.length - 1); // 0, 0.5, 1
      const growth = progress * randFloat(1.2, 2.6); // overall upward trend
      const noise = randFloat(-0.35, 0.35);
      let value = baseline[sk.id] + growth + noise;
      value = clamp(value, 1, 5);
      scores[sk.id] = parseFloat(value.toFixed(1));
    });
    skillScores.push({ studentId: student.id, checkpoint, scores });
  });
});

// ---------------------------------------------------------------------------
// PEER REVIEWS
// Schema: array of {
//   studentId, checkpoint, avgScore (1-5), responseCount, comments: [string]
// }
// ---------------------------------------------------------------------------
const peerPositive = [
  "Always brings energy to team meetings and keeps us on track.",
  "Great at listening to everyone's ideas before jumping to a solution.",
  "Stepped up during a stressful deadline and kept the team calm.",
  "Really improved at explaining their ideas so the whole team understands.",
  "Reliable — always follows through on what they say they'll do.",
  "Got a lot more comfortable pushing back respectfully when they disagreed.",
];
const peerConstructive = [
  "Could speak up earlier in meetings instead of waiting to be asked.",
  "Sometimes takes on too much instead of delegating to the team.",
  "Would help to double-check numbers before presenting them.",
  "Still building confidence presenting in front of larger groups.",
  "Could ask more questions when unsure instead of guessing.",
];

const peerReviews = [];
students.forEach((student) => {
  CHECKPOINTS.forEach((checkpoint, ci) => {
    const base = clamp(2.6 + ci * 0.7 + randFloat(-0.3, 0.4), 1, 5);
    peerReviews.push({
      studentId: student.id,
      checkpoint,
      avgScore: parseFloat(base.toFixed(1)),
      responseCount: randInt(3, 5),
      comments: [pick(peerPositive), pick(peerConstructive)],
    });
  });
});

// ---------------------------------------------------------------------------
// TEACHER / MENTOR EVALUATIONS
// Schema: array of {
//   studentId, checkpoint, categories: { [skillId]: number 1-5 }, comment
// }
// Uses a subset of skills most visible to mentors in workshops.
// ---------------------------------------------------------------------------
const evalSkillSubset = ["leadership", "problemSolving", "teamwork", "businessStrategy"];
const teacherComments = [
  "Showing real ownership over their role on the team.",
  "Noticeable growth in how they structure and defend their ideas.",
  "Needs continued encouragement to lead group discussions.",
  "Has become a go-to person for the team when problems come up.",
  "Made a big leap between checkpoints — worth highlighting to the team.",
  "Consistent, steady improvement across every workshop session.",
];

const teacherEvals = [];
students.forEach((student) => {
  const skillRow = skillScores.filter((r) => r.studentId === student.id);
  CHECKPOINTS.forEach((checkpoint, ci) => {
    const row = skillRow.find((r) => r.checkpoint === checkpoint);
    const categories = {};
    evalSkillSubset.forEach((skId) => {
      // teacher score tracks self-assessed score but with independent noise
      const val = clamp(row.scores[skId] + randFloat(-0.5, 0.5), 1, 5);
      categories[skId] = parseFloat(val.toFixed(1));
    });
    teacherEvals.push({
      studentId: student.id,
      checkpoint,
      categories,
      comment: pick(teacherComments),
    });
  });
});

// ---------------------------------------------------------------------------
// GLOWS / GROWS (qualitative feedback per checkpoint)
// Schema: array of { studentId, checkpoint, glows: [string], grows: [string] }
// ---------------------------------------------------------------------------
const glowBank = [
  "Confidently pitched the team's idea to a room of mentors.",
  "Helped a teammate work through a tough budgeting problem.",
  "Took the lead reorganizing the team's plan after a setback.",
  "Asked sharp questions during a guest speaker session.",
  "Volunteered to present even though public speaking is tough for them.",
  "Brought a creative solution the whole team ended up adopting.",
];
const growBank = [
  "Keep practicing speaking a bit slower during presentations.",
  "Try delegating research tasks instead of doing them solo.",
  "Work on backing up ideas with numbers/data when pitching.",
  "Continue building comfort with cold outreach to potential customers.",
  "Practice giving feedback to teammates directly and kindly.",
];

const glowsGrows = [];
students.forEach((student) => {
  CHECKPOINTS.forEach((checkpoint) => {
    glowsGrows.push({
      studentId: student.id,
      checkpoint,
      glows: pickMany(glowBank, 2),
      grows: pickMany(growBank, 2),
    });
  });
});

// ---------------------------------------------------------------------------
// STORY CONTENT — background narrative copy used in the scrollytelling intro
// ---------------------------------------------------------------------------
const story = {
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
      body:
        "Cambio Labs is a nonprofit dedicated to cultivating the next generation of changemakers. Cambio — Spanish for \"change\" — reflects the organization's mission: equipping students with the entrepreneurial mindset and skills to turn the problems they see in their communities into real, sustainable solutions.",
    },
    {
      id: "prepforprep",
      heading: "Partnering with Prep for Prep",
      body:
        "Prep for Prep identifies talented students of color across New York City and prepares them for leadership at top independent schools and beyond. Together, Cambio Labs and Prep for Prep launched the Institute for Entrepreneurship (IFE) — a program designed to give students hands-on experience building something of their own.",
    },
    {
      id: "ife",
      heading: "What is the IFE Program?",
      body:
        "Over the course of the program, students are placed into small teams and challenged to design a business that creates real impact in their community. Guided by mentors, they move through ideation, market research, financial planning, and prototyping — culminating in a final pitch to a panel of judges.",
    },
    {
      id: "whattheydid",
      heading: "What the Students Did",
      body:
        "Four teams. Four community problems. Four businesses built from scratch — spanning food access, education equity, sustainable fashion, and youth mental health. Along the way, students didn't just build companies. They built skills: leadership, communication, financial literacy, and the confidence to pitch an idea to a room of strangers.",
    },
    {
      id: "transition",
      heading: "But building a business was only half the story.",
      body:
        "Students entered the IFE program with different strengths, experiences, and levels of confidence. Over the course of the program, they worked in teams, developed projects, received feedback, and applied new skills. This is what their growth looked like.",
    },
  ],
};

// ---------------------------------------------------------------------------
// CONCLUSIONS — key findings + impact stats for the closing section
// ---------------------------------------------------------------------------
function avg(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
const preScores = skillScores.filter((r) => r.checkpoint === "Pre-Program");
const postScores = skillScores.filter((r) => r.checkpoint === "Final Pitch");
const overallPre = avg(
  preScores.flatMap((r) => Object.values(r.scores))
);
const overallPost = avg(
  postScores.flatMap((r) => Object.values(r.scores))
);
const pctGrowth = (((overallPost - overallPre) / overallPre) * 100).toFixed(0);

const biggestSkillGrowth = skills
  .map((sk) => {
    const pre = avg(preScores.map((r) => r.scores[sk.id]));
    const post = avg(postScores.map((r) => r.scores[sk.id]));
    return { skill: sk.name, pre, post, delta: post - pre };
  })
  .sort((a, b) => b.delta - a.delta);

const conclusions = {
  stats: [
    { label: "Students", value: String(students.length) },
    { label: "Student-Led Businesses", value: String(teams.length) },
    { label: "Avg. Skill Growth", value: `+${pctGrowth}%` },
    {
      label: "Most Improved Skill",
      value: biggestSkillGrowth[0].skill,
    },
  ],
  keyFindings: [
    `On average, students grew their self-assessed entrepreneurial skills by ${pctGrowth}% from the start of the program to their final pitch.`,
    `${biggestSkillGrowth[0].skill} saw the largest overall gains, followed by ${biggestSkillGrowth[1].skill} — both closely tied to the repeated practice of pitching and defending ideas.`,
    "Peer review and teacher evaluation scores tell a consistent story: the students who reported the biggest confidence gains were also rated most improved by mentors, not just by themselves.",
    "Every team shipped a working business prototype and delivered a final pitch — regardless of starting skill level, every student showed measurable growth in at least four of eight tracked competencies.",
  ],
  closingStatement:
    "The IFE program is proof that when students are trusted with real problems and real ownership, they rise to meet them. Cambio Labs and Prep for Prep didn't just teach entrepreneurship — they built confidence, leadership, and belief in what these students can accomplish next.",
};

// ---------------------------------------------------------------------------
// WRITE FILES
// ---------------------------------------------------------------------------
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const files = {
  "skills.json": skills,
  "teams.json": teams,
  "students.json": students,
  "skillScores.json": skillScores,
  "peerReviews.json": peerReviews,
  "teacherEvals.json": teacherEvals,
  "glowsGrows.json": glowsGrows,
  "story.json": story,
  "conclusions.json": conclusions,
  "checkpoints.json": CHECKPOINTS,
};

Object.entries(files).forEach(([filename, data]) => {
  fs.writeFileSync(
    path.join(OUT_DIR, filename),
    JSON.stringify(data, null, 2)
  );
  console.log(`Wrote ${filename}`);
});

console.log("\nDone. Placeholder data generated in /src/data");
