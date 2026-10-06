import { teams, getTeamGrowth, teamColor } from "../../data/index.js";
import { useScrollProgress } from "../../hooks/useScrollProgress.js";

/**
 * A playful "camp field day" alternate view of the same growth data shown in
 * the analytical line chart: each team is a lane, each runner's position
 * reflects how much that team grew (on average) from the first to the last
 * skill checkpoint. Purely decorative/illustrative — simple flat SVG shapes,
 * animated into position as the section scrolls into view.
 */
export default function TeamRace() {
  const [containerRef, progress] = useScrollProgress();

  const lanes = teams
    .map((team) => ({ team, growth: getTeamGrowth(team.id) }))
    .filter((l) => l.growth != null)
    .sort((a, b) => b.growth.delta - a.growth.delta);

  const maxDelta = Math.max(...lanes.map((l) => l.growth.delta), 0.1);
  const runProgress = Math.min(1, Math.max(0, (progress - 0.15) / 0.7));
  const toTrackPct = (delta) => Math.min(94, Math.max(4, 6 + (delta / maxDelta) * 82));

  return (
    <div className="team-race" ref={containerRef}>
      <p className="team-race-caption">
        Each runner's finishing position reflects that team's average skill
        growth from onboarding to exit — furthest right grew the most.
      </p>
      <div className="team-race-track-list">
        {lanes.map(({ team, growth }, i) => {
          const targetPct = toTrackPct(growth.delta);
          const pct = 4 + (targetPct - 4) * runProgress;
          const color = teamColor(team.colorIndex);
          return (
            <div className="team-race-lane" key={team.id}>
              <div className="team-race-lane-label">
                <span
                  className="team-race-lane-dot"
                  style={{ background: color }}
                />
                <span className="team-race-lane-name">{team.name}</span>
              </div>
              <div className="team-race-lane-track">
                <div className="team-race-finish" aria-hidden="true">
                  🏁
                </div>
                <div
                  className="team-race-runner"
                  style={{ left: `${pct}%`, transitionDelay: `${i * 40}ms` }}
                  title={`${team.name}: ${growth.delta >= 0 ? "+" : ""}${growth.delta.toFixed(1)} avg. growth`}
                >
                  <RunnerIcon color={color} />
                  <span className="team-race-runner-value">
                    {growth.delta >= 0 ? "+" : ""}
                    {growth.delta.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RunnerIcon({ color }) {
  return (
    <svg width="30" height="34" viewBox="0 0 30 34" aria-hidden="true">
      <circle cx="16" cy="6" r="5" fill={color} />
      <path
        d="M16 11 L16 20 M16 14 L8 20 M16 14 L24 12 M16 20 L10 32 M16 20 L21 31"
        stroke={color}
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
