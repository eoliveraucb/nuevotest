import { AdminBox, EditorField, SaveBar } from "./editor-ui.jsx";
import useDraft from "../../hooks/useDraft.js";
import useContent from "../../hooks/useContent.js";
import { teams, teamColor } from "../../data/index.js";

const RANK_OPTIONS = [
  { value: "", label: "No placement" },
  { value: "1", label: "1st Place" },
  { value: "2", label: "2nd Place" },
  { value: "3", label: "3rd Place" },
  { value: "4", label: "4th Place" },
];

export default function TeamsEditor({ programId }) {
  const { saveField } = useContent();
  const { draft, setDraft, status, dirty, save, reset } = useDraft(
    () => teams.map((t) => ({ ...t, memberIds: [...(t.memberIds || [])] })),
    (data) => saveField(programId, "teams", data)
  );

  const setTeam = (i, key) => (e) => {
    const next = draft.map((t, idx) => (idx === i ? { ...t, [key]: e.target.value } : t));
    setDraft(next);
  };

  const addTeam = () => {
    const n = draft.length;
    setDraft([
      ...draft,
      {
        id: `team-${n + 1}`,
        name: "",
        tagline: "",
        businessIdea: "",
        impactArea: "",
        colorIndex: n % 9,
        finalsRank: null,
        memberIds: [],
      },
    ]);
  };
  const removeTeam = (i) => setDraft(draft.filter((_, idx) => idx !== i));

  return (
    <div className="admin-tab">
      <div className="admin-tab-head">
        <h2>Teams</h2>
        <p>Edit the team cards that appear in "Meet the teams" and each team page. Member assignment is managed on the Students tab.</p>
      </div>

      <AdminBox
        title={`${draft.length} teams`}
        actions={
          <button type="button" className="btn btn-ghost btn-small" onClick={addTeam}>
            + Add team
          </button>
        }
      >
        {draft.map((t, i) => (
          <div className="admin-team card" key={t.id || i}>
            <div className="admin-chapter-head">
              <span className="admin-team-swatch" style={{ background: teamColor(t.colorIndex ?? 0) }} />
              <strong>{t.name || `Team ${i + 1}`}</strong>
              <div className="admin-chapter-actions">
                <button type="button" className="btn btn-ghost btn-micro admin-danger" onClick={() => removeTeam(i)}>
                  ✕
                </button>
              </div>
            </div>
            <div className="admin-grid-2">
              <EditorField label="Name">
                <input value={t.name} onChange={setTeam(i, "name")} />
              </EditorField>
              <EditorField label="Anchor id">
                <input value={t.id} onChange={setTeam(i, "id")} />
              </EditorField>
            </div>
            <EditorField label="Tagline">
              <input value={t.tagline} onChange={setTeam(i, "tagline")} />
            </EditorField>
            <EditorField label="Business idea">
              <textarea value={t.businessIdea} onChange={setTeam(i, "businessIdea")} rows={3} />
            </EditorField>
            <div className="admin-grid-3">
              <EditorField label="Impact area">
                <input value={t.impactArea} onChange={setTeam(i, "impactArea")} />
              </EditorField>
              <EditorField label="Finals placement">
                <select
                  value={t.finalsRank ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setTeam(i, "finalsRank")({ target: { value: v === "" ? null : Number(v) } });
                  }}
                >
                  {RANK_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </EditorField>
              <EditorField label="Color index (0–8)">
                <input type="number" min="0" max="8" value={t.colorIndex ?? 0} onChange={setTeam(i, "colorIndex")} />
              </EditorField>
            </div>
          </div>
        ))}
        <SaveBar onSave={save} dirty={dirty} status={status} onReset={reset} />
      </AdminBox>
    </div>
  );
}