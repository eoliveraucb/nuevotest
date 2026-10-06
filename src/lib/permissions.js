/**
 * Role-based permission rules for the admin editor.
 *
 *  - teachers can edit site content (story, teams, students, conclusions,
 *    and import data)
 *  - admins can additionally manage accounts (change roles, link students)
 *  - students and anonymous visitors cannot edit anything
 */

export function canEditSite(role) {
  return role === "teacher" || role === "admin";
}

export function canManageAccounts(role) {
  return role === "admin";
}