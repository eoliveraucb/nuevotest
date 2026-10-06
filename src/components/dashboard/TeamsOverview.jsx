import { Link } from "react-router-dom";
import {
  teams,
  getStudentsForTeam,
  getTeamGrowth,
  teamColor,
} from "../../data/index.js";
import SectionHeading from "../shared/SectionHeading.jsx";

const RANK_LABEL = { 1: "1st Place", 2: "2nd Place", 3: "3rd Place", 4: "4th Place" };

export default function TeamsOverview() {
  return (
    <section id="teams" className="section section-alt">
      <div className="container">
        <SectionHeading
          eyebrow="The Dashboards"
          title="Meet the teams."
          description="From here, the story becomes the data. Explore each team's business, then drill into individual student growth — peer feedback and glows & grows included."
        />

        <div className="teams-overview-grid">
          {teams.map((team) => {
            const roster = getStudentsForTeam(team.id);
            const growth = getTeamGrowth(team.id);
            const color = teamColor(team.colorIndex);

            return (
              <Link
                to={`/team/${team.id}`}
                key={team.id}
                className="team-card card"
                style={{ "--team-accent": color }}
              >
                <div className="team-card-top">
                  <span className="team-card-dot" style={{ background: color }} />
                  <span className="team-card-impact">{team.impactArea}</span>
                  {team.finalsRank && (
                    <span className="team-card-rank">{RANK_LABEL[team.finalsRank]}</span>
                  )}
                </div>
                <h3 className="team-card-name">{team.name}</h3>
                <p className="team-card-tagline">{team.tagline}</p>
                <p className="team-card-idea">{team.businessIdea}</p>

                <div className="team-card-footer">
                  <div className="team-card-roster">
                    {roster.slice(0, 4).map((s) => (
                      <span key={s.id} className="team-card-avatar" title={s.name}>
                        {s.name.charAt(0)}
                      </span>
                    ))}
                    <span className="team-card-count">{roster.length} students</span>
                  </div>
                  {growth != null && (
                    <span className="team-card-delta">
                      {growth.delta >= 0 ? "+" : ""}
                      {growth.delta.toFixed(1)} avg. growth
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
