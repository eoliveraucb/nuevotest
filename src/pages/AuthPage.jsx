import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth.js";
import { students } from "../data/index.js";
import { signInWithMagicLink } from "../lib/auth.js";

function MagicLinkDemoButton({ email, label }) {
  const { isSupabase } = useAuth();
  if (isSupabase) return null;
  const onClick = async () => {
    await signInWithMagicLink({ email });
    window.location.href = "/";
  };
  return (
    <button type="button" className="demo-link" onClick={onClick}>
      {label}
    </button>
  );
}

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInWithPassword, signUp, authError, isSupabase, profile } = useAuth();

  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [studentId, setStudentId] = useState("");
  const [magicSent, setMagicSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const from = location.state?.from || "/";
  if (profile) {
    navigate(from, { replace: true });
    return null;
  }

  const goHome = () => navigate(from, { replace: true });

  const handleLogin = async (e) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await signInWithPassword({ email, password });
    if (!error) goHome();
    setBusy(false);
  };

  const handleMagic = async (e) => {
    e.preventDefault();
    setMagicSent(false);
    const { error } = await signInWithMagicLink({ email });
    if (!error) setMagicSent(true);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await signUp({
      email,
      password,
      role,
      studentId: role === "student" ? studentId : null,
    });
    if (!error) goHome();
    setBusy(false);
  };

  const supportedRole = (r) => (isSupabase ? r === "student" : true);

  return (
    <main className="auth-page">
      <div className="container">
        <div className="auth-card card">
          <div className="auth-heading">
            <h1 className="auth-title">Sign in to the dashboard</h1>
            <p className="auth-subtitle">
              Student data is public by default. Sign in as a student to control
              who can see your skill growth &amp; feedback.
            </p>
          </div>

          <div className="auth-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              className={`auth-tab ${mode === "login" ? "is-active" : ""}`}
              onClick={() => setMode("login")}
            >
              Log in
            </button>
            <button
              type="button"
              role="tab"
              className={`auth-tab ${mode === "signup" ? "is-active" : ""}`}
              onClick={() => setMode("signup")}
            >
              Create account
            </button>
          </div>

          {authError && <p className="auth-error">{authError}</p>}

          {mode === "login" ? (
            <form className="auth-form" onSubmit={handleLogin}>
              <label className="field">
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@school.edu"
                  required
                />
              </label>
              <label className="field">
                <span>Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </label>
              <button type="submit" className="btn btn-block" disabled={busy}>
                {busy ? "Signing in…" : "Log in"}
              </button>

              <div className="auth-divider">
                <span>or</span>
              </div>

              <button
                type="button"
                className="btn btn-ghost btn-block"
                onClick={handleMagic}
              >
                Email me a magic link
              </button>
              {magicSent && (
                <p className="auth-note">
                  {isSupabase
                    ? "Check your inbox — the magic link has been sent."
                    : "Demo mode: magic link simulated — you are signed in now."}
                </p>
              )}
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleSignup}>
              <label className="field">
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@school.edu"
                  required
                />
              </label>
              <label className="field">
                <span>Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  minLength={6}
                  required
                />
              </label>

              <fieldset className="field">
                <legend>I am a…</legend>
                <div className="role-options">
                  {[
                    { id: "student", label: "Student" },
                    { id: "teacher", label: "Teacher" },
                    { id: "admin", label: "Admin" },
                  ]
                    .filter((r) => supportedRole(r.id))
                    .map((r) => (
                      <label key={r.id} className="role-option">
                        <input
                          type="radio"
                          name="role"
                          value={r.id}
                          checked={role === r.id}
                          onChange={() => {
                            setRole(r.id);
                            if (r.id !== "student") setStudentId("");
                          }}
                        />
                        {r.label}
                      </label>
                    ))}
                </div>
                {isSupabase && (
                  <p className="auth-note">
                    Teachers &amp; admins are provisioned by an administrator —
                    students sign themselves up here.
                  </p>
                )}
              </fieldset>

              {role === "student" && (
                <label className="field">
                  <span>Which student are you?</span>
                  <select
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    required
                  >
                    <option value="">Select your name…</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <button type="submit" className="btn btn-block" disabled={busy}>
                {busy ? "Creating…" : "Create account"}
              </button>
            </form>
          )}

          {!isSupabase && (
            <div className="auth-demo">
              <p className="auth-demo-title">Demo accounts</p>
              <div className="auth-demo-row">
                <MagicLinkDemoButton email="admin@ife.demo" label="Log in as Admin" />
                <MagicLinkDemoButton email="teacher@ife.demo" label="Log in as Teacher" />
              </div>
              <ul className="auth-demo-list">
                <li>
                  <code>admin@ife.demo</code> / <code>password</code>
                </li>
                <li>
                  <code>teacher@ife.demo</code> / <code>password</code>
                </li>
              </ul>
              <p className="auth-note">
                Running without Supabase credentials, auth is simulated in your
                browser. Configure <code>VITE_SUPABASE_URL</code> &
                <code> VITE_SUPABASE_ANON_KEY</code> for real accounts.
              </p>
            </div>
          )}

          <p className="auth-footer">
            <Link to="/">← Back to the site</Link>
          </p>
        </div>
      </div>
    </main>
  );
}