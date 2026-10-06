import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import useAuth from "../hooks/useAuth.js";
import useContent from "../hooks/useContent.js";
import { canEditSite, canManageAccounts } from "../lib/permissions.js";
import StoryEditor from "../components/admin/StoryEditor.jsx";
import TeamsEditor from "../components/admin/TeamsEditor.jsx";
import StudentsEditor from "../components/admin/StudentsEditor.jsx";
import ConclusionsEditor from "../components/admin/ConclusionsEditor.jsx";
import ImportEditor from "../components/admin/ImportEditor.jsx";
import ProgramSettings from "../components/admin/ProgramSettings.jsx";
import AccountsPanel from "../components/admin/AccountsPanel.jsx";

const TABS = [
  { id: "overview", label: "Programs" },
  { id: "story", label: "Story" },
  { id: "teams", label: "Teams" },
  { id: "students", label: "Students" },
  { id: "conclusions", label: "Conclusions" },
  { id: "import", label: "Import data" },
  { id: "accounts", label: "Accounts", adminOnly: true },
];

export default function AdminPage() {
  const { ready, profile, role } = useAuth();
  const { activeProgramId } = useContent();
  const [tab, setTab] = useState("overview");

  if (!ready) return null;

  if (!profile) {
    return <Navigate to="/auth" state={{ from: "/admin" }} replace />;
  }

  if (!canEditSite(role)) {
    return (
      <main className="admin-page">
        <div className="container">
          <div className="card admin-denied">
            <h1 className="admin-denied-title">Admins only</h1>
            <p>Your account doesn't have permission to edit the site. Ask an admin to give your
              account the <em>Teacher</em> or <em>Admin</em> role.</p>
            <Link to="/" className="btn btn-ghost btn-small">
              ← Back to the site
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const allowedTabs = TABS.filter((t) => !t.adminOnly || canManageAccounts(role));
  const activeTab = allowedTabs.some((t) => t.id === tab) ? tab : allowedTabs[0].id;

  return (
    <main className="admin-page">
      <div className="container">
        <div className="admin-head">
          <div>
            <p className="eyebrow">Content Studio</p>
            <h1>Site editor</h1>
          </div>
          <div className="admin-head-meta">
            <span className={`role-badge role-${role}`}>{role}</span>
            <span className="admin-program-chip">Editing: {activeProgramId}</span>
          </div>
        </div>

        <nav className="admin-tabs" role="tablist">
          {allowedTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={activeTab === t.id}
              className={`admin-tab ${activeTab === t.id ? "is-active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {activeTab === "overview" && <ProgramSettings />}
        {activeTab === "story" && <StoryEditor programId={activeProgramId} />}
        {activeTab === "teams" && <TeamsEditor programId={activeProgramId} />}
        {activeTab === "students" && <StudentsEditor programId={activeProgramId} />}
        {activeTab === "conclusions" && <ConclusionsEditor programId={activeProgramId} />}
        {activeTab === "import" && <ImportEditor programId={activeProgramId} />}
        {activeTab === "accounts" && <AccountsPanel />}

        <p className="admin-footnote">
          Edits are saved live to the site (<Link to="/">view the site →</Link>) and persist in{" "}
          {role === "admin" ? "Supabase" : "the editable content store"} per program. To make an
          edit permanent in the repository, use the matching export/download in each tab.
        </p>
      </div>
    </main>
  );
}