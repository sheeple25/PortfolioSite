/**
 * The professional read, as data.
 *
 * Sourced from `public/cv/v0.3.pdf` — every field here is in that document.
 * This is deliberately *not* the same set as the logo marquee it replaced.
 * That marquee ran seven marks (Kobble, In For The Cause, PwC, Verizon,
 * Desmania, Indian Railways, Future Factory) at equal weight, which made seven
 * organisations look like seven employers. They are not:
 *
 * - Four are employers, and they are the four below.
 * - **Indian Railways** is the client that approved the Desmania project, not
 *   a place of work. It survives inside that row's line rather than as a mark
 *   of its own.
 * - **Verizon** and **Future Factory** appear nowhere in the CV. They are left
 *   out rather than guessed at; if either is a real role, it needs a title and
 *   dates before it can go back on the page.
 *
 * `blurb` is one line distilled from the CV's own paragraph for that role — a
 * compression of what is already written there, not a new claim. Keep it to a
 * single line: the widget gives each entry one, and a second would either
 * clip or push the card past the desktop.
 */
export type Role = {
  /** Employer, as it should read. */
  company: string;
  /** Job title. */
  title: string;
  /** Human date range, exactly as the CV words it. */
  dates: string;
  /** One line. See the note above. */
  blurb: string;
  /** The mark, from `public/logos`. */
  logo: string;
};

/** Reverse-chronological by start date, which is the order the CV uses. */
export const EXPERIENCE: Role[] = [
  {
    company: "In For The Cause",
    title: "Brand & Digital Designer",
    dates: "Aug 2026 — Present",
    blurb:
      "Resolved four competing identities for a disability-livelihoods nonprofit into one brand system.",
    logo: "/logos/IFTC.svg",
  },
  {
    company: "Kobble",
    title: "Product Designer",
    dates: "Apr 2024 — Present",
    blurb:
      "First and only designer on a pre-launch dating product, joined at concept stage.",
    logo: "/logos/Kobble.svg",
  },
  {
    company: "PwC India",
    title: "UI/UX Intern",
    dates: "Mar — Jun 2025",
    blurb:
      "Four client projects in four months, across marketplace, energy, telecom and government.",
    logo: "/logos/PwC.svg",
  },
  {
    company: "Desmania Design",
    title: "Transport Design Intern",
    dates: "Jul — Sep 2024",
    blurb:
      "Waterless lavatory for Indian Railways' locomotive fleet, built as a full-scale prototype.",
    logo: "/logos/Desmania.svg",
  },
];
