/**
 * The PixelBot module's one public surface.
 *
 * PixelBot is a single feature with a single home: the mascot, the InScreen
 * annotations and the InChat sidebar are all one thing, and everything outside
 * `components/pixel/` (and `lib/pixel/`, `app/api/pixel/`) talks to it through
 * this file — never by reaching into a file inside the module. A deep import
 * like `@/components/pixel/chat/PixelSidebar` is a lint error; add an export
 * here instead.
 *
 * Server-only pieces live in `./server` — one extra door, because Next.js
 * requires the split, not because there are two modules. Everything reachable
 * from *this* file must be safe to pull into a browser bundle.
 *
 * See `components/pixel/AGENTS.md` before changing anything in this module.
 */

/* ---------------------------------------------------------------- the mascot */
export { default as Pixel, type PixelProps } from "./Pixel";
export { default as PixelCompanion } from "./PixelCompanion";
/* The same mind in a bigger body, in the page's flow rather than the corner. */
export { default as PixelStage } from "./PixelStage";
export { default as PacmanCursor } from "./PacmanCursor";
export { default as PixelSpeech } from "./PixelSpeech";
export {
  PixelProvider,
  usePixel,
  usePixelMood,
  useCornerSlot,
} from "./PixelContext";
export { useBlink, useFlash, useGaze, useHoverSpeech, SAY_ATTRIBUTE } from "./hooks";
export { EXPRESSIONS, rowsToRuns, runsToPath, type Expression } from "./sprites";
export { ACCESSORIES, ACCESSORY_KEYS, type Accessory } from "./sprites";

/* ------------------------------------------------------------------ InScreen */
/* The right-hand column: annotations raised by a bold word in the prose. */
export { NotesProvider, useNotes } from "./screen/NotesContext";
export { default as AnnotationPanel } from "./screen/AnnotationPanel";
export { default as NoteRef } from "./screen/NoteRef";
export { default as MarginNote } from "./screen/MarginNote";

/* -------------------------------------------------------------------- InChat */
export { default as PixelSidebar } from "./chat/PixelSidebar";
