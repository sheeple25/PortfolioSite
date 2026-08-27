"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import styles from "./ThemeToggle.module.css";

const STORAGE_KEY = "theme";

type Theme = "light" | "dark";

/**
 * Manual light/dark toggle: a switch, not a push button — the two themes are
 * a persistent on/off state, so it's marked up as `role="switch"` with
 * `aria-checked` and reads as a track with a knob that slides between the
 * sun and the moon. There is no `prefers-color-scheme` handling anywhere in
 * the site — it defaults to light on a first visit and only changes when a
 * visitor asks it to, via this switch.
 *
 * The source of truth is the `.dark` class on `<html>`, not component state:
 * that's what every stylesheet in the site already keys off, and it's what
 * the inline script in app/layout.tsx sets before paint to avoid a flash. A
 * `useSyncExternalStore` subscription is what keeps this button's
 * `aria-checked` in step with that class without duplicating it in a
 * `useState` — `getServerSnapshot` below is what lets the server (and the
 * client's first hydration pass) agree on "light" while the *actual* class
 * can already be "dark", the same trick the inline script relies on, without
 * a hydration-mismatch warning.
 */

const listeners = new Set<() => void>();

function getSnapshot(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

/** Always "light": what the server (and the client's pre-hydration DOM,
 *  before this module has run) renders, regardless of the stored choice. */
function getServerSnapshot(): Theme {
  return "light";
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

/** Anything but `"dark"` — missing key, unavailable storage, a stray value —
 *  resolves to light, the site default. */
function readStoredTheme(): Theme {
  try {
    return localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

/** Applies a theme to `<html>` and notifies every mounted `ThemeToggle` to
 *  re-read it. `persist` is false for the startup re-sync (below), which
 *  restates what's already stored rather than setting a fresh choice. */
function applyTheme(next: Theme, persist: boolean) {
  document.documentElement.classList.toggle("dark", next === "dark");
  if (persist) {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage can be unavailable (private mode, a locked-down browser) —
      // the toggle still works for this visit, it just won't be remembered.
    }
  }
  listeners.forEach((notify) => notify());
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // React's Strict Mode remount in development resets `<html>` to only the
  // attributes JSX manages, clearing the class the inline script set outside
  // React's render — this restates it from storage so dev doesn't diverge
  // from what the script (and production) actually does. A no-op whenever
  // the class already agrees with storage, which is every production paint.
  useLayoutEffect(() => {
    applyTheme(readStoredTheme(), false);

    /*
     * `storage` fires in every *other* tab on the same origin, never in the
     * one that made the change — so this is purely the receiving end. Without
     * it, two open tabs disagree about the theme until one of them reloads.
     */
    const onStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== STORAGE_KEY) return;
      applyTheme(readStoredTheme(), false);
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function toggle() {
    applyTheme(theme === "dark" ? "light" : "dark", true);
  }

  return (
    <button
      type="button"
      role="switch"
      className={styles.toggle}
      data-chrome="header"
      onClick={toggle}
      aria-label="Dark theme"
      aria-checked={theme === "dark"}
      title={
        theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
      }
    >
      {/* The two icons sit in the track, one at each end; the knob slides
          over whichever one is currently inactive. */}
      <Sun size={13} className={styles.sun} aria-hidden="true" />
      <Moon size={13} className={styles.moon} aria-hidden="true" />
      <span className={styles.knob} aria-hidden="true" />
    </button>
  );
}
