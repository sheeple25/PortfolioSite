import { getDecisionLog } from "@/lib/pixel/decisions";
import styles from "./notes.module.css";

/*
 * "What I actually did on this project" — in Pixel's margin, on project open,
 * without being asked.
 *
 * `docs/TODO.md` marks this as required rather than nice-to-have: the brief in
 * `source/Proposed Structure for Projects..md` puts "what did YOU do" among the
 * four questions the first twenty seconds has to answer, and a recruiter who
 * never opens the chat still has to see it. It can't go in the project header
 * (already carrying title, spec row and stickers) and it can't go under the
 * intro (that beat's whole job is pulling the reader into the problem) — so it
 * goes in the third column, which every content page already reserves.
 *
 * Deliberately static text, not a model call. This renders on every project
 * open, so generating it would mean one API request per visitor per page before
 * anyone has typed anything — the single most expensive thing PixelBot could
 * do, in exchange for a paragraph that doesn't change.
 *
 * Renders nothing when the project's log is missing or still a placeholder.
 */
export default function ProcessNote({ slug }: { slug: string }) {
  const log = getDecisionLog(slug);
  if (!log?.process) return null;

  return (
    <aside className={styles.processNote} aria-label="What Vidush did on this project">
      <p className={styles.processLabel}>what he actually did</p>
      {log.process.split(/\n{2,}/).map((paragraph, i) => (
        <p key={i} className={styles.processText}>
          {paragraph}
        </p>
      ))}
    </aside>
  );
}
