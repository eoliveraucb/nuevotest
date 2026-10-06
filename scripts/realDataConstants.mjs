/**
 * Hand-verified constants extracted from the real program source documents:
 *   - raw-data/IFE_Data.docx                  -> team rosters, business ideas, Finals rankings
 *   - raw-data/Survey Questions.docx           -> the 42-question skill category mapping
 *
 * These are intentionally hardcoded (not re-parsed from the docx at import time) because
 * the docx text extraction was verified by hand against this exact list. If the roster or
 * survey structure changes for a future cohort, update this file to match.
 */

// ---------------------------------------------------------------------------
// TEAMS — id, display name, tagline, business idea (condensed problem+solution),
// impact area, and Finals placement (1-4, or null if not a finalist/placed).
// ---------------------------------------------------------------------------
export const TEAMS = [
  {
    id: "team-healthlink",
    name: "HealthLink",
    tagline: "Helping New Yorkers navigate healthcare, one clinic at a time.",
    businessIdea:
      "Many New Yorkers, especially in low-income communities, struggle to access affordable healthcare and understand the complex healthcare system. CareNYC helps residents find nearby doctors and clinics that accept their insurance, locate low-cost or free options, navigate the healthcare system step by step, and get personalized recommendations.",
    impactArea: "Healthcare Access",
    finalsRank: null,
    members: ["Adam Fatehali", "Victoria Giwa", "Valentina Girard", "Ali Heikal"],
  },
  {
    id: "team-beliterate",
    name: "beLITerate",
    tagline: "Making political and financial literacy accessible to every student.",
    businessIdea:
      "Low-income youth need an accessible, flexible way to feel confident about their political and financial futures, but many communities lack these opportunities. beLITerate runs in-person classes led by financial and political professionals and prep alumni, supplemented by online courses for wider accessibility.",
    impactArea: "Civic & Financial Literacy",
    finalsRank: null,
    members: ["Sebastien Amor", "Jigsel Gontsang", "Stephanie Yu", "Elizabeth Saka", "Erumena Izeghe"],
  },
  {
    id: "team-subcycle",
    name: "SubCycle",
    tagline: "Turning subway trash into rewards.",
    businessIdea:
      "NYC subway riders suffer from poor sanitation caused by littering, which attracts vermin and discourages cleanliness. SubCycle creates an incentive system that rewards people for properly throwing away their trash in the subway system.",
    impactArea: "Urban Sustainability",
    finalsRank: null,
    members: ["Tahsan Hoque", "Daniyal Fatehali", "Sebastian King-Davis", "Elijah Adewunmi"],
  },
  {
    id: "team-lawleo",
    name: "LAWLEO",
    tagline: "Bridging the language gap in the legal system.",
    businessIdea:
      "Immigrants and minorities need a way to instantly and easily defend themselves from legal exploitation, fear, and confusion caused by language barriers and legal jargon. LAWLEO bridges the language gap and makes legal information accessible for marginalized groups.",
    impactArea: "Legal Access & Immigration",
    finalsRank: 3,
    members: ["Sarah Etienne", "Alexander Lopez Martinez", "Samiha Tasnim", "Antonio Wright-Verdejo"],
  },
  {
    id: "team-keystone-careers",
    name: "Keystone Careers",
    tagline: "Connecting overlooked job seekers to real opportunity.",
    businessIdea:
      "Poverty keeps people stuck even when work is available, because low-income and formerly incarcerated individuals often lack access to opportunities. Keystone Careers connects them with companies in need of labor while sharpening their skills for stable, long-term jobs.",
    impactArea: "Workforce Development",
    finalsRank: 4,
    members: ["Alex Rowe", "Cameron Jenkins", "Max Finisterre", "Kejaun  Jones", "Salali SaltPaw"],
  },
  {
    id: "team-thebetterorder",
    name: "TheBetterOrder",
    tagline: "Making the healthy order the easy order.",
    businessIdea:
      "People who rely on fast food, especially low-income families and those managing nutrition-related illness, need a simple way to find healthier menu options. TheBetterOrder displays healthier menu choices at nearby restaurants based on budget, helping users understand what they're consuming.",
    impactArea: "Health & Nutrition",
    finalsRank: 1,
    members: ["Gabrielle Boateng", "Mahawa Bagayoko", "Sulien Diaz", "Thomas Chu"],
  },
  {
    id: "team-classconnect",
    name: "ClassConnect",
    tagline: "Affordable tutoring, close to home.",
    businessIdea:
      "Low-income parents want a good education for their children but often can't afford or access tutoring programs. ClassConnect improves education quality for lower-income families by giving them access to cheap, local tutoring services.",
    impactArea: "Education Access",
    finalsRank: null,
    members: ["Carter Crump", "Tahleel Aayan", "Ava Hansen", "Tima Yara"],
  },
  {
    id: "team-amicable",
    name: "Amicable",
    tagline: "Helping job seekers compete in the age of AI.",
    businessIdea:
      "AI is displacing jobs in an increasingly competitive market, leaving many recent graduates and unemployed people struggling to find work. Amicable is a website that helps students find jobs in today's challenging job market.",
    impactArea: "Workforce & Technology",
    finalsRank: null,
    members: ["Danny Lam", "mikayla grullon", "Awa Sangare", "Tenzin Lhading"],
  },
  {
    id: "team-forage",
    name: "Forage",
    tagline: "Finding food security today, not someday.",
    businessIdea:
      "Many food-insecure New Yorkers struggle to access food assistance programs due to limited awareness, transportation challenges, and complicated eligibility requirements. Forage helps them find the best food option available today using verified hours, availability, language access, ID rules, dietary needs, and transit distance.",
    impactArea: "Food Access & Security",
    finalsRank: 2,
    members: ["Luca Webb", "Earl Carter", "David Lozado", "Sophia Vega"],
  },
];

// ---------------------------------------------------------------------------
// SKILL CATEGORIES — the 42 onboarding/exit survey questions, grouped into
// 7 categories of 6 questions each (1-indexed, inclusive ranges into
// Answer 1..Answer 42).
// ---------------------------------------------------------------------------
export const SKILL_CATEGORIES = [
  { id: "teamworkOperations", name: "Teamwork & Operations", range: [1, 6] },
  { id: "communityImpact", name: "Community & Impact", range: [7, 12] },
  { id: "financialAcumen", name: "Financial Acumen", range: [13, 18] },
  { id: "innovatorMindset", name: "Innovator Mindset", range: [19, 24] },
  { id: "computationalResearch", name: "Computational & Research Skills", range: [25, 30] },
  { id: "technologySkills", name: "Technology Skills", range: [31, 36] },
  { id: "mentorshipLeadership", name: "Mentorship & Leadership Quotient", range: [37, 42] },
];

export const CHECKPOINTS = ["Onboarding", "Exit"];
