import { getOnboardingSkillAverages, students, skills, checkpoints } from "../../data/index.js";
import RadarChart from "../shared/charts/RadarChart.jsx";
import BarRow from "../shared/charts/BarRow.jsx";
import SectionHeading from "../shared/SectionHeading.jsx";

export default function OnboardingSection() {
  const averages = getOnboardingSkillAverages();
  const checkpointLabel = checkpoints[0] || "Onboarding";

  const radarSeries = [
    {
      label: `Cohort Average — ${checkpointLabel}`,
      color: "var(--purple-400)",
      values: averages.map((a) => ({ axis: a.skill.id, value: a.value })),
    },
  ];

  const axes = averages.map((a) => ({ id: a.skill.id, label: a.skill.name }));

  const sorted = [...averages].sort((a, b) => a.value - b.value);

  return (
    <section id="onboarding" className="section section-alt">
      <div className="container">
        <SectionHeading
          eyebrow="Where They Started"
          title="Before the first pitch."
          description={`Before diving into their businesses, all ${students.length} students completed a baseline self-assessment across ${skills.length} core entrepreneurship skill areas. This is what the cohort looked like on day one.`}
        />

        <div className="onboarding-grid">
          <div className="card onboarding-radar-card">
            <h3 className="card-title">Cohort Skill Snapshot</h3>
            <div className="onboarding-radar-wrap">
              <RadarChart axes={axes} series={radarSeries} />
            </div>
            <p className="card-footnote">
              Self-assessed, 1–5 scale, averaged across all students at
              program start.
            </p>
          </div>

          <div className="card onboarding-bars-card">
            <h3 className="card-title">Lowest Starting Skills</h3>
            <p className="card-subtitle">
              These are the areas students told us, in their own words, felt
              least familiar walking in.
            </p>
            <div className="bar-row-list">
              {sorted.slice(0, 4).map((a) => (
                <BarRow
                  key={a.skill.id}
                  label={a.skill.name}
                  value={a.value}
                  color="var(--accent-orange)"
                />
              ))}
            </div>

            <h3 className="card-title card-title-spaced">
              Highest Starting Skills
            </h3>
            <div className="bar-row-list">
              {sorted
                .slice(-4)
                .reverse()
                .map((a) => (
                  <BarRow
                    key={a.skill.id}
                    label={a.skill.name}
                    value={a.value}
                    color="var(--purple-500)"
                  />
                ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
