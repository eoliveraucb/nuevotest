import Hero from "../components/story/Hero.jsx";
import StoryScroll from "../components/story/StoryScroll.jsx";
import OnboardingSection from "../components/onboarding/OnboardingSection.jsx";
import GrowthSection from "../components/growth/GrowthSection.jsx";
import TeamsOverview from "../components/dashboard/TeamsOverview.jsx";
import ConclusionsSection from "../components/conclusions/ConclusionsSection.jsx";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <StoryScroll />
      <OnboardingSection />
      <GrowthSection />
      <TeamsOverview />
      <ConclusionsSection />
    </main>
  );
}
