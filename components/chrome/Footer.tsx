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
import Logo from "./Logo";
import styles from "./Footer.module.css";

/**
 * Site footer. A server component apart from the logo — nothing else here needs
 * to react to anything, so the sitewide chrome costs one interactive component
 * rather than a whole subtree.
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
    <a
      className={styles.columnLink}
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {link.label}
    </a>
  );
}

export default function Footer() {
  // Evaluated when the page is rendered, which for these static routes is at
  // build time. Fine for a copyright line; don't reuse it for anything live.
  const year = new Date().getFullYear();

  const socials = partitionLinks(SOCIAL_LINKS);
  const documents = partitionLinks(DOCUMENT_LINKS);

  return (
    // `id` is how BottomEdge finds the footer to lift the mascot clear of it.
    <footer id="site-footer" className={styles.footer}>
      <div className={styles.rule} />

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
                    <a
                      className={styles.document}
                      href={link.href || undefined}
                      download={link.href ? "" : undefined}
                      aria-disabled={link.href ? undefined : true}
                      title={link.href ? undefined : "Add the file to public/ and set the path in lib/site.ts"}
                    >
                      <span className={styles.documentArrow} aria-hidden="true">
                        &darr;
                      </span>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </nav>
      </div>

      <div className={styles.baseline}>
        <p className={styles.copyright}>
          &copy; {year} {SITE_NAME}
        </p>
        <a className={styles.top} href="#top">
          Back to top
          <span className={styles.topArrow} aria-hidden="true">
            &uarr;
          </span>
        </a>
      </div>
    </footer>
  );
}
