import { useParams, Link, Navigate } from "react-router-dom";
import {
  getStudentById,
  getTeamById,
  getSkillScoresForStudent,
  getPeerReviewForStudent,
  getGlowsGrowsForStudent,
  getSelfReflectionForStudent,
  hasFullSkillData,
  teamColor,
  skills,
  checkpoints,
  getStudentsForTeam,
} from "../data/index.js";
import RadarChart from "../components/shared/charts/RadarChart.jsx";
import GrowthLineChart from "../components/shared/charts/GrowthLineChart.jsx";
import PrivacyPanel from "../components/auth/PrivacyPanel.jsx";
import useAuth from "../hooks/useAuth.js";

function PrivacyLock({ student, team }) {
  return (
    <section className="section">
      <div className="container">
        <div className="card privacy-lock">
          <h3 className="card-title">Data hidden</h3>
          <p className="card-subtitle">
            {student.name} has chosen to keep their skill growth &amp; feedback
            private. Check back later, or ask {student.name.split(" ")[0] || "them"}{" "}
            on {team?.name || "their team"} to share it with you.
          </p>
        </div>
      </div>
    </section>
  );
}

export default function StudentPage() {
  const { studentId } = useParams();
  const { canView } = useAuth();
  const allowed = canView(studentId);

  const student = getStudentById(studentId);
  if (!student) return <Navigate to="/" replace />;

  const team = getTeamById(student.teamId);
  const color = teamColor(team?.colorIndex ?? 0);
  const teammates = (getStudentsForTeam(student.teamId) || []).filter(
    (s) => s.id !== student.id
  );

  const skillRows = getSkillScoresForStudent(student.id);
  const peerReview = getPeerReviewForStudent(student.id);
  const glowsGrows = getGlowsGrowsForStudent(student.id);
  const selfReflection = getSelfReflectionForStudent(student.id);

  const firstCheckpoint = checkpoints[0];
  const lastCheckpoint = checkpoints[checkpoints.length - 1];
  const preRow = skillRows.find((r) => r.checkpoint === firstCheckpoint);
  const postRow = skillRows.find((r) => r.checkpoint === lastCheckpoint);
  const isPartial = !hasFullSkillData(student.id);

  const radarAxes = skills.map((s) => ({ id: s.id, label: s.name }));
  const radarSeries = [];
  if (allowed && preRow) {
    radarSeries.push({
      label: firstCheckpoint,
      color: "var(--purple-200)",
      values: skills.map((s) => ({ axis: s.id, value: preRow.scores[s.id] ?? 0 })),
    });
  }
  if (allowed && postRow) {
    radarSeries.push({
      label: lastCheckpoint,
      color,
      values: skills.map((s) => ({ axis: s.id, value: postRow.scores[s.id] ?? 0 })),
    });
  }

  const overallSeries = checkpoints.map((cp) => {
    const row = skillRows.find((r) => r.checkpoint === cp);
    if (!row) return null;
    const values = Object.values(row.scores);
    return values.reduce((a, b) => a + b, 0) / values.length;
  });
  const hasOverallSeries = overallSeries.every((v) => v != null);

  return (
    <main className="student-page">
      <section className="student-hero" style={{ "--team-accent": color }}>
        <div className="container">
          <Link to={`/team/${team?.id}`} className="back-link">
            ← Back to {team?.name}
          </Link>
          <div className="student-hero-row">
            <span className="student-hero-avatar" style={{ background: color }}>
              {student.name.charAt(0)}
            </span>
            <div>
              <h1 className="student-hero-name">{student.name}</h1>
              <p className="student-hero-role">{team?.name}</p>
            </div>
          </div>
          {isPartial && allowed && (
            <p className="partial-data-note">
              This student is missing one of the two skill surveys ({!preRow ? firstCheckpoint : lastCheckpoint}),
              so some growth comparisons below are incomplete.
            </p>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="privacy-panel-wrap">
            <PrivacyPanel studentId={student.id} />
          </div>

          {!allowed ? (
            <PrivacyLock student={student} team={team} />
          ) : (
            <>
              <div className="student-detail-grid">
                <div className="card">
                  <h3 className="card-title">Skill Profile</h3>
                  <p className="card-subtitle">
                    {radarSeries.length === 2
                      ? `${firstCheckpoint} vs. ${lastCheckpoint}, self-assessed.`
                      : `${radarSeries[0]?.label ?? "No data"}, self-assessed.`}
                  </p>
                  {radarSeries.length > 0 ? (
                    <>
                      <div className="onboarding-radar-wrap">
                        <RadarChart axes={radarAxes} series={radarSeries} />
                      </div>
                      <div className="legend-row">
                        {radarSeries.map((s) => (
                          <span key={s.label} className="legend-item">
                            <i style={{ background: s.color }} /> {s.label}
                          </span>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="empty-state">No skill survey data available.</p>
                  )}
                </div>

                <div className="card">
                  <h3 className="card-title">Overall Growth</h3>
                  <p className="card-subtitle">
                    Average across all {skills.length} skill areas, self-assessed at each checkpoint.
                  </p>
                  {hasOverallSeries ? (
                    <GrowthLineChart
                      checkpoints={checkpoints}
                      series={[{ id: "overall", label: "Overall Score", color, values: overallSeries }]}
                    />
                  ) : (
                    <p className="empty-state">
                      Not enough checkpoints with data to chart growth yet.
                    </p>
                  )}
                </div>
              </div>

              <div className="student-detail-grid">
                <div className="card">
                  <h3 className="card-title">Peer Feedback — Midway</h3>
                  <p className="card-subtitle">
                    {peerReview
                      ? `From ${peerReview.reviewerCount} teammate${peerReview.reviewerCount === 1 ? "" : "s"}.`
                      : "No peer feedback recorded yet."}
                  </p>
                  <div className="comment-list">
                    {peerReview?.comments.length ? (
                      peerReview.comments.map((c, i) => (
                        <p key={i} className="comment-item">
                          "{c}"
                        </p>
                      ))
                    ) : (
                      <p className="empty-state">No shoutouts recorded.</p>
                    )}
                  </div>
                </div>

                <div className="card glows-grows-card">
                  <h3 className="card-title">Glows &amp; Grows — Midway</h3>
                  <p className="card-subtitle">What teammates noticed about this student.</p>
                  {glowsGrows ? (
                    <div className="glows-grows-grid">
                      <div>
                        <h4 className="glow-heading">✦ Glows</h4>
                        <ul>
                          {glowsGrows.glows.map((g, i) => (
                            <li key={i}>{g}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="grow-heading">↗ Grows</h4>
                        <ul>
                          {glowsGrows.grows.map((g, i) => (
                            <li key={i}>{g}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <p className="empty-state">No glows/grows recorded.</p>
                  )}
                </div>
              </div>

              {selfReflection && (selfReflection.goingWell || selfReflection.challenge) && (
                <div className="card self-reflection-card">
                  <h3 className="card-title">In Their Own Words — Midway</h3>
                  {selfReflection.goingWell && (
                    <p className="comment-item comment-item-highlight">
                      "{selfReflection.goingWell}"
                    </p>
                  )}
                  {selfReflection.challenge && (
                    <p className="comment-item comment-item-highlight">
                      "{selfReflection.challenge}"
                    </p>
                  )}
                </div>
              )}

              {teammates.length > 0 && (
                <div className="card teammates-card">
                  <h3 className="card-title">Teammates</h3>
                  <div className="teammate-list">
                    {teammates.map((t) => (
                      <Link key={t.id} to={`/student/${t.id}`} className="teammate-chip">
                        <span className="team-card-avatar" style={{ background: color }}>
                          {t.name.charAt(0)}
                        </span>
                        <span>{t.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}