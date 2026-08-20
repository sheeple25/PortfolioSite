"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePixel } from "@/components/pixel";
import type { WritingNote } from "@/lib/writing/types";

/*
 * The margin notes, and Pixel reading them out.
 *
 * A note is written once in the markdown but reachable from three places: the
 * note in the margin, any bold word listed as one of its anchors, and Pixel's
 * narration. They all point at the same id, so this context is what keeps them
 * agreeing on which note is currently being spoken.
 */

/** Long enough to read a note twice; short enough that it clears itself. */
const NARRATION_MS = 16_000;

type NotesValue = {
  get: (id: string) => WritingNote | undefined;
  activeId: string | null;
  speak: (id: string) => void;
  dismiss: () => void;
};

/**
 * The default is a working no-op rather than a thrown error: prose containing a
 * note can legitimately be rendered outside a provider (a preview, a card), and
 * a bold word quietly staying bold is a better outcome than a broken page.
 */
const NotesContext = createContext<NotesValue | null>(null);

export function useNotes(): NotesValue | null {
  return useContext(NotesContext);
}

export function NotesProvider({
  notes,
  children,
}: {
  notes: WritingNote[];
  children: React.ReactNode;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const { react } = usePixel();

  const byId = useMemo(
    () => new Map(notes.map((note) => [note.id, note])),
    [notes]
  );

  const speak = useCallback(
    (id: string) => {
      if (!byId.has(id)) return;
      // Re-clicking the word Pixel is already reading stops it, so the trigger
      // works as a toggle rather than being a dead control the second time.
      setActiveId((current) => (current === id ? null : id));
      react("happy", 1200);
    },
    [byId, react]
  );

  const dismiss = useCallback(() => setActiveId(null), []);

  useEffect(() => {
    if (!activeId) return;
    const timer = window.setTimeout(() => setActiveId(null), NARRATION_MS);
    return () => window.clearTimeout(timer);
  }, [activeId]);

  useEffect(() => {
    if (!activeId) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeId]);

  const value = useMemo<NotesValue>(
    () => ({ get: (id) => byId.get(id), activeId, speak, dismiss }),
    [byId, activeId, speak, dismiss]
  );

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}
