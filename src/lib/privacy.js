/**
 * Privacy/visibility model for student data.
 *
 * Teachers and admins always have full visibility (per the program design).
 * Students can limit who sees their skill-growth + feedback dashboards to:
 *  - everyone:  anyone who visits the site (current public behavior)
 *  - teachers:  the student themself + teacher/admin accounts
 *  - specific:  themself + teachers/admins + a chosen list of emails
 *  - just_me:   themself + teachers/admins only
 *
 * Note: the program's JSON data ships inside the static bundle, so this
 * layer controls what the *site* renders. Real data privacy requires moving
 * the sensitive records behind Supabase RLS — see supabase/schema.sql.
 */

export const VISIBILITY_OPTIONS = [
  {
    id: "everyone",
    label: "Everyone",
    description: "Anyone visiting the site can see it.",
  },
  {
    id: "teachers",
    label: "My teachers",
    description: "Only the program teachers (and you).",
  },
  {
    id: "specific",
    label: "Specific people",
    description: "You choose which people (by email) can also see it.",
  },
  {
    id: "just_me",
    label: "Just me",
    description: "Yourself and the teachers only.",
  },
];

export const DEFAULT_VISIBILITY = "everyone";

export function visibilityLabel(id) {
  const opt = VISIBILITY_OPTIONS.find((o) => o.id === id);
  return opt ? opt.label : "Everyone";
}

/**
 * Resolve effective settings for a student, falling back to defaults.
 */
export function getSettingsForStudent(privacyMap, studentId) {
  return (
    privacyMap[studentId] || {
      visibility: DEFAULT_VISIBILITY,
      allowed_emails: [],
    }
  );
}

/**
 * The rule that decides whether a viewer may see a student's data.
 * viewer: null (anonymous) or { role, student_id, email }
 */
export function canViewStudentData({ viewer, student, privacyMap }) {
  if (!student) return false;
  if (viewer?.role === "teacher" || viewer?.role === "admin") return true;
  if (viewer?.student_id === student.id) return true;

  const settings = getSettingsForStudent(privacyMap, student.id);
  switch (settings.visibility) {
    case "teachers":
    case "just_me":
      // Not a teacher/admin and not the student themself → hidden.
      return false;
    case "specific": {
      if (!viewer?.email) return false;
      return (settings.allowed_emails || [])
        .map((e) => e.trim().toLowerCase())
        .includes(viewer.email.toLowerCase());
    }
    case "everyone":
    default:
      return true;
  }
}