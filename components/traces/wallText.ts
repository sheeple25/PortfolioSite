/**
 * The wall of user-reported failure modes that opens the board.
 *
 * Verbatim from the source PDF. It is data rather than markup because the
 * opening section repeats it several times at different opacities to build the
 * texture, and because the volume *is* the argument — editing it down would
 * remove the only thing it is doing.
 */
export const WALL_ITEMS = [
  "ghosting", "creeps", "weird comments", "no matches", "dead chats",
  "fake profiles", "mindless swiping", "no prompts", "no pictures",
  "not verified", "validation seeking", "hookup only", "intent mismatching",
  "gold digging", "like farming", "phishing", "double timing", "love bombing",
  "gaslighting", "queer baiting", "ego stroking", "breadcrumbing", "orbiting",
  "benching", "zombieing", "soft blocking", "passive aggression", "late replies",
  "dry texters", "single word answers", "copy paste openers", "“hey hru”",
  "no effort bios", "generic prompts", "cliché quotes", "gym mirror selfies",
  "sunglasses indoors", "group photos only", "no face pics", "catfishing",
  "outdated photos", "filters everywhere", "face tune", "body editing",
  "height lying", "age lying", "location lying", "job lying",
  "marital status lying", "emotional unavailability", "commitment issues",
  "fear of labels", "situationships", "almost relationships", "hot and cold",
  "mixed signals", "reply games", "strategic ignoring", "power plays",
  "ego boosts", "chasing", "overthinking", "constant comparison",
  "endless options", "paradox of choice", "analysis paralysis", "swipe fatigue",
  "burnout", "boredom", "dating as content", "screenshotting chats",
  "sharing profiles in group chats", "getting roasted by friends",
  "being seen on apps", "aunties and uncles judging", "parents finding out",
  "moral policing", "shame", "stigma", "“desperate” tag",
  "not serious enough", "too serious too soon", "trauma dumping", "oversharing",
  "future faking", "fake vulnerability", "therapy speak",
  "performative wokeness", "performative feminism", "performative allyship",
  "bare minimum kings", "nice guy act", "entitlement", "negging",
  "subtle insults", "body shaming", "colourism", "casteism", "classism",
  "fatphobia", "misogyny", "homophobia", "queerphobia", "fetishization",
  "tokenizing", "creepy dms", "unsolicited flirting", "sexual innuendos",
  "unsolicited pics", "harassment", "unsafe meetups", "stalking",
  "doxxing fears", "location anxiety", "safety doubts",
  "not knowing who to trust", "hidden relationships", "people “just browsing”",
  "people “not over their ex”", "people “seeing where it goes” forever",
  "emotionally unavailable people", "revenge dating", "rebound dating",
  "hate using apps but still using them", "deleting and redownloading",
  "uninstall reinstall cycle", "endless rebranding of the same apps",
  "premium paywalls", "pay to be seen", "boosts", "superlikes",
  "algorithm bias", "same faces again and again", "long distance matches",
  "wrong city matches", "bad discovery radius", "spam bots", "crypto scams",
  "sugar daddy messages", "mlm pitches", "fake influencers", "cat accounts",
  "only there for instagram followers", "clout chasing", "like collectors",
  "match hoarding", "never replying after matching",
  "conversations that die after “what do you do”", "no conversation skills",
  "boring small talk", "interview style questioning", "no listening",
  "talking only about themselves", "self promotion", "link in bio",
  "podcast plugs", "music taste judgement", "playlist gatekeeping",
  "niche interest shaming", "kink shaming", "religious mismatch",
  "political mismatch", "value clashes", "different timelines",
  "different life stages", "ghosting after first date", "ghosting after months",
  "slow fade", "“it’s not you it’s me” texts", "no closure",
  "awkward first meetings", "catfish in real life", "no chemistry offline",
  "safety worries on the way home", "friends tracking location",
  "fake kindness", "breadcrumb reassurance", "people keeping backups", "fomo",
  "jealousy", "constant notifications", "dopamine hits", "late night scrolling",
  "sleep deprivation", "feeling replaceable", "feeling not enough",
  "feeling too much", "losing faith in romance", "losing patience",
  "treating people like profiles", "treating feelings like features",
  "dating app fatigue", "wanting to delete everything",
  "still being scared of missing out",
];

/**
 * Splits the failure modes into `count` marquee rows, round-robin rather than
 * in contiguous slices — so every row mixes short and long phrases instead of
 * one row getting all the three-word ones and another getting all the long
 * ones. Deterministic (no `Math.random`) so server and client render the same
 * rows and hydration doesn't mismatch.
 */
export function wallRows(count: number): string[] {
  const rows: string[][] = Array.from({ length: count }, () => []);
  WALL_ITEMS.forEach((item, i) => rows[i % count].push(item));
  return rows.map((r) => r.join("  ·  "));
}
