# From Idea to Impact — Cambio Labs × Prep for Prep IFE Dashboard

An interactive, scrollytelling data site (Pudding.cool-style) telling the
story of the Institute for Entrepreneurship (IFE) program: how it started,
what students built, and how they grew — backed by drill-down dashboards for
every team and student.

**Flow:** Hero → Story (Cambio Labs / Prep for Prep / IFE background) →
Onboarding (starting skill levels) → Growth (skill growth over checkpoints,
with a "team race" alternate view) → Teams overview → Team detail → Student
detail (skill profile, peer feedback, glows & grows) → Conclusions.

## Getting started

```bash
npm install
npm run dev       # http://localhost:5173
npm run build      # production build to /dist
npm run preview    # preview the production build locally
```

Deploys as a static site. A `vercel.json` is included with the SPA rewrite
needed for the `/team/:id` and `/student/:id` routes to work on refresh/direct
link.

## ✅ Current data is real (IFE Summer 2026)

The site is running on real program data: 38 students, 9 teams, real
business ideas, real skill self-assessments (onboarding + exit), real peer
feedback and glows/grows (from the midway survey). See
`raw-data/` for the original source documents and
`scripts/importRealData.mjs` for exactly how everything was parsed and
mapped — read the comments at the top of that script for the full data
lineage and the judgment calls made along the way (e.g. why "mentor
evaluation" isn't in the site yet, or why peer contribution *ratings*
weren't used but peer *comments* were).

**On hold:** mentor/teacher evaluations (no reliable source data yet — judge
feedback spreadsheets can be added later, see `IFE_Data.docx` for the linked
sheets).

## Multi-program architecture

The site supports more than one cohort/program without code changes:

```
src/data/
  programs.json              ← registry: [{ id, label, active }]
  programs/
    ife-summer-2026/         ← one folder per program, same file shapes
      skills.json
      teams.json
      students.json
      skillScores.json
      checkpoints.json
      peerReviews.json
      glowsGrows.json
      selfReflections.json
      story.json
      conclusions.json
  index.js                   ← loads whichever program is "active", exposes
                                the same helper API regardless of program
```

**To launch a future program:**
1. Create `src/data/programs/<new-id>/` with files matching the same shapes
   as `ife-summer-2026` (see table below).
2. Add an entry to `src/data/programs.json`.
3. Set `"active": true` on the new program (and `false` on the old one).
4. No component code needs to change — everything reads through
   `src/data/index.js`.

### Data file shapes

| File | Shape | Notes |
|---|---|---|
| `skills.json` | `[{ id, name, description }]` | The competencies tracked. Any number of skills works — charts adapt automatically. |
| `checkpoints.json` | `["Onboarding", "Exit"]` | The skill-assessment time points used for growth charts. Can be 2 or more; charts adapt. |
| `teams.json` | `[{ id, name, tagline, businessIdea, impactArea, colorIndex, finalsRank, memberIds: [] }]` | One entry per team. `memberIds` must match `students.json` ids. `colorIndex` (0-8) picks from the 9 team colors in `theme.css`. `finalsRank` is optional (1-4, or omit). |
| `students.json` | `[{ id, name, teamId, hasOnboarding, hasExit }]` | One entry per student. The `has*` flags drive the "partial data" notice on the student page. |
| `skillScores.json` | `[{ studentId, checkpoint, scores: { [skillId]: 1-5 } }]` | One row per student per checkpoint where data exists (missing checkpoints are simply omitted, not zero-filled). |
| `peerReviews.json` | `[{ studentId, checkpoint, reviewerCount, comments: [] }]` | Real peer shoutouts/comments received, one snapshot (currently Midway only). |
| `glowsGrows.json` | `[{ studentId, checkpoint, glows: [], grows: [] }]` | Real qualitative feedback received from teammates. |
| `selfReflections.json` | `[{ studentId, checkpoint, goingWell, challenge, collaboration, toolsResources, otherThoughts }]` | Students' own reflections — powers the "In Their Own Words" card. |
| `story.json` | `{ hero: {...}, chapters: [{ id, heading, body }] }` | The scrollytelling narrative copy at the top of the site. |
| `conclusions.json` | `{ stats: [{label, value}], keyFindings: [], closingStatement, finalsRankings: [] }` | The closing section. See `scripts/importRealData.mjs` for how these are computed from real skill-growth numbers. |

### Re-running the real data import

If the raw CSV or roster changes, regenerate everything with:

```bash
node scripts/importRealData.mjs
```

This reads `raw-data/ife-summer-2026-submissions.csv` plus the hardcoded
roster/skill-category mappings in `scripts/realDataConstants.mjs`, and
rewrites every file in `src/data/programs/ife-summer-2026/`. The script has
extensive inline comments explaining the trickier parsing decisions (name
matching for peer reviews, junk-answer filtering, etc.) — read those before
changing the parsing logic.

`scripts/generateData.js` is the original **placeholder/demo data
generator** (fictional teams/students) — useful as a reference if starting a
brand new program from scratch with no real data yet, but not used by the
live site anymore.

## Project structure

```
src/
  data/                  ← program registry + per-program data (see above)
  hooks/                 ← useActiveStep (scrollytelling), useScrollProgress
  components/
    story/               ← Hero, scrollytelling chapters + visuals
    onboarding/           ← starting skill levels section
    growth/               ← skill growth over time + Team Race alt view
    dashboard/            ← teams overview grid
    conclusions/          ← closing key findings section
    shared/
      charts/             ← RadarChart, GrowthLineChart, BarRow (D3 + React)
      NavBar, Footer, SectionHeading, ScrollToTop
  pages/
    HomePage.jsx          ← assembles the full scroll story + dashboards
    TeamPage.jsx           ← /team/:teamId — roster + team-level charts
    StudentPage.jsx        ← /student/:studentId — full individual dashboard
  styles/
    theme.css              ← purple color tokens (pulled from cambiolabs.org)
    layout.css              ← nav/footer/section layout
    hero.css                 ← hero + scrollytelling styles
    dashboard.css             ← onboarding/growth/teams/team+student page styles
```

## Theme

Colors in `src/styles/theme.css` were pulled directly from cambiolabs.org's
purple palette (`--purple-500: #7200f3` is the primary brand purple). Update
these CSS variables to adjust the whole site's palette in one place. Team
colors (`--team-color-0` through `--team-color-8`) cycle across up to 9
teams.

## Accounts + privacy/visibility

Sign in at `/auth` to get accounts, roles, and per-student privacy controls.

- **Auth:** email + password, plus email magic link. Works in **two modes**:
  - **Demo mode (no setup):** without any Supabase credentials the whole flow
    is simulated in `localStorage` so you can click through it immediately.
    The `/auth` page shows one-click demo accounts (`admin@ife.demo`,
    `teacher@ife.demo`, both with password `password`).
  - **Supabase mode:** set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
    in `.env.local` (see `.env.example`) and real Postgres + Auth + RLS take
    over. Create the tables with `supabase/schema.sql`.
- **Roles:** `student`, `teacher`, `admin`. Teachers and admins always have
  full visibility; students self-register (when Supabase is configured, teacher
  accounts are provisioned by an admin, not via the signup form).
- **Privacy:** on their own student page, a linked student can set their
  skill-growth + feedback dashboards to *Everyone* (default, matches the old
  public behavior), *My teachers*, *Specific people* (by email), or *Just me*.
  The setting is enforced on the student page and in team-roster growth
  deltas. Anyone below the bar sees a locked state instead.

> **Privacy caveat:** the program's JSON still ships inside the static bundle,
> so these rules control what the *site renders*. Real data privacy means
> moving the sensitive records behind the RLS policies sketched in
> `supabase/schema.sql` and loading them through authenticated queries — the
> current schema supports exactly that migration.

## Setup steps for Supabase mode

1. `npm install` then create `.env.local` from `.env.example` with your
   project's URL + anon key (find both under Supabase → Settings → API).
2. In Supabase → SQL Editor, run `supabase/schema.sql`.
3. Turn on **Email → Password** provider (and optionally email OTP for magic
   links) under Authentication → Providers.
4. Seed teacher/admin accounts (one-off, with the service role key):
   ```js
   await supabase.auth.admin.createUser({ email, password, email_confirm: true });
   await supabase.from("profiles").update({ role: "teacher" }).eq("id", userId);
   ```
5. Link a student's profile to their roster id so they can control their own
   visibility:
   ```sql
   update public.profiles set student_id = 's001' where email = 'adam@school.edu';
   ```

## Admin content studio (`/admin`)

Sign in as a teacher or admin and visit `/admin` for a role-gated editor that
lets non-technical staff change the site without touching code:

- **Programs** — see the program registry, add a future cohort (id + label),
  and mark one active. No code changes needed to launch a new program.
- **Story / Teams / Students / Conclusions** — WYSIWYG-style forms for the hero
  + chapters, team cards, student roster (moving students updates team rosters
  automatically), and the closing section. Edits save live and the site renders
  them immediately (they persist per program).
- **Import data** — paste or upload the platform survey export CSV and run the
  **exact same import pipeline as `node scripts/importRealData.mjs`** in the
  browser. It shows a coverage preview (onboarding/exit/midway row counts,
  students missing surveys) before you save, and can download the generated
  JSON files to commit to the repo for permanence.
- **Accounts** *(admin only)* — grant/revoke the Teacher/Admin roles and link
  student accounts to their program profile. This is how access to the editor
  is given.

**Persistence:** edits are stored per program in the editable content store —
`localStorage` in demo mode, or the `site_content` table (via Supabase) when
credentials are configured (RLS: everyone can read, staff can write). Bundled
JSON is always the base layer, so edits are a thin override on top.

**Who can do what:**
| Role | View site | Public data defaults | Edit content | Manage accounts |
|---|---|---|---|---|
| Anonymous | ✅ | visible as set by students | ❌ | ❌ |
| Student | ✅ | only their own permitted dashboards | ❌ | ❌ |
| Teacher | ✅ | full visibility | ✅ | ❌ |
| Admin | ✅ | full visibility | ✅ | ✅ |

## Roadmap

Planned for a future pass, in this order:

1. ~~Multi-program data model~~ ✅ done
2. ~~Team Race interactive visual~~ ✅ done
3. ~~Accounts + privacy/visibility~~ ✅ done (Supabase-backed, with an
   in-browser demo mode; see above)
4. ~~Admin WYSIWYG editor~~ ✅ done — story/teams/students/conclusions editing,
   in-browser CSV import, program registry, and admin account management, all
   gated by roles (see "Admin content studio" above).

Mentor/teacher evaluation data is intentionally left out of the current
build (on hold) — see the note above.
