import { useState } from "react";
import { checkpoints, getGrowthSeries, skills } from "../../data/index.js";
import GrowthLineChart from "../shared/charts/GrowthLineChart.jsx";
import SectionHeading from "../shared/SectionHeading.jsx";
import TeamRace from "./TeamRace.jsx";

const PALETTE = [
  "var(--purple-500)",
  "var(--accent-orange)",
  "var(--purple-300)",
  "var(--accent-coral)",
  "var(--purple-700)",
  "var(--accent-gold)",
  "var(--accent-green)",
  "var(--purple-200)",
];

export default function GrowthSection() {
  const growthSeries = getGrowthSeries();
  const [activeSkillIds, setActiveSkillIds] = useState(
    skills.slice(0, 3).map((s) => s.id)
  );
  const [view, setView] = useState("chart");

  const toggleSkill = (id) => {
    setActiveSkillIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const chartSeries = growthSeries
    .filter((g) => activeSkillIds.includes(g.skill.id))
    .map((g, i) => ({
      id: g.skill.id,
      label: g.skill.name,
      color: PALETTE[skills.findIndex((s) => s.id === g.skill.id) % PALETTE.length],
      values: g.series.map((s) => s.value),
    }));

  return (
    <section id="growth" className="section">
      <div className="container">
        <SectionHeading
          eyebrow="How They Changed"
          title="Growth, checkpoint by checkpoint."
          description="Every student completed the same skill self-assessment at the start and end of the program. Toggle skills below to compare how the cohort grew from onboarding to their final exit survey."
        />

        <div className="growth-chart-card card">
          <div className="growth-view-toggle" role="tablist" aria-label="Growth view">
            <button
              role="tab"
              aria-selected={view === "chart"}
              className={`view-toggle-btn ${view === "chart" ? "is-active" : ""}`}
              onClick={() => setView("chart")}
            >
              📈 Chart view
            </button>
            <button
              role="tab"
              aria-selected={view === "race"}
              className={`view-toggle-btn ${view === "race" ? "is-active" : ""}`}
              onClick={() => setView("race")}
            >
              🏃 Race view
            </button>
          </div>

          {view === "chart" ? (
            <>
              <div className="skill-toggle-row">
                {skills.map((sk, i) => {
                  const active = activeSkillIds.includes(sk.id);
                  return (
                    <button
                      key={sk.id}
                      className={`skill-toggle ${active ? "is-active" : ""}`}
                      style={
                        active
                          ? {
                              borderColor: PALETTE[i % PALETTE.length],
                              color: PALETTE[i % PALETTE.length],
                              background: "var(--purple-50)",
                            }
                          : undefined
                      }
                      onClick={() => toggleSkill(sk.id)}
                    >
                      {sk.name}
                    </button>
                  );
                })}
              </div>

              {chartSeries.length > 0 ? (
                <GrowthLineChart checkpoints={checkpoints} series={chartSeries} />
              ) : (
                <p className="empty-state">Select at least one skill to compare.</p>
              )}
            </>
          ) : (
            <TeamRace />
          )}
        </div>
      </div>
    </section>
  );
}
