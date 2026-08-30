"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePixel } from "../PixelContext";
import type { WritingNote } from "@/lib/writing/types";

/*
 * InScreen: the margin notes, and Pixel reading them out.
 *
 * A note is written once in the markdown but reachable from three places: the
 * note in the margin, any bold word listed as one of its anchors, and Pixel's
 * narration. They all point at the same id, so this context is what keeps them
 * agreeing on which note is currently being spoken.
 *
 * Notes are hand-authored and cost nothing to show. That is the whole design:
 * InScreen explains, deterministically and for free, and hands off to InChat
 * only when the visitor asks for more than an aside can carry.
 */

/** Long enough to read a note twice; short enough that it clears itself. */
const NARRATION_MS = 16_000;

type NotesValue = {
  get: (id: string) => WritingNote | undefined;
  activeId: string | null;
  speak: (id: string) => void;
  dismiss: () => void;
  /**
   * Hands the open note over to InChat: opens the sidebar carrying the note as
   * context, and asks the question the visitor just clicked to ask.
   */
  askInChat: (id: string) => void;
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
  const { react, openChat, chatOpen } = usePixel();

  /*
   * One voice at a time, at the moment of opening: a note left standing while
   * the sidebar slides in would leave Pixel narrating the margin and holding a
   * conversation simultaneously. Clicking a note *after* the chat is open is
   * left alone — that is a deliberate act, and the note costs nothing.
   *
   * Adjusted during render rather than in an effect: React re-runs this
   * component before committing, so the margin never paints with a note still
   * open. An effect would show the note for one frame and then clear it.
   */
  const [chatWasOpen, setChatWasOpen] = useState(chatOpen);
  if (chatOpen !== chatWasOpen) {
    setChatWasOpen(chatOpen);
    if (chatOpen) setActiveId(null);
  }

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

  const askInChat = useCallback(
    (id: string) => {
      const note = byId.get(id);
      if (!note) return;

      const anchor = note.anchors[0];
      setActiveId(null);
      openChat({
        source: "screen",
        screenContext: { noteId: note.id, noteText: note.text, anchor },
        // The visitor clicked "say something more", so this is their turn to
        // spend — it carries their actual intent into the conversation.
        prompt: anchor ? `Tell me more about "${anchor}".` : "Tell me more about that note.",
      });
    },
    [byId, openChat]
  );

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
    () => ({ get: (id) => byId.get(id), activeId, speak, dismiss, askInChat }),
    [byId, activeId, speak, dismiss, askInChat]
  );

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}
