import { useState } from "react";
import useAuth from "../../hooks/useAuth.js";
import { VISIBILITY_OPTIONS, getSettingsForStudent, visibilityLabel } from "../../lib/privacy.js";

export default function PrivacyPanel({ studentId }) {
  const { privacyMap, updatePrivacy, privacyStatus, profile } = useAuth();
  const isOwn = profile?.student_id === studentId;
  const settings = getSettingsForStudent(privacyMap, studentId);
  const currentVisibility = settings.visibility;

  const [visibility, setVisibility] = useState(settings.visibility);
  const [emails, setEmails] = useState((settings.allowed_emails || []).join(", "));

  const canSave = visibility !== settings.visibility || emails.trim() !== (settings.allowed_emails || []).join(", ");

  const handleSave = async () => {
    const allowed_emails = visibility === "specific" && emails.trim() !== ""
      ? emails.split(",").map((e) => e.trim()).filter(Boolean)
      : [];
    await updatePrivacy(studentId, { visibility, allowed_emails });
  };

  const handleReset = () => {
    setVisibility(settings.visibility);
    setEmails((settings.allowed_emails || []).join(", "));
  };

  return (
    <aside className={`privacy-panel card ${!isOwn ? "privacy-panel-readonly" : ""}`}>
      <h3 className="card-title">Who can see this?</h3>
      <p className="card-subtitle">
        {isOwn
          ? "Control who can view your skill growth and feedback dashboard."
          : `${visibilityLabel(currentVisibility)} — set by this student${
              currentVisibility === "everyone" ? " (default)" : ""
            }.`}
      </p>

      {isOwn ? (
        <>
          <div className="privacy-options">
            {VISIBILITY_OPTIONS.map((o) => (
              <label key={o.id} className={`privacy-option ${visibility === o.id ? "is-active" : ""}`}>
                <input
                  type="radio"
                  name={`privacy-${studentId}`}
                  value={o.id}
                  checked={visibility === o.id}
                  onChange={() => setVisibility(o.id)}
                />
                <strong>{o.label}</strong>
                <small>{o.description}</small>
              </label>
            ))}
          </div>

          {visibility === "specific" && (
            <label className="field">
              <span>People who can also see it (emails, comma-separated)</span>
              <input
                type="text"
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                placeholder="avery@school.edu, jordan@school.edu"
              />
            </label>
          )}

          <div className="privacy-actions">
            <button
              type="button"
              className="btn btn-small"
              disabled={!canSave || privacyStatus === "saving"}
              onClick={handleSave}
            >
              {privacyStatus === "saving" ? "Saving…" : "Save"}
            </button>
            {privacyStatus === "saved" && <span className="privacy-saved">✓ Saved</span>}
            {privacyStatus === "error" && (
              <span className="privacy-error">Couldn't save. Try again.</span>
            )}
            {canSave && (
              <button type="button" className="btn btn-ghost btn-small" onClick={handleReset}>
                Reset
              </button>
            )}
          </div>
        </>
      ) : (
        <p className="privacy-note">
          {visibility === "everyone"
            ? "This student has left their data public — anyone can see it."
            : visibility === "specific"
              ? "This student shares their data with specific people only."
              : "This student limits this data to their teachers."}
        </p>
      )}
    </aside>
  );
}