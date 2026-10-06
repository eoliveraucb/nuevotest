import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import useAuth from "../../hooks/useAuth.js";
import { students } from "../../data/index.js";

const ROLE_LABEL = { student: "Student", teacher: "Teacher", admin: "Admin" };

function displayName(profile) {
  if (profile?.role === "student" && profile.student_id) {
    const s = students.find((x) => x.id === profile.student_id);
    if (s) return s.name;
  }
  return profile?.email?.split("@")[0] || "Account";
}

export default function AuthMenu() {
  const { isAuthenticated, profile, signOut, mode, ready } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const isStaff = profile && (profile.role === "teacher" || profile.role === "admin");

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!ready) return null;

  if (!isAuthenticated) {
    return (
      <Link to="/auth" className="btn btn-ghost btn-small navbar-auth">
        Sign in
      </Link>
    );
  }

  return (
    <div className="navbar-auth" ref={ref}>
      <button
        type="button"
        className="auth-menu-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="auth-menu-avatar">{displayName(profile).charAt(0)}</span>
        <span className="auth-menu-name">{displayName(profile)}</span>
        <span className={`auth-menu-caret ${open ? "is-open" : ""}`} />
      </button>

      {open && (
        <div className="auth-menu-dropdown">
          <p className="auth-menu-email">{profile?.email}</p>
          <p className="auth-menu-role">
            <span className={`role-badge role-${profile?.role}`}>
              {ROLE_LABEL[profile?.role]}
            </span>
            {mode === "mock" && <em className="auth-menu-mode">demo mode</em>}
          </p>
          {profile?.role === "student" && profile.student_id && (
            <Link to={`/student/${profile.student_id}`} onClick={() => setOpen(false)}>
              Your dashboard
            </Link>
          )}
          {isStaff && (
            <Link to="/admin" onClick={() => setOpen(false)}>
              Edit site
            </Link>
          )}
          <button
            type="button"
            className="auth-menu-logout"
            onClick={() => {
              setOpen(false);
              signOut();
            }}
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}