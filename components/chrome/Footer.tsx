import Link from "next/link";
import {
  CONTACT_EMAIL,
  DOCUMENT_LINKS,
  NAV_LINKS,
  SITE_DESIGNATION,
  SITE_NAME,
  SOCIAL_LINKS,
  WORDMARK,
  type ExternalLink,
} from "@/lib/site";
import { getLatestCVPath } from "@/lib/cv";
import { formatRelativeTime, getLastCommit } from "@/lib/lastCommit";
import Logo from "./Logo";
import TrackedAnchor from "./TrackedAnchor";
import styles from "./Footer.module.css";

/**
 * Site footer. A server component apart from the logo and the tracked
 * anchors — nothing else here needs to react to anything, so the sitewide
 * chrome costs a few small interactive islands rather than a whole subtree.
 *
 * Deliberately styled as a distinct, darker panel rather than a continuation
 * of the page above it — the footer is meant to read as its own space, not
 * one more section of the page.
 */

const IS_PRODUCTION = process.env.NODE_ENV === "production";

/**
 * An entry with no URL yet is a note to self. It shows greyed out in
 * development so unfinished links stay visible while you build, and disappears
 * from the production build rather than shipping a dead control.
 */
function partitionLinks(links: ReadonlyArray<ExternalLink>) {
  return IS_PRODUCTION ? links.filter((link) => link.href !== "") : links;
}

function ColumnLink({ link }: { link: ExternalLink }) {
  if (!link.href) {
    return (
      <span className={styles.pending} title="Set the URL in lib/site.ts">
        {link.label}
      </span>
    );
  }

  return (
    <TrackedAnchor
      className={styles.columnLink}
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      eventName="outbound_link_click"
      eventProperties={{ label: link.label, href: link.href }}
    >
      {link.label}
    </TrackedAnchor>
  );
}

export default function Footer() {
  // Evaluated when the page is rendered, which for these static routes is at
  // build time. Fine for a copyright line; don't reuse it for anything live.
  const year = new Date().getFullYear();

  const socials = partitionLinks(SOCIAL_LINKS);
  const latestCVPath = getLatestCVPath();
  const documents = partitionLinks(
    DOCUMENT_LINKS.map((link) =>
      link.label === "Resume" ? { ...link, href: latestCVPath } : link
    )
  );

  // Build-time snapshot from `scripts/generate-last-commit.js` — null only if
  // that script couldn't run (no git available), in which case the line is
  // simply omitted rather than shown broken.
  const lastCommit = getLastCommit();

  return (
    // `id` is how BottomEdge finds the footer to lift the mascot clear of it.
    <footer id="site-footer" className={styles.footer} data-chrome="footer">
      <div className={styles.inner}>
        <div className={styles.identity}>
          <Logo size={62} playOnHover className={styles.identityLogo} />
          <div className={styles.identityText}>
            <p className={styles.name}>{WORDMARK}</p>
            <p className={styles.designation}>{SITE_DESIGNATION}</p>
            <a className={styles.email} href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
          </div>
        </div>

        <nav className={styles.columns} aria-label="Footer">
          <div className={styles.column}>
            <p className={styles.columnTitle}>Site</p>
            <ul className={styles.columnList}>
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link className={styles.columnLink} href={link.href}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {socials.length > 0 && (
            <div className={styles.column}>
              <p className={styles.columnTitle}>Socials</p>
              <ul className={styles.columnList}>
                {socials.map((link) => (
                  <li key={link.label}>
                    <ColumnLink link={link} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {documents.length > 0 && (
            <div className={styles.column}>
              <p className={styles.columnTitle}>Documents</p>
              <ul className={styles.documentList}>
                {documents.map((link) => (
                  <li key={link.label}>
                    <TrackedAnchor
                      className={styles.document}
                      href={link.href || undefined}
                      download={link.href ? link.downloadAs ?? "" : undefined}
                      aria-disabled={link.href ? undefined : true}
                      title={link.href ? undefined : "Add the file to public/ and set the path in lib/site.ts"}
                      // "Resume" is the CV — the one download this site's
                      // analytics scope calls out. Other documents (e.g.
                      // "Portfolio") still get the generic outbound event.
                      eventName={link.label === "Resume" ? "cv_download" : "document_download"}
                      eventProperties={{ label: link.label, href: link.href }}
                    >
                      <span className={styles.documentArrow} aria-hidden="true">
                        &darr;
                      </span>
                      {link.label}
                    </TrackedAnchor>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </nav>
      </div>

      {/*
        The track is not decoration: it is the box that clamps the sticky row
        inside it, which is what keeps it from riding up over the block above
        on a short band. See `.baselineTrack` in the stylesheet.

        `data-footer-baseline` is how BottomEdge finds the row itself. It
        sticks to the bottom of the viewport, so it — not the panel's top edge,
        which is halfway up the screen once the footer is open — is what the
        fixed corner furniture should come to rest on.
      */}
      <div className={styles.baselineTrack}>
        <div className={styles.baseline} data-footer-baseline>
          <div className={styles.baselineLeft}>
            <p className={styles.copyright}>
              &copy; {year} {SITE_NAME}
            </p>
            {lastCommit && (
              <p className={styles.signal}>
                <span className={styles.signalDot} aria-hidden="true" />
                Last shipped {formatRelativeTime(lastCommit.isoDate)}
                {" · "}
                <span className={styles.signalHash}>
                  {lastCommit.shortHash}
                </span>{" "}
                {lastCommit.subject}
              </p>
            )}
          </div>
          <a className={styles.top} href="#top">
            Back to top
            <span className={styles.topArrow} aria-hidden="true">
              &uarr;
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
}
