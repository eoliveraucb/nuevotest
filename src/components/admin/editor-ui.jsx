export function EditorField({ label, hint, children }) {
  return (
    <label className="admin-field">
      <span className="admin-field-label">{label}</span>
      {children}
      {hint && <small className="admin-field-hint">{hint}</small>}
    </label>
  );
}

export function AdminBox({ title, description, children, actions }) {
  return (
    <div className="admin-box card">
      <div className="admin-box-head">
        <div>
          <h3 className="card-title">{title}</h3>
          {description && <p className="admin-box-desc">{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}

export function SaveBar({ onSave, dirty, status, onReset, label = "Save changes" }) {
  return (
    <div className="admin-savebar">
      <button type="button" className="btn btn-small" onClick={onSave} disabled={!dirty || status === "saving"}>
        {status === "saving" ? "Saving…" : label}
      </button>
      {dirty && (
        <button type="button" className="btn btn-ghost btn-small" onClick={onReset}>
          Reset
        </button>
      )}
      {status === "saved" && <span className="privacy-saved">Saved ✓</span>}
      {status === "error" && <span className="privacy-error">Couldn't save. Try again.</span>}
    </div>
  );
}