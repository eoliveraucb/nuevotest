import { useEffect, useState } from "react";
import { listProfiles, updateProfile } from "../../lib/auth.js";
import useAuth from "../../hooks/useAuth.js";
import { students } from "../../data/index.js";
import { AdminBox } from "./editor-ui.jsx";

const ROLE_OPTIONS = [
  { value: "student", label: "Student" },
  { value: "teacher", label: "Teacher" },
  { value: "admin", label: "Admin" },
];

export default function AccountsPanel() {
  const { mode } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ userId: null, status: "", message: "" });

  const load = async () => {
    setLoading(true);
    const { profiles: list } = await listProfiles();
    setProfiles(list);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const patch = async (id, field, value) => {
    setFeedback({ userId: id, status: "saving", message: "Saving…" });
    const { error } = await updateProfile(id, { [field]: value });
    if (error) {
      setFeedback({ userId: id, status: "error", message: error.message || "Couldn't save." });
      return;
    }
    await load();
    setFeedback({ userId: id, status: "saved", message: "Saved ✓" });
  };

  const displayName = (p) => {
    if (p.student_id) {
      const s = students.find((x) => x.id === p.student_id);
      if (s) return s.name;
    }
    return p.email;
  };

  return (
    <div className="admin-tab">
      <div className="admin-tab-head">
        <h2>Accounts</h2>
        <p>
          Grant or revoke access to this editor. Teachers can edit site content; admins can do
          everything here too. Link a student to their program profile so they can control their
          own privacy settings.
        </p>
      </div>

      <AdminBox title={`${profiles.length} account${profiles.length === 1 ? "" : "s"}`} description={mode === "mock" ? "Demo-mode accounts live in your browser's localStorage." : "Live Supabase profiles."}>
        {loading ? (
          <p className="admin-empty">Loading…</p>
        ) : (
          <div className="admin-table">
            <div className="admin-table-head admin-table-head-4">
              <span>Account</span>
              <span>Role</span>
              <span>Linked student</span>
              <span />
            </div>
            {profiles.map((p) => (
              <div className="admin-table-row" key={p.id}>
                <div className="admin-acct">
                  <strong>{displayName(p)}</strong>
                  <small>{p.email}</small>
                </div>
                <select
                  value={p.role}
                  onChange={(e) => patch(p.id, "role", e.target.value)}
                  title="Change this account's role"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <select
                  value={p.student_id || ""}
                  onChange={(e) => patch(p.id, "student_id", e.target.value || null)}
                  title="Link this account to a program student"
                >
                  <option value="">Not linked</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <span className="admin-acct-status">
                  {feedback.userId === p.id && feedback.message}
                </span>
              </div>
            ))}
          </div>
        )}
      </AdminBox>
    </div>
  );
}