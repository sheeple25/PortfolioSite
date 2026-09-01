"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { CONTACT_EMAIL, NAV_LINKS, SOCIAL_LINKS, WORDMARK } from "@/lib/site";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { Pixel, usePixel } from "@/components/pixel";
import { useShutterLink } from "./Shutter";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import TrackedAnchor from "./TrackedAnchor";
import styles from "./NavBar.module.css";

const MAIL_HREF = `mailto:${CONTACT_EMAIL}`;
const LINKEDIN = SOCIAL_LINKS.find((link) => link.label === "LinkedIn");

/**
 * "Contact" has no page behind it — clicking the label itself is a direct
 * `mailto:` link, and hovering (or focusing, for keyboard users) reveals the
 * two ways to actually reach out: email again, spelled out, and LinkedIn.
 * `:focus-within`/`:hover` on the `<li>` drives the reveal in CSS, with the
 * dropdown flush against the trigger (no gap) so the pointer path from link
 * to menu never leaves the hoverable box.
 */
function ContactMenu({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <li className={styles.contactItem}>
      <TrackedAnchor
        href={MAIL_HREF}
        className={styles.link}
        eventName="contact_email_click"
        eventProperties={{ href: MAIL_HREF, source: "nav" }}
        onClick={onNavigate}
      >
        Contact
      </TrackedAnchor>

      <div className={styles.contactDropdown}>
        <div className={styles.contactDropdownPanel}>
          <TrackedAnchor
            href={MAIL_HREF}
            className={styles.contactDropdownLink}
            eventName="contact_email_click"
            eventProperties={{ href: MAIL_HREF, source: "nav-dropdown" }}
            onClick={onNavigate}
          >
            {CONTACT_EMAIL}
          </TrackedAnchor>
          {LINKEDIN?.href && (
            <TrackedAnchor
              href={LINKEDIN.href}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.contactDropdownLink}
              eventName="outbound_link_click"
              eventProperties={{ label: LINKEDIN.label, href: LINKEDIN.href }}
              onClick={onNavigate}
            >
              LinkedIn
            </TrackedAnchor>
          )}
        </div>
      </div>
    </li>
  );
}

/**
 * A bar link that plays the shutter on its way out: the header section of the
 * page you are leaving rolls up, and the one you are arriving at opens in its
 * place. Moving between Work, Archive and Writing is the same gesture as
 * opening a project from one of them.
 *
 * A real `<Link>` underneath, so href, prefetching, right-click and cmd-click
 * all still behave — `useShutterLink` only takes over the plain left click, and
 * declines when the destination has no panel to open (see `sections.ts`).
 */
function ShutterNavLink({
  href,
  className,
  children,
  onNavigate,
  ...rest
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
  /** Runs on every click, shutter or not — closing the mobile sheet. */
  onNavigate?: () => void;
} & Omit<React.ComponentProps<typeof Link>, "href" | "className" | "onClick">) {
  const shutterClick = useShutterLink(href);

  return (
    <Link
      href={href}
      className={className}
      onClick={(event) => {
        onNavigate?.();
        shutterClick(event);
      }}
      {...rest}
    >
      {children}
    </Link>
  );
}

/**
 * Site header. Sticky.
 */

/** A link is current if it matches, or owns the segment you're inside. */
function isCurrent(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function NavBar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const { chatOpen, openChat, closeChat } = usePixel();
  const [pixelHover, setPixelHover] = useState(false);

  /*
   * Hovering the wordmark runs the loading animation. It lives here rather than
   * on the logo's own element so the whole wordmark is the target — the mark
   * alone is 26px.
   */
  const [logoHovered, setLogoHovered] = useState(false);

  // The sheet covers the viewport, so the page behind it shouldn't scroll.
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <header className={styles.header} data-chrome="header">
      <nav className={styles.nav} aria-label="Primary">
        {/* The header sits above the sheet, so this stays reachable with it open. */}
        <ShutterNavLink
          href="/projects"
          className={styles.wordmark}
          onNavigate={() => setMenuOpen(false)}
          onPointerEnter={() => setLogoHovered(true)}
          onPointerLeave={() => setLogoHovered(false)}
        >
          <Logo mode={logoHovered ? "loop" : "static"} size={26} />
          <span className={styles.wordmarkText}>{WORDMARK}</span>
        </ShutterNavLink>

        <ul className={styles.links}>
          {NAV_LINKS.map((link) => {
            const current = isCurrent(pathname, link.href);
            return (
              <li key={link.href}>
                <ShutterNavLink
                  href={link.href}
                  className={cn(styles.link, current && styles.linkCurrent)}
                  aria-current={current ? "page" : undefined}
                  onNavigate={() => setMenuOpen(false)}
                >
                  {link.label}
                </ShutterNavLink>
              </li>
            );
          })}
          <ContactMenu />
        </ul>

        <div className={styles.controls}>
          <ThemeToggle />

          <button
            type="button"
            className={styles.askPixel}
            onClick={() => (chatOpen ? closeChat() : openChat({ source: "header" }))}
            onPointerEnter={() => setPixelHover(true)}
            onPointerLeave={() => setPixelHover(false)}
            aria-expanded={chatOpen}
          >
            Ask Pixel
            <Pixel
              decorative
              size={18}
              color="var(--color-white)"
              eyeColor="var(--nav-pixel-accent)"
              expression={pixelHover ? "happy" : "default"}
              bob={pixelHover && !reducedMotion}
            />
          </button>

          <button
            type="button"
            className={styles.menuButton}
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="nav-sheet"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            <span className={cn(styles.bar, menuOpen && styles.barTop)} />
            <span className={cn(styles.bar, menuOpen && styles.barBottom)} />
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="nav-sheet"
            className={styles.sheet}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <ul className={styles.sheetLinks}>
              {NAV_LINKS.map((link, i) => (
                <motion.li
                  key={link.href}
                  initial={reducedMotion ? false : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.32, delay: 0.04 * i, ease: "easeOut" }}
                >
                  <ShutterNavLink
                    href={link.href}
                    // Closing on the click that navigates, rather than in an
                    // effect watching the pathname — the sheet is dismissed by
                    // a user action, so it belongs in the handler for it.
                    onNavigate={() => setMenuOpen(false)}
                    className={cn(
                      styles.sheetLink,
                      isCurrent(pathname, link.href) && styles.sheetLinkCurrent
                    )}
                  >
                    <span className={styles.sheetIndex} aria-hidden="true">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {link.label}
                  </ShutterNavLink>
                </motion.li>
              ))}
              <motion.li
                key="contact"
                initial={reducedMotion ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.32,
                  delay: 0.04 * NAV_LINKS.length,
                  ease: "easeOut",
                }}
                className={styles.sheetContactRow}
              >
                <TrackedAnchor
                  href={MAIL_HREF}
                  className={styles.sheetLink}
                  eventName="contact_email_click"
                  eventProperties={{ href: MAIL_HREF, source: "nav-sheet" }}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className={styles.sheetIndex} aria-hidden="true">
                    {String(NAV_LINKS.length + 1).padStart(2, "0")}
                  </span>
                  Contact
                </TrackedAnchor>
                {LINKEDIN?.href && (
                  <TrackedAnchor
                    href={LINKEDIN.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.sheetContactSecondary}
                    eventName="outbound_link_click"
                    eventProperties={{ label: LINKEDIN.label, href: LINKEDIN.href }}
                    onClick={() => setMenuOpen(false)}
                  >
                    LinkedIn &#8599;
                  </TrackedAnchor>
                )}
              </motion.li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
