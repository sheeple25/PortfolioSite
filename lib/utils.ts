import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * `2026-02-14` -> `14 Feb 2026`.
 *
 * The locale and time zone are pinned rather than left to the environment: the
 * same string has to come out of the server render and the client render, and
 * `undefined` locale resolves differently on each side of that boundary.
 */
export function formatDate(iso: string): string {
  if (!iso) return "";

  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
