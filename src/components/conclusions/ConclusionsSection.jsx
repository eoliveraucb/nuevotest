import { conclusions } from "../../data/index.js";
import SectionHeading from "../shared/SectionHeading.jsx";

export default function ConclusionsSection() {
  return (
    <section id="conclusions" className="section section-dark">
      <div className="container">
        <SectionHeading
          eyebrow="The Impact"
          title="What the data tells us."
          align="left"
        />

        <div className="stats-row">
          {conclusions.stats.map((stat) => (
            <div key={stat.label} className="stat-card">
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          ))}
        </div>

        <div className="findings-grid">
          <div className="findings-list">
            <h3>Key Findings</h3>
            <ul>
              {conclusions.keyFindings.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </div>

          <div className="closing-statement">
            <p>{conclusions.closingStatement}</p>
            <div className="closing-signature">
              <strong>Cambio Labs</strong> × <strong>Prep for Prep</strong>
              <span>Institute for Entrepreneurship</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
