import { AdminBox, EditorField, SaveBar } from "./editor-ui.jsx";
import useDraft from "../../hooks/useDraft.js";
import useContent from "../../hooks/useContent.js";
import { conclusions } from "../../data/index.js";

export default function ConclusionsEditor({ programId }) {
  const { saveField } = useContent();
  const { draft, setDraft, status, dirty, save, reset } = useDraft(
    () => ({
      stats: (conclusions.stats || []).map((s) => ({ ...s })),
      keyFindings: [...(conclusions.keyFindings || [])],
      closingStatement: conclusions.closingStatement || "",
      finalsRankings: (conclusions.finalsRankings || []).map((f) => ({ ...f })),
    }),
    (data) => saveField(programId, "conclusions", data)
  );

  const setStat = (i, key) => (e) => {
    const stats = draft.stats.map((s, idx) => (idx === i ? { ...s, [key]: e.target.value } : s));
    setDraft({ ...draft, stats });
  };
  const addStat = () => setDraft({ ...draft, stats: [...draft.stats, { label: "", value: "" }] });
  const removeStat = (i) => setDraft({ ...draft, stats: draft.stats.filter((_, idx) => idx !== i) });

  const setFinding = (i) => (e) => {
    const keyFindings = draft.keyFindings.map((f, idx) => (idx === i ? e.target.value : f));
    setDraft({ ...draft, keyFindings });
  };
  const addFinding = () => setDraft({ ...draft, keyFindings: [...draft.keyFindings, ""] });
  const removeFinding = (i) => setDraft({ ...draft, keyFindings: draft.keyFindings.filter((_, idx) => idx !== i) });

  const setRanking = (i, key) => (e) => {
    const finalsRankings = draft.finalsRankings.map((f, idx) => (idx === i ? { ...f, [key]: key === "rank" ? Number(e.target.value) : e.target.value } : f));
    setDraft({ ...draft, finalsRankings });
  };
  const addRanking = () => setDraft({ ...draft, finalsRankings: [...draft.finalsRankings, { rank: draft.finalsRankings.length + 1, teamName: "" }] });
  const removeRanking = (i) => setDraft({ ...draft, finalsRankings: draft.finalsRankings.filter((_, idx) => idx !== i) });

  return (
    <div className="admin-tab">
      <div className="admin-tab-head">
        <h2>Conclusions</h2>
        <p>The closing section: headline stats, key findings, the closing statement, and final placements.</p>
      </div>

      <AdminBox
        title="Headline stats"
        actions={
          <button type="button" className="btn btn-ghost btn-small" onClick={addStat}>
            + Add stat
          </button>
        }
      >
        {draft.stats.map((s, i) => (
          <div className="admin-grid-2" key={i}>
            <EditorField label="Label">
              <input value={s.label} onChange={setStat(i, "label")} />
            </EditorField>
            <div className="admin-inline-actions">
              <EditorField label="Value">
                <input value={s.value} onChange={setStat(i, "value")} />
              </EditorField>
              <button type="button" className="btn btn-ghost btn-micro admin-danger" onClick={() => removeStat(i)}>
                ✕
              </button>
            </div>
          </div>
        ))}
        <SaveBar onSave={save} dirty={dirty} status={status} onReset={reset} />
      </AdminBox>

      <AdminBox
        title="Key findings"
        actions={
          <button type="button" className="btn btn-ghost btn-small" onClick={addFinding}>
            + Add finding
          </button>
        }
      >
        {draft.keyFindings.map((f, i) => (
          <div className="admin-finding" key={i}>
            <textarea value={f} onChange={setFinding(i)} rows={3} />
            <button type="button" className="btn btn-ghost btn-micro admin-danger" onClick={() => removeFinding(i)}>
              ✕
            </button>
          </div>
        ))}
        <SaveBar onSave={save} dirty={dirty} status={status} onReset={reset} />
      </AdminBox>

      <AdminBox title="Closing statement">
        <EditorField label="Closing statement">
          <textarea value={draft.closingStatement} onChange={(e) => setDraft({ ...draft, closingStatement: e.target.value })} rows={4} />
        </EditorField>
        <SaveBar onSave={save} dirty={dirty} status={status} onReset={reset} />
      </AdminBox>

      <AdminBox
        title="Finals rankings"
        actions={
          <button type="button" className="btn btn-ghost btn-small" onClick={addRanking}>
            + Add placement
          </button>
        }
      >
        {draft.finalsRankings.map((f, i) => (
          <div className="admin-grid-2" key={i}>
            <EditorField label="Place">
              <input type="number" min="1" value={f.rank} onChange={setRanking(i, "rank")} />
            </EditorField>
            <div className="admin-inline-actions">
              <EditorField label="Team name">
                <input value={f.teamName} onChange={setRanking(i, "teamName")} />
              </EditorField>
              <button type="button" className="btn btn-ghost btn-micro admin-danger" onClick={() => removeRanking(i)}>
                ✕
              </button>
            </div>
          </div>
        ))}
        <SaveBar onSave={save} dirty={dirty} status={status} onReset={reset} />
      </AdminBox>
    </div>
  );
}