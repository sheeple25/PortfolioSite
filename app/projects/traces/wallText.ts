/**
 * The banner's wall of failure modes, verbatim from the Figma frame
 * (node 230:10470).
 *
 * The trick of the banner is that the wall is not only texture. Set into the
 * noise, at medium weight, is one continuous sentence:
 *
 *   "in this research studio ‘We Ourselves’ I investigate how technology
 *    mediates romantic relationships because dating apps have a lot of
 *    problems. My name is Vidush Gupta."
 *
 * So the wall is stored as an alternating run of segments rather than one
 * string: even indices are noise, odd indices are the sentence. That keeps the
 * emphasis addressable — the banner renders the odd segments as `<strong>`, and
 * a screen reader gets the sentence as marked-up text instead of a wall of
 * commas with invisible styling on it.
 *
 * The noise runs are the frame's own text. They repeat themselves in places
 * (the whole list appears roughly twice, and a few phrases recur inside it);
 * that is what the frame contains and the repetition is the point — the volume
 * is the argument.
 */

/** Even index = noise, odd index = the sentence hidden inside it. */
export const WALL_SEGMENTS: readonly string[] = [
  "ghosting, creeps, weird comments, no matches, dead chats, fake profiles, mindless swiping, no prompts, no pictures, not verified, validation seeking, rebound, hookup only, intent mismatching, gold digging, like farming, phishing, double timing, love bombing, gaslighting, queer baiting, ego stroking, breadcrumbing, orbiting, ",
  "in this research studio",
  ", benching, zombieing, soft blocking, ",
  "‘ We Ourselves’",
  ", passive aggression, late replies, ",
  "I investigate",
  ", single word answers, copy paste openers, “hey hru”, no effort bios, generic prompts, cliché quotes, gym mirror selfies, sunglasses indoors, ",
  "how technology mediates",
  ", group photos only, no face pics, catfishing, outdated photos, filters everywhere, face tune, body editing, height lying, age lying, ",
  "romantic relationships",
  ", location lying, job lying, marital status lying, emotional unavailability, commitment issues, fear of labels, situationships, almost relationships, hot and cold, mixed signals, reply games, strategic ignoring, power plays, ego boosts, chasing, overthinking, constant comparison, endless options, paradox of choice, analysis paralysis, swipe fatigue, burnout, boredom, parents finding out, moral policing, shame, stigma, “desperate” tag, not serious enough, too serious too soon, trauma dumping, oversharing, love bombing then vanishing, future faking, fake vulnerability, therapy speak, performative wokeness, performative feminism, performative allyship, bare minimum kings, nice guy act, entitlement, negging, subtle insults, body shaming, colourism, casteism, classism, fatphobia, misogyny, homophobia, queerphobia, fetishization, tokenizing, creepy dms, unsolicited flirting, sexual innuendos, unsolicited pics, harassment, unsafe meetups, stalking, doxxing fears, location anxiety, safety doubts, not knowing who to trust, hidden relationships, people “just browsing”, people “not over their ex”, people “seeing where it goes” forever, emotionally unavailable people, revenge dating, rebound dating, hate using apps but still using them, deleting and redownloading, uninstall reinstall cycle, endless rebranding of the same apps, premium paywalls, pay to be seen, boosts, superlikes, algorithm bias, same faces again and again, long distance matches, wrong city matches, bad discovery radius, spam bots, crypto scams, sugar daddy messages, mlm pitches, fake influencers, cat accounts, people only there for instagram followers, clout chasing, like collectors, match hoarding, never replying after matching, conversations that die after “what do you do”, no conversation skills, boring small talk, interview style questioning, no listening, talking only about themselves, self promotion, link in bio, podcast plugs, music taste judgement, playlist gatekeeping, niche interest shaming, kink shaming, religious mismatch, political mismatch, value clashes, different timelines, different life stages, ghosting after first date, ghosting after months, slow fade, “it’s not you it’s me” texts, no closure, awkward first meetings, catfish in real life, no chemistry offline, safety worries on the way home, friends tracking location, fake kindness, breadcrumb reassurance, people keeping backups, fomo, jealousy, constant notifications, dopamine hits, late night scrolling, sleep deprivation, feeling replaceable, feeling not enough, feeling too much, losing faith in romance, losing patience, treating people like profiles, treating feelings like features, dating app fatigue, wanting to delete everything, still being scared of missing out, ghosting, creeps, weird comments, no matches, dead chats, fake profiles, mindless swiping, no prompts, no pictures, not verified, validation seeking, rebound, hookup only, intent mismatching, gold digging, like farming, phishing, double timing, love bombing, gaslighting, queer baiting, ego stroking, breadcrumbing, orbiting, benching, zombieing, soft blocking, passive aggression, late replies, dry texters, single word answers, copy paste openers, “hey hru”, no effort bios, generic prompts, cliché quotes, gym mirror selfies, sunglasses indoors, group photos only, no face pics, catfishing, outdated photos, filters everywhere, face tune, body editing, height lying, age lying, location lying, job lying, marital status lying, emotional unavailability, commitment issues, fear of labels, situationships, almost relationships, hot and cold, mixed signals, reply games, strategic ignoring, power plays, ego boosts, chasing, overthinking, constant comparison, endless options, paradox of choice, analysis paralysis, swipe fatigue, burnout, boredom, dating as content, screenshotting chats, sharing profiles in group chats, ",
  "because dating apps",
  ", dating as content, screenshotting chats, sharing profiles in group chats, getting roasted by friends, being seen on apps, ",
  "have a lot of problems",
  ", being seen on apps, aunties and uncles judging, parents finding out, moral policing, shame, stigma, “desperate” tag, not serious enough, too serious too soon, trauma dumping, oversharing, love bombing. My name is ",
  "Vidush Gupta",
  ", future faking, fake vulnerability, therapy speak, performative wokeness, performative feminism, performative allyship, bare minimum kings, nice guy act, entitlement, negging, subtle insults, body shaming, colourism, casteism, classism, fatphobia, misogyny, homophobia, queerphobia, fetishization, tokenizing, creepy dms, unsolicited flirting, sexual innuendos, unsolicited pics, harassment, unsafe meetups, stalking, doxxing fears, location anxiety, safety doubts, not knowing who to trust, hidden relationships, people “just browsing”, people “not over their ex”, people “seeing where it goes” forever, emotionally unavailable people, revenge dating, rebound dating, hate using apps but still using them, deleting and redownloading, uninstall reinstall cycle, endless rebranding of the same apps, premium paywalls, pay to be seen, boosts, superlikes, algorithm bias, same faces again and again, long distance matches, wrong city matches, bad discovery radius, spam bots, crypto scams, sugar daddy messages, mlm pitches, fake influencers, cat accounts, people only there for instagram followers, clout chasing, like collectors, match hoarding, never replying after matching, conversations that die after “what do you do”, no conversation skills, boring small talk, interview style questioning, no listening, talking only about themselves, self promotion, link in bio, podcast plugs, music taste judgement, playlist gatekeeping, niche interest shaming, kink shaming, religious mismatch, political mismatch, value clashes, different timelines, different life stages, ghosting after first date, ghosting after months, slow fade, “it’s not you it’s me” texts, no closure, awkward first meetings, catfish in real life, no chemistry offline, safety worries on the way home, friends tracking location, fake kindness, breadcrumb reassurance, people keeping backups, fomo, jealousy, constant notifications, dopamine hits, late night scrolling, sleep deprivation, feeling replaceable, feeling not enough, feeling too much, losing faith in romance, losing patience, treating people like profiles, treating feelings like features, dating app fatigue, wanting to delete everything, still being scared of missing out",
];

/**
 * The sentence on its own, for the banner's accessible label.
 *
 * Derived rather than written twice, so it cannot drift from the segments
 * above — the emphasised runs are the sentence, by definition.
 */
export const WALL_SENTENCE = WALL_SEGMENTS.filter((_, i) => i % 2 === 1)
  .join(" ")
  .replace(/\s+/g, " ")
  .trim();

export type WallToken = {
  text: string;
  /** True for a phrase belonging to the hidden sentence. */
  said: boolean;
};

/**
 * The segments broken into individual phrases.
 *
 * A noise run is one long comma-separated string in the frame; split on the
 * commas it becomes the list of failure modes it always was. A sentence run is
 * one token and is never split — its words have to stay together and in order
 * or the sentence stops being findable.
 */
const TOKENS: WallToken[] = WALL_SEGMENTS.flatMap((segment, i): WallToken[] =>
  i % 2 === 1
    ? [{ text: segment.trim(), said: true }]
    : segment
        .split(",")
        .map((phrase) => phrase.trim())
        .filter(Boolean)
        .map((text) => ({ text, said: false })),
);

/**
 * How many lines the banner scrolls.
 *
 * Enough to overfill the banner's height at the wall's 32px/1.02 line box, so
 * the column is clipped top and bottom rather than ending in a visible last
 * line. The rows are centred, so the overflow is shared between both edges.
 */
const ROW_COUNT = 18;

/**
 * The wall dealt into rows, each of which scrolls on its own.
 *
 * The split is **contiguous** rather than round-robin, which is what keeps the
 * hidden sentence legible: its phrases stay in source order, so they appear one
 * after another as you read down the rows instead of being scattered at random
 * across them. Each row then drifts at its own speed and direction, so the
 * phrases never line up the same way twice.
 */
export const WALL_ROWS: WallToken[][] = Array.from(
  { length: ROW_COUNT },
  (_, i) => {
    const per = Math.ceil(TOKENS.length / ROW_COUNT);
    return TOKENS.slice(i * per, (i + 1) * per);
  },
).filter((row) => row.length > 0);

/**
 * Per-row scroll duration in seconds.
 *
 * The `* 29` step is coprime with the 70s spread, so `(i * 29) % 70` visits a
 * wide, non-repeating set of values rather than counting up in step with the
 * row index — no two neighbouring rows share a speed, and nothing reads as
 * sorted.
 *
 * The floor is 240s, not 70s. At 70 the rows crossed at roughly 70px/s, which
 * is fast enough to track with your eye — and anything the eye can track next
 * to a title competes with it. Four minutes a lap puts it near 20px/s, slow
 * enough to read as a surface that happens to be moving rather than as
 * something asking to be read.
 */
export const wallRowDuration = (i: number) => 240 + ((i * 29) % 70);
