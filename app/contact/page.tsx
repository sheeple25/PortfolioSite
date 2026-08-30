import type { Metadata } from "next";
import { CONTACT_EMAIL, SOCIAL_LINKS } from "@/lib/site";
import TrackedAnchor from "@/components/chrome/TrackedAnchor";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Contact",
};

const IS_PRODUCTION = process.env.NODE_ENV === "production";

/**
 * Same convention as the footer (`partitionLinks` in
 * `components/chrome/Footer.tsx`): an entry with no `href` yet is a reminder,
 * not a link — greyed out in development so unfilled socials stay visible
 * while building, dropped entirely from the production build.
 */
const socials = IS_PRODUCTION
  ? SOCIAL_LINKS.filter((link) => link.href !== "")
  : SOCIAL_LINKS;

/*
 * The direct-link approach chosen over a form (docs/TODO.md) — a form is
 * more surface area than this site needs for "reach me by email."
 */
export default function Contact() {
  return (
    <main className={styles.page}>
      <h1 className={styles.heading}>Contact</h1>
      <p className={styles.intro}>
        The simplest way to reach me is email — I read everything that lands
        there.
      </p>

      <TrackedAnchor
        className={styles.emailLink}
        href={`mailto:${CONTACT_EMAIL}`}
        eventName="contact_email_click"
        eventProperties={{ href: `mailto:${CONTACT_EMAIL}` }}
      >
        {CONTACT_EMAIL}
      </TrackedAnchor>

      {socials.length > 0 && (
        <>
          <h2 className={styles.sectionLabel}>Elsewhere</h2>
          <ul className={styles.socialList}>
            {socials.map((link) => (
              <li key={link.label}>
                {link.href ? (
                  <TrackedAnchor
                    className={styles.socialLink}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    eventName="outbound_link_click"
                    eventProperties={{ label: link.label, href: link.href }}
                  >
                    {link.label}
                  </TrackedAnchor>
                ) : (
                  <span
                    className={styles.socialPending}
                    title="Set the URL in lib/site.ts"
                  >
                    {link.label}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
