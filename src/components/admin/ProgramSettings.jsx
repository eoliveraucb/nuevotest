import { useState } from "react";
import useContent from "../../hooks/useContent.js";
import { AdminBox, EditorField } from "./editor-ui.jsx";

export default function ProgramSettings() {
  const { programs, saveRegistry, activeProgramId } = useContent();
  const [draft, setDraft] = useState(() => programs.map((p) => ({ ...p })));
  const [status, setStatus] = useState("idle");
  const [newId, setNewId] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [formError, setFormError] = useState(null);

  const dirty = JSON.stringify(draft) !== JSON.stringify(programs.map((p) => ({ ...p })));

  const save = async () => {
    if (!draft.length) {
      setStatus("error");
      return;
    }
    setStatus("saving");
    const { error } = await saveRegistry(draft);
    setStatus(error ? "error" : "saved");
  };

  const setActive = (id) => setDraft(draft.map((p) => ({ ...p, active: p.id === id })));

  const addProgram = () => {
    setFormError(null);
    const id = newId.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/(^-|-$)/g, "");
    const label = newLabel.trim();
    if (!id || !label) {
      setFormError("Both an id and a label are required.");
      return;
    }
    if (draft.some((p) => p.id === id)) {
      setFormError("A program with that id already exists.");
      return;
    }
    setDraft([...draft, { id, label, active: draft.length === 0 }]);
    setNewId("");
    setNewLabel("");
  };

  const removeProgram = (id) => {
    const next = draft.filter((p) => p.id !== id);
    if (next.length && !next.some((p) => p.active)) next[0].active = true;
    setDraft(next);
  };

  return (
    <div className="admin-tab">
      <div className="admin-tab-head">
        <h2>Programs</h2>
        <p>Everything here is scoped to the active program. Add a future cohort here — no code changes needed — then fill it in with the Story/Teams/Students tabs or import its survey CSV.</p>
      </div>

      <AdminBox
        title="Program registry"
        description={`Active program: ${activeProgramId}`}
        actions={
          <div className="admin-inline-actions">
            <button type="button" className="btn btn-small" disabled={!dirty || status === "saving"} onClick={save}>
              {status === "saving" ? "Saving…" : "Save registry"}
            </button>
            {status === "saved" && <span className="privacy-saved">Saved ✓</span>}
            {status === "error" && <span className="privacy-error">Couldn't save.</span>}
          </div>
        }
      >
        <div className="admin-table">
          <div className="admin-table-head admin-table-head-3">
            <span>Id</span>
            <span>Label</span>
            <span>Status</span>
            <span />
          </div>
          {draft.map((p) => (
            <div className="admin-table-row" key={p.id}>
              <input value={p.id} onChange={(e) => setDraft(draft.map((x) => (x.id === p.id ? { ...x, id: e.target.value } : x)))} />
              <input value={p.label} onChange={(e) => setDraft(draft.map((x) => (x.id === p.id ? { ...x, label: e.target.value } : x)))} />
              <label className="admin-check admin-check-label">
                <input type="radio" name="active-program" checked={Boolean(p.active)} onChange={() => setActive(p.id)} />
                {p.active ? "Active" : "Set active"}
              </label>
              <button type="button" className="btn btn-ghost btn-micro admin-danger" onClick={() => removeProgram(p.id)}>
                ✕
              </button>
            </div>
          ))}
        </div>
      </AdminBox>

      <AdminBox title="Add a program" description="This registers the cohort. Add it here, then either edit its content in the other tabs or import its data CSV.">
        <div className="admin-grid-2">
          <EditorField label="Program id (slug)" hint="Lowercase letters, numbers, dashes.">
            <input value={newId} onChange={(e) => setNewId(e.target.value)} placeholder="ife-winter-2027" />
          </EditorField>
          <EditorField label="Label">
            <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="IFE Winter 2027" />
          </EditorField>
        </div>
        {formError && <p className="admin-error">{formError}</p>}
        <button type="button" className="btn btn-ghost btn-small" onClick={addProgram}>
          + Add program
        </button>
      </AdminBox>
    </div>
  );
}