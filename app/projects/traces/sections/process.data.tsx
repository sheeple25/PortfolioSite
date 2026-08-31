/**
 * Data behind the two Process disclosures — Research and Analysis.
 *
 * Everything here is digitised off the board PDF's own research pages
 * (`source/traces-extract/traces_extract.txt`), not re-derived. `traces-rebuild.md`
 * cut the full nine-archetype descriptions, both POEM boards and the iceberg's
 * four layers from the main page on the rule that "nothing gets a section
 * unless it's a decision" — this is where that material actually lives, one
 * level down, for a reader who stops to ask.
 */

export type StatSpec = {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
};

/** The two studies behind the research, as a stat row. */
export const RESEARCH_STATS: StatSpec[] = [
  { value: 16, label: "interview respondents, ages 20–25" },
  { value: 14, label: "matchmaking-experiment respondents" },
  { value: 400, prefix: "~", label: "discrete datapoints collected" },
  { value: 3, prefix: "~", label: "real matches produced" },
];

export type ThemeCard = { num: string; title: string; note: string };

/**
 * The seven themes the sixteen interviews kept surfacing, each condensed to
 * the one line that best carries its 2–4 source bullets.
 */
export const THEMES: ThemeCard[] = [
  {
    num: "01",
    title: "Legitimacy & Stigma",
    note: "Apps read as less legitimate than meeting offline, and women face sharper moral policing for using them.",
  },
  {
    num: "02",
    title: "Communication Early On",
    note: "Opening messages felt high-stakes and sustaining a conversation was the harder struggle; text hides tone.",
  },
  {
    num: "03",
    title: "Authenticity of Self",
    note: "Authenticity was judged by effort — candid photos, specific prompts — not by any one fact being true.",
  },
  {
    num: "04",
    title: "Platforms for Initiation",
    note: "Instagram is where romance actually starts; dating apps split into direct-and-clear or dismissed as unserious.",
  },
  {
    num: "05",
    title: "Expectations of Relationships",
    note: "Apps weren’t seen as a route to something serious — mostly companionship, or just curiosity.",
  },
  {
    num: "06",
    title: "Safety & Control",
    note: "Safety dominates the move from online to offline: women want control, men fear invisibility.",
  },
  {
    num: "07",
    title: "Social Validation Through Friends",
    note: "Sharing profiles with friends for a second opinion is common, and often played for laughs.",
  },
];

export type ArchetypeCard = { num: string; title: string; note: string };

/**
 * The nine archetypes the interview and experiment data sorted into. Why.tsx
 * carries three of these — the Masquerade/Casino/Sword loop is a different
 * cut of the same research, the cycle the archetypes get caught in rather than
 * the archetypes themselves — so this is the full set, not a duplicate of it.
 */
export const ARCHETYPES: ArchetypeCard[] = [
  {
    num: "01",
    title: "The Validation Seeker",
    note: "Craves attention and compliments with no intent of taking things offline.",
  },
  {
    num: "02",
    title: "The Mastikhor",
    note: "Uses apps for entertainment, thrill or mischief rather than connection.",
  },
  {
    num: "03",
    title: "The Point Nemo",
    note: "Turns to apps to soothe loneliness or heal heartbreak, seeking companionship.",
  },
  {
    num: "04",
    title: "The Horndog",
    note: "Uses apps primarily to fulfil sexual needs, often upfront about it.",
  },
  {
    num: "05",
    title: "The Mole",
    note: "Seeks friendships, networks or casual connection without romance or sex.",
  },
  {
    num: "06",
    title: "The Goody Two Shoes",
    note: "Plays by the rules with genuine intent, but struggles with traction and ghosting.",
  },
  {
    num: "07",
    title: "The Escapist",
    note: "Engages until things get heavy, then ghosts to avoid emotional weight.",
  },
  {
    num: "08",
    title: "The Bad Actors",
    note: "The dark side of dating apps — hostile, exploitative or manipulative.",
  },
  {
    num: "09",
    title: "The Apostate",
    note: "Ex power-users who abandon apps after a bad experience or burnout.",
  },
];

/**
 * The POEM framework's own closing line for each gender, corrected — the
 * source deck's female summary is captioned correctly but its male summary
 * is mislabelled "For women" even though its content (gender imbalance,
 * self-esteem tied to match count) is plainly about the male cohort.
 */
export const POEM = [
  {
    label: "Women",
    note: "The sharper issue isn’t the apps themselves — it’s that they’re not fun. Curated profiles and gendered moral policing make something that should be enjoyable stressful at every step.",
  },
  {
    label: "Men",
    note: "The foremost concern is the gender imbalance itself: more competition, more invisibility, and a self-esteem hit tied directly to match count.",
  },
] as const;

/** The iceberg model's four layers, each condensed to its takeaway. */
export const ICEBERG = [
  {
    num: "01",
    text: "Observable Behaviours — starting relationships on Instagram or apps; conversations stalling before they go offline; embarrassment at being “caught” using them.",
  },
  {
    num: "02",
    text: "Patterns & Trends — mixed motives: companionship, fun, validation, rarely marriage; women’s safety concerns against men’s anxiety about matches.",
  },
  {
    num: "03",
    text: "Structure — “real” courage is approaching in person; apps read as low-effort, equated with hookups or desperation; self-worth tied to match success.",
  },
  {
    num: "04",
    text: "Mental Model — the apps’ own swipe-and-paywall design manufactures scarcity on top of ordinary human needs for belonging, status and validation.",
  },
] as const;
