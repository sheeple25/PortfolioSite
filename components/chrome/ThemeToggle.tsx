"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import styles from "./ThemeToggle.module.css";

const STORAGE_KEY = "theme";

type Theme = "light" | "dark";

/**
 * Manual light/dark toggle: a single icon button in the header, immediately
 * left of "Ask Pixel". The glyph shown is always the destination theme, not
 * the current one — a sun while dark (press it to go light), a moon while
 * light (press it to go dark) — so it reads as an instruction rather than a
 * status light. There is no `prefers-color-scheme` handling anywhere in the
 * site — it defaults to light on a first visit and only changes when a
 * visitor presses this button.
 *
 * The source of truth is the `.dark` class on `<html>`, not component state:
 * that's what every stylesheet in the site already keys off, and it's what
 * the inline script in app/layout.tsx sets before paint to avoid a flash. A
 * `useSyncExternalStore` subscription is what keeps this button's icon in
 * step with that class without duplicating it in a `useState` —
 * `getServerSnapshot` below is what lets the server (and the client's first
 * hydration pass) agree on "light" while the *actual* class can already be
 * "dark", the same trick the inline script relies on, without a
 * hydration-mismatch warning.
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

  const label = theme === "dark" ? "Switch to light theme" : "Switch to dark theme";

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={toggle}
      aria-label={label}
      title={label}
    >
      {theme === "dark" ? (
        <Sun size={18} aria-hidden="true" />
      ) : (
        <Moon size={18} aria-hidden="true" />
      )}
    </button>
  );
}
