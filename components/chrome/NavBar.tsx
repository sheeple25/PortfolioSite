"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { NAV_LINKS, WORDMARK } from "@/lib/site";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import Logo from "./Logo";
import styles from "./NavBar.module.css";

/**
 * Site header. Sticky, and it grows a hairline and a blur once the page has
 * scrolled far enough that content would otherwise slide under bare text.
 */

/** A link is current if it matches, or owns the segment you're inside. */
function isCurrent(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function NavBar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  /*
   * Hovering the wordmark runs the loading animation. It lives here rather than
   * on the logo's own element so the whole wordmark is the target — the mark
   * alone is 26px.
   */
  const [logoHovered, setLogoHovered] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
    <header className={cn(styles.header, scrolled && styles.scrolled)}>
      <nav className={styles.nav} aria-label="Primary">
        {/* The header sits above the sheet, so this stays reachable with it open. */}
        <Link
          href="/"
          className={styles.wordmark}
          onClick={() => setMenuOpen(false)}
          onPointerEnter={() => setLogoHovered(true)}
          onPointerLeave={() => setLogoHovered(false)}
        >
          <Logo mode={logoHovered ? "loop" : "static"} size={26} />
          <span className={styles.wordmarkText}>{WORDMARK}</span>
        </Link>

        <ul className={styles.links}>
          {NAV_LINKS.map((link) => {
            const current = isCurrent(pathname, link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(styles.link, current && styles.linkCurrent)}
                  aria-current={current ? "page" : undefined}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

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
                  <Link
                    href={link.href}
                    // Closing on the click that navigates, rather than in an
                    // effect watching the pathname — the sheet is dismissed by
                    // a user action, so it belongs in the handler for it.
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      styles.sheetLink,
                      isCurrent(pathname, link.href) && styles.sheetLinkCurrent
                    )}
                  >
                    <span className={styles.sheetIndex} aria-hidden="true">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {link.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
