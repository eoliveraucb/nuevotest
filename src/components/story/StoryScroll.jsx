import { story, teams } from "../../data/index.js";
import { useActiveStep } from "../../hooks/useActiveStep.js";
import StoryVisual from "./StoryVisual.jsx";

export default function StoryScroll() {
  const chapters = story.chapters;
  const { setStepRef, activeStep } = useActiveStep(chapters.length);

  return (
    <section className="story-scroll">
      <div className="container story-scroll-grid">
        <div className="story-scroll-steps">
          {chapters.map((ch, i) => (
            <div
              key={ch.id}
              ref={setStepRef(i)}
              className={`story-step ${activeStep === i ? "is-active" : ""}`}
            >
              <span className="story-step-index">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h2>{ch.heading}</h2>
              <div className="story-visual-frame story-visual-frame-inline">
                <StoryVisual step={i} teamCount={teams.length} />
              </div>
              <p>{ch.body}</p>
            </div>
          ))}
        </div>

        <div className="story-scroll-sticky">
          <div className="story-visual-frame">
            <StoryVisual step={activeStep} teamCount={teams.length} />
          </div>
        </div>
      </div>
    </section>
  );
}
