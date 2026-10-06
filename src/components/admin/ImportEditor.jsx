import { useRef, useState } from "react";
import { parse } from "csv-parse/sync";
import { renderProgramData } from "../../lib/importFromCsv.js";
import useContent from "../../hooks/useContent.js";
import { AdminBox } from "./editor-ui.jsx";

export default function ImportEditor({ programId }) {
  const { saveField, activeProgramId } = useContent();
  const fileRef = useRef(null);
  const [csv, setCsv] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const readFile = (f) => {
    const reader = new FileReader();
    reader.onload = () => setCsv(String(reader.result || ""));
    reader.readAsText(f);
  };

  const analyze = () => {
    setError(null);
    setResult(null);
    setSaved(false);
    if (!csv.trim()) {
      setError("Paste or upload the platform export CSV first.");
      return;
    }
    setAnalyzing(true);
    try {
      const rows = parse(csv, { columns: true, skip_empty_lines: true });
      if (!rows.length) throw new Error("No rows found in that CSV.");
      const { files, diagnostics } = renderProgramData(rows);
      setResult({ files, diagnostics });
    } catch (e) {
      setError(e.message || "Could not parse that CSV.");
    } finally {
      setAnalyzing(false);
    }
  };

  const saveAll = async () => {
    if (!result) return;
    setSaving(true);
    setError(null);
    for (const [filename, data] of Object.entries(result.files)) {
      const field = filename.replace(/\.json$/, "");
      const { error: err } = await saveField(programId, field, data);
      if (err) {
        setError(`Failed saving ${filename}: ${err.message}`);
        setSaving(false);
        return;
      }
    }
    setSaving(false);
    setSaved(true);
  };

  const download = (filename, data) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const d = result?.diagnostics;
  const coverGap =
    d && (d.missingSurvey.onboardingOnly.length + d.missingSurvey.exitOnly.length + d.missingSurvey.neither.length > 0);

  return (
    <div className="admin-tab">
      <div className="admin-tab-head">
        <h2>Import data</h2>
        <p>
          Upload the platform survey export for this program. It runs the exact same pipeline as{" "}
          <code>node scripts/importRealData.mjs</code> — parsing 42-question onboarding/exit surveys
          and the Midway self-reflection + peer-evaluation blocks.
        </p>
      </div>

      <AdminBox title="Source CSV" description="Platform export with columns: Checkpoint, Lesson, Prompt, Student Name, Answer 1–42.">
        <textarea
          className="admin-csv-input"
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          placeholder={`Paste the CSV here, or use the file picker below.\n\nExample for hand-typing the header row:\nCheckpoint,Lesson,Prompt,Student Name,Answer 1,"Answer 2",…`}
          rows={8}
        />
        <div className="admin-csv-actions">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) readFile(f);
              if (fileRef.current) fileRef.current.value = "";
            }}
          />
          <button type="button" className="btn btn-small" disabled={analyzing} onClick={analyze}>
            {analyzing ? "Analyzing…" : "Analyze"}
          </button>
        </div>
        {error && <p className="admin-error">{error}</p>}
      </AdminBox>

      {d && (
        <AdminBox
          title="Import preview"
          description="What this import produces — check coverage before saving."
          actions={
            <div className="admin-inline-actions">
              <button type="button" className="btn btn-small" disabled={saving} onClick={saveAll}>
                {saving ? "Saving…" : saved ? "Saved ✓" : `Save to ${activeProgramId}`}
              </button>
            </div>
          }
        >
          <div className="admin-diagnostics">
            <div className="admin-diag">
              <strong>{d.onboardingCount}</strong>
              <span>onboarding rows</span>
            </div>
            <div className="admin-diag">
              <strong>{d.exitCount}</strong>
              <span>exit rows</span>
            </div>
            <div className="admin-diag">
              <strong>{d.midwayCount}</strong>
              <span>midway rows</span>
            </div>
            <div className="admin-diag">
              <strong>{d.selfReflectionCount}</strong>
              <span>self-reflections</span>
            </div>
            <div className="admin-diag">
              <strong>{d.peerReviewCount}</strong>
              <span>peer feedback</span>
            </div>
          </div>

          <p className="admin-diag-coverage">
            Survey coverage — both: <strong>{d.missingSurvey.both}</strong>, onboarding only:{" "}
            <strong>{d.missingSurvey.onboardingOnly.length}</strong>, exit only:{" "}
            <strong>{d.missingSurvey.exitOnly.length}</strong>, neither:{" "}
            <strong>{d.missingSurvey.neither.length}</strong>
          </p>
          {coverGap && (
            <p className="admin-warning">
              Some students are missing a survey. Missing names:{" "}
              {[...d.missingSurvey.onboardingOnly, ...d.missingSurvey.exitOnly, ...d.missingSurvey.neither].join(", ") || "none"}.
            </p>
          )}

          <div className="admin-downloads">
            <span className="admin-downloads-label">Download output:</span>
            {Object.entries(result.files).map(([filename, data]) => (
              <button key={filename} type="button" className="demo-link" onClick={() => download(filename, data)}>
                {filename}
              </button>
            ))}
          </div>
        </AdminBox>
      )}
    </div>
  );
}