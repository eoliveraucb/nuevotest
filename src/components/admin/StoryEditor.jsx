import { AdminBox, EditorField, SaveBar } from "./editor-ui.jsx";
import useDraft from "../../hooks/useDraft.js";
import useContent from "../../hooks/useContent.js";
import { story } from "../../data/index.js";

export default function StoryEditor({ programId }) {
  const { saveField } = useContent();
  const { draft, setDraft, status, dirty, save, reset } = useDraft(
    () => cloneStory(story),
    (data) => saveField(programId, "story", data)
  );

  const setHero = (key) => (e) => setDraft({ ...draft, hero: { ...draft.hero, [key]: e.target.value } });
  const setChapter = (i, key) => (e) => {
    const chapters = draft.chapters.map((c, idx) => (idx === i ? { ...c, [key]: e.target.value } : c));
    setDraft({ ...draft, chapters });
  };
  const addChapter = () => {
    const chapters = [...draft.chapters, { id: "", heading: "", body: "" }];
    setDraft({ ...draft, chapters });
  };
  const removeChapter = (i) => {
    const chapters = draft.chapters.filter((_, idx) => idx !== i);
    setDraft({ ...draft, chapters });
  };
  const moveChapter = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= draft.chapters.length) return;
    const chapters = [...draft.chapters];
    [chapters[i], chapters[j]] = [chapters[j], chapters[i]];
    setDraft({ ...draft, chapters });
  };

  return (
    <div className="admin-tab">
      <div className="admin-tab-head">
        <h2>Story</h2>
        <p>Edit the hero and the scrollytelling chapters at the top of the site.</p>
      </div>

      <AdminBox
        title="Hero"
        description="The opening screen visitors read before they scroll."
        actions={<SaveBar onSave={save} dirty={dirty} status={status} onReset={reset} />}
      >
        <div className="admin-grid-2">
          <EditorField label="Kicker">
            <input value={draft.hero?.kicker || ""} onChange={setHero("kicker")} />
          </EditorField>
          <EditorField label="Scroll cue">
            <input value={draft.hero?.scrollCue || ""} onChange={setHero("scrollCue")} />
          </EditorField>
        </div>
        <EditorField label="Title">
          <input value={draft.hero?.title || ""} onChange={setHero("title")} />
        </EditorField>
        <EditorField label="Subtitle">
          <textarea value={draft.hero?.subtitle || ""} onChange={setHero("subtitle")} rows={3} />
        </EditorField>
      </AdminBox>

      <AdminBox
        title="Chapters"
        description="Each chapter is a scroll step. Drag order via up/down buttons."
        actions={
          <button type="button" className="btn btn-ghost btn-small" onClick={addChapter}>
            + Add chapter
          </button>
        }
      >
        {draft.chapters?.map((c, i) => (
          <div className="admin-chapter card" key={i}>
            <div className="admin-chapter-head">
              <strong>Chapter {i + 1}</strong>
              <div className="admin-chapter-actions">
                <button type="button" className="btn btn-ghost btn-micro" disabled={i === 0} onClick={() => moveChapter(i, -1)}>
                  ↑
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-micro"
                  disabled={i === draft.chapters.length - 1}
                  onClick={() => moveChapter(i, 1)}
                >
                  ↓
                </button>
                <button type="button" className="btn btn-ghost btn-micro admin-danger" onClick={() => removeChapter(i)}>
                  ✕
                </button>
              </div>
            </div>
            <div className="admin-grid-2">
              <EditorField label="Heading">
                <input value={c.heading} onChange={setChapter(i, "heading")} />
              </EditorField>
              <EditorField label="Anchor id">
                <input value={c.id} onChange={setChapter(i, "id")} />
              </EditorField>
            </div>
            <EditorField label="Body">
              <textarea value={c.body} onChange={setChapter(i, "body")} rows={4} />
            </EditorField>
          </div>
        ))}
        {(!draft.chapters || draft.chapters.length === 0) && (
          <p className="admin-empty">No chapters yet.</p>
        )}
      </AdminBox>
    </div>
  );
}

function cloneStory(s) {
  return {
    hero: { ...s.hero },
    chapters: (s.chapters || []).map((c) => ({ ...c })),
  };
}