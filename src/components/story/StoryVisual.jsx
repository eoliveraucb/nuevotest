import { AnimatePresence, motion } from "framer-motion";
import { teams } from "../../data/index.js";

/**
 * Visual companion to each story chapter. Swaps illustration/graphic based
 * on which chapter is currently active in the scroll steps.
 */
export default function StoryVisual({ step }) {
  const visuals = [
    <CambioMark key="cambio" />,
    <HandoffMark key="prep" />,
    <ProgramFlow key="ife" />,
    <TeamsPreview key="teams" teams={teams} />,
    <TransitionMark key="transition" />,
  ];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="story-visual"
      >
        {visuals[step] || visuals[0]}
      </motion.div>
    </AnimatePresence>
  );
}

function CambioMark() {
  return (
    <div className="visual-panel">
      <svg viewBox="0 0 200 200" width="140" height="140">
        <circle cx="100" cy="100" r="88" fill="var(--purple-50)" />
        <circle cx="100" cy="100" r="60" fill="var(--purple-100)" />
        <path
          d="M100 40 A60 60 0 1 0 100 160"
          fill="none"
          stroke="var(--purple-500)"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <circle cx="100" cy="40" r="10" fill="var(--accent-orange)" />
      </svg>
      <p className="visual-caption">
        <strong>Cambio</strong> — Spanish for "change." A nonprofit building
        the next generation of changemakers.
      </p>
    </div>
  );
}

function HandoffMark() {
  return (
    <div className="visual-panel">
      <div className="handoff-row">
        <div className="handoff-badge">Cambio Labs</div>
        <svg width="60" height="24" viewBox="0 0 60 24">
          <path
            d="M2 12H58M58 12L46 2M58 12L46 22"
            stroke="var(--purple-400)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="handoff-badge handoff-badge-alt">Prep for Prep</div>
      </div>
      <p className="visual-caption">
        Together, they created the <strong>Institute for Entrepreneurship</strong> —
        a launchpad for student-built businesses.
      </p>
    </div>
  );
}

function ProgramFlow() {
  const stages = ["Ideation", "Research", "Financial Planning", "Prototyping", "Final Pitch"];
  return (
    <div className="visual-panel">
      <div className="program-flow">
        {stages.map((s, i) => (
          <div key={s} className="program-flow-stage">
            <div className="program-flow-dot">{i + 1}</div>
            <span>{s}</span>
            {i < stages.length - 1 && <div className="program-flow-line" />}
          </div>
        ))}
      </div>
      <p className="visual-caption">
        Students moved through every phase of building a real business —
        guided by mentors at each step.
      </p>
    </div>
  );
}

function TeamsPreview({ teams }) {
  return (
    <div className="visual-panel">
      <div className="teams-preview-grid teams-preview-grid-compact">
        {teams.map((t) => (
          <div
            key={t.id}
            className="teams-preview-card teams-preview-card-compact"
            style={{ borderColor: `var(--team-color-${t.colorIndex % 9})` }}
          >
            <span
              className="teams-preview-dot"
              style={{ background: `var(--team-color-${t.colorIndex % 9})` }}
            />
            <strong>{t.name}</strong>
          </div>
        ))}
      </div>
      <p className="visual-caption">
        {teams.length} teams. {teams.length} community problems. {teams.length}{" "}
        businesses, built from scratch.
      </p>
    </div>
  );
}

function TransitionMark() {
  return (
    <div className="visual-panel">
      <svg viewBox="0 0 200 160" width="220" height="176">
        <path
          d="M10 130 Q 60 20, 110 90 T 190 40"
          fill="none"
          stroke="var(--purple-200)"
          strokeWidth="4"
          strokeDasharray="2 8"
          strokeLinecap="round"
        />
        <path
          d="M10 130 Q 60 60, 110 100 T 190 60"
          fill="none"
          stroke="var(--purple-500)"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <circle cx="10" cy="130" r="6" fill="var(--purple-300)" />
        <circle cx="190" cy="60" r="8" fill="var(--accent-orange)" />
      </svg>
      <p className="visual-caption">
        From where students started, to how far they came — the data tells
        the rest of the story.
      </p>
    </div>
  );
}
