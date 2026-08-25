"use client";

import { motion } from "motion/react";
import { usePrefersReducedMotion } from "@/lib/hooks";
import styles from "./ProjectMeta.module.css";

/**
 * Role, timeline, team and skills, directly under the masthead.
 *
 * This sits inside the entry rather than on the index tile on purpose. On the
 * index it would be four more lines competing with eight covers; here it is the
 * first question a reader actually has once they've committed to the project —
 * what was yours, how long, who else, what with.
 *
 * Rows are omitted rather than shown empty. A dash next to "Team" reads as a
 * project nobody worked on; no row at all reads as what it is, which is a
 * project that had no team.
 */
export default function ProjectMeta({
  role,
  timeline,
  team,
  skills,
}: {
  role?: string;
  timeline?: string;
  team?: string;
  skills?: string[];
}) {
  const reducedMotion = usePrefersReducedMotion();

  const rows: Array<[string, string]> = [];
  if (role) rows.push(["Role", role]);
  if (timeline) rows.push(["Timeline", timeline]);
  if (team) rows.push(["Team", team]);

  if (rows.length === 0 && !skills?.length) return null;

  return (
    <motion.dl
      className={styles.meta}
      initial={reducedMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.45, ease: "easeOut" }}
    >
      {rows.map(([label, value]) => (
        <div key={label} className={styles.row}>
          <dt className={styles.label}>{label}</dt>
          <dd className={styles.value}>{value}</dd>
        </div>
      ))}

      {skills && skills.length > 0 && (
        <div className={styles.row}>
          <dt className={styles.label}>Skills</dt>
          <dd className={styles.value}>
            <ul className={styles.skills}>
              {skills.map((skill) => (
                <li key={skill} className={styles.skill}>
                  {skill}
                </li>
              ))}
            </ul>
          </dd>
        </div>
      )}
    </motion.dl>
  );
}
