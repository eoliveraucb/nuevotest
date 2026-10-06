import { useParams, Link, Navigate } from "react-router-dom";
import {
  getTeamById,
  getStudentsForTeam,
  getOverallScoreForStudent,
  getOverallScoreForTeam,
  hasFullSkillData,
  teamColor,
  checkpoints,
  skills,
  getSkillScoresForStudent,
} from "../data/index.js";
import GrowthLineChart from "../components/shared/charts/GrowthLineChart.jsx";
import useAuth from "../hooks/useAuth.js";

const RANK_LABEL = { 1: "1st Place", 2: "2nd Place", 3: "3rd Place", 4: "4th Place" };

export default function TeamPage() {
  const { teamId } = useParams();
  const { canView } = useAuth();
  const team = getTeamById(teamId);

  if (!team) return <Navigate to="/" replace />;

  const roster = getStudentsForTeam(team.id);
  const color = teamColor(team.colorIndex);
  const firstCheckpoint = checkpoints[0];
  const lastCheckpoint = checkpoints[checkpoints.length - 1];

  const teamAvgValues = checkpoints.map(
    (cp) => getOverallScoreForTeam(team.id, cp) ?? 0
  );

  return (
    <main className="team-page">
      <section
        className="team-hero"
        style={{ "--team-accent": color }}
      >
        <div className="container">
          <Link to="/#teams" className="back-link">
            ← Back to all teams
          </Link>
          <div className="team-hero-top">
            <p className="eyebrow" style={{ color }}>
              {team.impactArea}
            </p>
            {team.finalsRank && (
              <span className="team-card-rank">{RANK_LABEL[team.finalsRank]}</span>
            )}
          </div>
          <h1 className="team-hero-name">{team.name}</h1>
          <p className="team-hero-tagline">{team.tagline}</p>
          <p className="team-hero-idea">{team.businessIdea}</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="team-detail-grid">
            <div className="card team-growth-card">
              <h3 className="card-title">Team Average Growth</h3>
              <p className="card-subtitle">
                Average overall skill score (all {skills.length} competency
                areas) across the team, from {firstCheckpoint} to {lastCheckpoint}.
              </p>
              <GrowthLineChart
                checkpoints={checkpoints}
                series={[
                  { id: team.id, label: team.name, color, values: teamAvgValues },
                ]}
              />
            </div>

            <div className="card team-roster-card">
              <h3 className="card-title">Team Roster</h3>
              <ul className="roster-list">
                {roster.map((student) => {
                  const viewable = canView(student.id);
                  const pre = viewable ? getOverallScoreForStudent(student.id, firstCheckpoint) : null;
                  const post = viewable ? getOverallScoreForStudent(student.id, lastCheckpoint) : null;
                  const delta = post != null && pre != null ? post - pre : null;
                  const partial = viewable && !hasFullSkillData(student.id);
                  return (
                    <li key={student.id}>
                      <Link to={`/student/${student.id}`} className="roster-row">
                        <span
                          className="roster-avatar"
                          style={{ background: color }}
                        >
                          {student.name.charAt(0)}
                        </span>
                        <span className="roster-info">
                          <strong>{student.name}</strong>
                          {!viewable && (
                            <span className="roster-role">Growth data private</span>
                          )}
                          {partial && (
                            <span className="roster-role">Partial survey data</span>
                          )}
                        </span>
                        {viewable && delta != null ? (
                          <span className="roster-delta">
                            {delta >= 0 ? "+" : ""}
                            {delta.toFixed(1)}
                          </span>
                        ) : (
                          <span className="roster-delta roster-delta-private" title="Hidden by the student's privacy setting">
                            locked
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className="card team-skills-breakdown">
            <h3 className="card-title">Skill-by-Skill Breakdown</h3>
            <div className="skill-breakdown-grid">
              {skills.map((sk) => {
                const preValues = roster
                  .map((s) => getSkillScoresForStudent(s.id).find((r) => r.checkpoint === firstCheckpoint)?.scores[sk.id])
                  .filter((v) => v != null);
                const postValues = roster
                  .map((s) => getSkillScoresForStudent(s.id).find((r) => r.checkpoint === lastCheckpoint)?.scores[sk.id])
                  .filter((v) => v != null);
                if (!preValues.length || !postValues.length) return null;
                const preAvg = preValues.reduce((a, b) => a + b, 0) / preValues.length;
                const postAvg = postValues.reduce((a, b) => a + b, 0) / postValues.length;
                const delta = postAvg - preAvg;
                return (
                  <div key={sk.id} className="skill-breakdown-item">
                    <span className="skill-breakdown-name">{sk.name}</span>
                    <div className="skill-breakdown-bar-track">
                      <div
                        className="skill-breakdown-bar-fill"
                        style={{
                          width: `${(postAvg / 5) * 100}%`,
                          background: color,
                        }}
                      />
                    </div>
                    <span className="skill-breakdown-delta">
                      {preAvg.toFixed(1)} → {postAvg.toFixed(1)}{" "}
                      <em>({delta >= 0 ? "+" : ""}{delta.toFixed(1)})</em>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
