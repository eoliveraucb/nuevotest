import { AdminBox, SaveBar } from "./editor-ui.jsx";
import useDraft from "../../hooks/useDraft.js";
import useContent from "../../hooks/useContent.js";
import { students, teams } from "../../data/index.js";

export default function StudentsEditor({ programId }) {
  const { saveField } = useContent();

  const { draft, setDraft, status, dirty, save: saveDraft, reset } = useDraft(
    () => students.map((s) => ({ ...s })),
    save
  );

  async function save(data) {
    // When members move between teams, keep each team's memberIds in sync.
    const memberMap = {};
    for (const s of data) {
      memberMap[s.teamId] = memberMap[s.teamId] || [];
      memberMap[s.teamId].push(s.id);
    }
    const teamsData = teams.map((t) => ({ ...t, memberIds: memberMap[t.id] || [] }));
    const { error } = await saveField(programId, "students", data);
    if (!error) await saveField(programId, "teams", teamsData);
    return { error };
  }

  const setStudent = (i, key) => (e) => {
    const next = draft.map((s, idx) => (idx === i ? { ...s, [key]: e.target.value } : s));
    setDraft(next);
  };
  const setStudentFlag = (i, key) => (e) => {
    const next = draft.map((s, idx) => (idx === i ? { ...s, [key]: e.target.checked } : s));
    setDraft(next);
  };
  const addStudent = () => {
    const n = draft.length;
    setDraft([
      ...draft,
      {
        id: `s${String(n + 1).padStart(3, "0")}`,
        name: "",
        teamId: teams[0]?.id || "",
        hasOnboarding: false,
        hasExit: false,
      },
    ]);
  };
  const removeStudent = (i) => setDraft(draft.filter((_, idx) => idx !== i));

  return (
    <div className="admin-tab">
      <div className="admin-tab-head">
        <h2>Students</h2>
        <p>Rename students or move them between teams. Team rosters update automatically when you save.</p>
      </div>

      <AdminBox
        title={`${draft.length} students`}
        actions={
          <button type="button" className="btn btn-ghost btn-small" onClick={addStudent}>
            + Add student
          </button>
        }
      >
        <div className="admin-table">
          <div className="admin-table-head">
            <span>Id</span>
            <span>Name</span>
            <span>Team</span>
            <span>Onboarding</span>
            <span>Exit</span>
            <span />
          </div>
          {draft.map((s, i) => (
            <div className="admin-table-row" key={s.id || i}>
              <input value={s.id} onChange={setStudent(i, "id")} className="admin-id-input" />
              <input value={s.name} onChange={setStudent(i, "name")} placeholder="Student name" />
              <select value={s.teamId} onChange={setStudent(i, "teamId")}>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name || t.id}
                  </option>
                ))}
              </select>
              <label className="admin-check">
                <input type="checkbox" checked={Boolean(s.hasOnboarding)} onChange={setStudentFlag(i, "hasOnboarding")} />
              </label>
              <label className="admin-check">
                <input type="checkbox" checked={Boolean(s.hasExit)} onChange={setStudentFlag(i, "hasExit")} />
              </label>
              <button type="button" className="btn btn-ghost btn-micro admin-danger" onClick={() => removeStudent(i)}>
                ✕
              </button>
            </div>
          ))}
        </div>
        <SaveBar onSave={saveDraft} dirty={dirty} status={status} onReset={reset} />
      </AdminBox>
    </div>
  );
}