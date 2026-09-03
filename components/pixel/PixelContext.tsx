"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { usePathname } from "next/navigation";
import { useFlash, useHoverSpeech } from "./hooks";
import { isAccessory, type Accessory, type Expression } from "./sprites";
import {
  useChatSession,
  type Audience,
  type ChatMessage,
  type ScreenContext,
} from "./chat/useChatSession";

/** Reactions raised through the context linger slightly longer than a local flash. */
const REACTION_MS = 900;

/**
 * Where the wardrobe's choice is kept. `sessionStorage`, deliberately: the
 * costume is meant to last "the rest of the session" and no longer, so it
 * survives a reload of the tab and dies with it. `localStorage` would make a
 * joke someone made once into a permanent fact about the site, and a plain
 * `useState` would lose it on any hard refresh.
 */
/**
 * How much of the footer has to be on screen before Pixel counts as having
 * arrived in it. Not "any of it": `--corner-lift` is still carrying him up onto
 * the footer's bottom row while the first sliver shows.
 */
const FOOTER_ARRIVED_RATIO = 0.35;

const ACCESSORY_KEY = "pixel:accessory";

function readStoredAccessory(): Accessory | null {
  try {
    const stored = window.sessionStorage.getItem(ACCESSORY_KEY);
    return isAccessory(stored) ? stored : null;
  } catch {
    // Storage access throws outright in some privacy modes rather than
    // returning null. An undressed mascot is a fine answer to that.
    return null;
  }
}

/*
 * The costume is an external store rather than provider state, for one reason:
 * it has to be read from `sessionStorage`, and there is no `sessionStorage` on
 * the server. Seeding `useState` from it would make the client's first render
 * disagree with the HTML it is hydrating; restoring it in an effect instead
 * would be a setState-in-effect cascade. `useSyncExternalStore` is the shape
 * React provides for exactly this — the same one `ThemeToggle` uses to read the
 * `.dark` class that was set before first paint.
 *
 * Module scope, so the read happens once per page load rather than per mount.
 */
let accessoryValue: Accessory | null =
  typeof window === "undefined" ? null : readStoredAccessory();

const accessoryListeners = new Set<() => void>();

function subscribeAccessory(onStoreChange: () => void) {
  accessoryListeners.add(onStoreChange);
  return () => {
    accessoryListeners.delete(onStoreChange);
  };
}

const getAccessorySnapshot = () => accessoryValue;

/** The server has no session, so it always renders him undressed. */
const getServerAccessorySnapshot = (): Accessory | null => null;

function writeAccessory(next: Accessory | null) {
  accessoryValue = next;
  try {
    if (next) window.sessionStorage.setItem(ACCESSORY_KEY, next);
    else window.sessionStorage.removeItem(ACCESSORY_KEY);
  } catch {
    // Not being able to persist it is survivable; the in-memory value still
    // dresses him for this page.
  }
  accessoryListeners.forEach((listener) => listener());
}

/*
 * The corner slot's claim count.
 *
 * An external store rather than provider state, for the same reason the
 * accessory above is one: the claim is taken and released from consumers'
 * effects, and routing that through `setState` is a cascading render the lint
 * rules here reject. `useSyncExternalStore` is the shape React provides for a
 * value that lives outside the render and notifies when it moves.
 *
 * Counted rather than a boolean because two claimants legitimately overlap for
 * a frame during a route change — the outgoing page's panel has not released
 * before the incoming index claims — and a boolean would let the second
 * release blank a slot the first claimant still owns.
 */
let cornerClaims = 0;
const cornerListeners = new Set<() => void>();

function subscribeCorner(onStoreChange: () => void) {
  cornerListeners.add(onStoreChange);
  return () => {
    cornerListeners.delete(onStoreChange);
  };
}

const getCornerSnapshot = () => cornerClaims > 0;

/** Nothing has claimed anything before the first paint. */
const getServerCornerSnapshot = () => false;

/**
 * Take the corner. The returned release is idempotent — React may run an
 * effect's cleanup more than once in development, and a claim that could be
 * released twice would drive the count negative and wedge the slot open.
 */
function claimCornerSlot() {
  cornerClaims += 1;
  cornerListeners.forEach((listener) => listener());

  let released = false;
  return () => {
    if (released) return;
    released = true;
    cornerClaims -= 1;
    cornerListeners.forEach((listener) => listener());
  };
}

/** Where an `openChat` call came from. Analytics and tone both care. */
export type ChatSource = "header" | "companion" | "screen";

export type OpenChatOptions = {
  source?: ChatSource;
  /**
   * The InScreen note being handed off. Set only by the "say something more"
   * affordance on an annotation.
   */
  screenContext?: ScreenContext;
  /**
   * A first message to send on open. A handoff uses this to carry the
   * visitor's actual intent ("tell me more about X") into the conversation.
   */
  prompt?: string;
};

type PixelContextValue = {
  /* ------------------------------------------------------------ the mascot */
  /** Explicit override from a page. `null` hands control back to the companion. */
  mood: Expression | null;
  setMood: (mood: Expression | null) => void;
  /** A short-lived expression that outranks everything, then reverts. */
  reaction: Expression | null;
  react: (expression: Expression, ms?: number) => void;
  hidden: boolean;
  /**
   * Reason-tagged, because `hidden` used to be one unowned boolean and the
   * footer-game item in `docs/PIXELBOT_BUILD.md` §12 flagged a third writer as
   * a real last-writer-wins bug before one existed. Each caller owns a reason
   * string ("under-construction", "footer-game", …) and toggles only that;
   * the companion hides while *any* reason is held, and no caller can undo
   * another's. Built 2026-09-02 — see §15 of the build log.
   */
  setHidden: (reason: string, hidden: boolean) => void;
  /** The costume from the footer wardrobe. `null` is the bare mascot. */
  accessory: Accessory | null;
  setAccessory: (accessory: Accessory | null) => void;
  /**
   * Pixel has reached the footer and is sitting in it. Lives here rather than
   * in the companion because two surfaces need the same answer — the wardrobe,
   * which only exists at the footer, and the InScreen annotation panel, which
   * has to get out of the way when he arrives. One observer, one truth.
   */
  atFooter: boolean;
  /**
   * What Pixel should be saying about whatever the pointer is resting on, from
   * the `data-pixel-say` attribute. `null` is silence.
   *
   * Raised here rather than in `PixelCompanion` because the mascot is not what
   * displays it — three different surfaces do, depending on the page, and none
   * of them is inside the companion. See `useHoverSpeech`.
   */
  saying: string | null;
  /**
   * Whether some surface is already drawing in the corner above the mascot.
   *
   * That corner is a single physical slot with three claimants — an index's
   * static note, an open document annotation, and the roaming `PixelSpeech`
   * that covers every page with neither. They are positioned identically and
   * cannot be allowed to stack, so the ones that own the slot by right say so,
   * and `PixelSpeech` stands down. Ref-counted: two claims overlapping across a
   * route transition must not release the slot early.
   */
  cornerClaimed: boolean;
  /** Claims the corner for as long as the caller holds it. Returns the release. */
  claimCorner: () => () => void;

  /* ------------------------------------------------------------ the chat */
  chatOpen: boolean;
  openChat: (options?: OpenChatOptions) => void;
  closeChat: () => void;
  messages: ChatMessage[];
  streaming: boolean;
  limitReached: boolean;
  /** Sends as the visitor. Page/audience/note context is attached here. */
  sendMessage: (text: string) => void;
  resetChat: () => void;

  /* ---------------------------------------------------------- the context */
  /**
   * The page the visitor was on when they opened the chat — captured at that
   * moment, not read live. The sidebar is mounted in the root layout and never
   * unmounts, so a visitor can open it and then navigate; the live pathname
   * would then answer a question about a page they have already left.
   */
  triggerPathname: string | null;
  /** The InScreen note that handed off into the chat, if one did. */
  screenContext: ScreenContext | null;
  /** What the visitor said they're here for. Passed to the model as a fact. */
  audience: Audience | null;
  setAudience: (audience: Audience) => void;
};

const PixelContext = createContext<PixelContextValue | null>(null);

export function PixelProvider({
  children,
  stageRoutes = [],
}: {
  children: React.ReactNode;
  /**
   * Routes where a page-owned Pixel takes the stage and the corner companion
   * must not also appear — the home hero mounts its own `<Pixel>` and hands
   * off to the corner on exit. A prop rather than knowledge of the app's
   * routes baked in here: the layout owns the route map, this module only
   * honours it. Read during server render too (`usePathname` resolves on the
   * server), so the companion never flashes before hydration on these routes.
   */
  stageRoutes?: string[];
}) {
  const [mood, setMood] = useState<Expression | null>(null);
  const [hiddenReasons, setHiddenReasons] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const setHidden = useCallback((reason: string, next: boolean) => {
    setHiddenReasons((prev) => {
      if (prev.has(reason) === next) return prev;
      const draft = new Set(prev);
      if (next) draft.add(reason);
      else draft.delete(reason);
      return draft;
    });
  }, []);
  const [reaction, react] = useFlash(REACTION_MS);
  const accessory = useSyncExternalStore(
    subscribeAccessory,
    getAccessorySnapshot,
    getServerAccessorySnapshot,
  );
  const [atFooter, setAtFooter] = useState(false);
  const cornerClaimed = useSyncExternalStore(
    subscribeCorner,
    getCornerSnapshot,
    getServerCornerSnapshot,
  );

  const [chatOpen, setChatOpen] = useState(false);
  const [triggerPathname, setTriggerPathname] = useState<string | null>(null);
  const [screenContext, setScreenContext] = useState<ScreenContext | null>(null);
  const [audience, setAudienceState] = useState<Audience | null>(null);

  const pathname = usePathname();
  const chat = useChatSession();

  const hidden = hiddenReasons.size > 0 || stageRoutes.includes(pathname);

  /*
   * A handoff has to open the sidebar *and* send its first message, but the
   * message must carry the context set in the same tick — so the send is
   * queued here and fired by the effect below, once state has settled.
   */
  const pendingPrompt = useRef<string | null>(null);

  /*
   * `#site-footer` is the same public anchor `BottomEdge` measures against, so
   * this is reading a documented handle rather than reaching into another
   * component. An observer rather than a scroll listener: the answer changes
   * twice per page and the browser can work that out without a callback on
   * every frame. The footer lives in the root layout and never unmounts, so
   * this runs once.
   */
  useEffect(() => {
    const footer = document.getElementById("site-footer");
    if (!footer) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setAtFooter(
          entry.isIntersecting && entry.intersectionRatio >= FOOTER_ARRIVED_RATIO,
        );
      },
      { threshold: [0, FOOTER_ARRIVED_RATIO, 0.6, 1] },
    );
    observer.observe(footer);

    return () => observer.disconnect();
  }, []);

  const setAccessory = useCallback(
    (next: Accessory | null) => writeAccessory(next),
    [],
  );

  /*
   * Suppressed while the sidebar is open: Pixel is already talking in there, at
   * length and about what was actually asked, and a second voice narrating
   * whatever the cursor drifts over undercuts it. Keyed on the pathname so a
   * navigation takes the current line with it — see the hook.
   */
  const saying = useHoverSpeech(!chatOpen, pathname);

  const sendMessage = useCallback(
    (text: string) => {
      chat.send(text, { pathname: triggerPathname, audience, screen: screenContext });
    },
    [chat, triggerPathname, audience, screenContext],
  );

  const openChat = useCallback((options: OpenChatOptions = {}) => {
    // Captured once, on open — see `triggerPathname` above.
    setTriggerPathname((current) => current ?? pathname);
    if (options.screenContext) setScreenContext(options.screenContext);
    if (options.prompt) pendingPrompt.current = options.prompt;
    setChatOpen(true);
  }, [pathname]);

  useEffect(() => {
    if (!chatOpen || !pendingPrompt.current) return;
    const prompt = pendingPrompt.current;
    pendingPrompt.current = null;
    sendMessage(prompt);
  }, [chatOpen, sendMessage]);

  const closeChat = useCallback(() => {
    chat.abort();
    setChatOpen(false);
  }, [chat]);

  /**
   * Clears the conversation but keeps what the visitor is looking at — the
   * SOP's reset button "resets conversation (but retains page context)".
   */
  const resetChat = useCallback(() => {
    chat.reset();
    setTriggerPathname(pathname);
  }, [chat, pathname]);

  const setAudience = useCallback((next: Audience) => setAudienceState(next), []);

  const value = useMemo(
    () => ({
      mood,
      setMood,
      reaction,
      react,
      hidden,
      setHidden,
      accessory,
      setAccessory,
      atFooter,
      saying,
      cornerClaimed,
      claimCorner: claimCornerSlot,
      chatOpen,
      openChat,
      closeChat,
      messages: chat.messages,
      streaming: chat.streaming,
      limitReached: chat.limitReached,
      sendMessage,
      resetChat,
      triggerPathname,
      screenContext,
      audience,
      setAudience,
    }),
    [
      mood,
      reaction,
      react,
      hidden,
      setHidden,
      accessory,
      setAccessory,
      atFooter,
      saying,
      cornerClaimed,
      chatOpen,
      openChat,
      closeChat,
      chat.messages,
      chat.streaming,
      chat.limitReached,
      sendMessage,
      resetChat,
      triggerPathname,
      screenContext,
      audience,
      setAudience,
    ],
  );

  return <PixelContext.Provider value={value}>{children}</PixelContext.Provider>;
}

export function usePixel(): PixelContextValue {
  const ctx = useContext(PixelContext);
  if (!ctx) {
    throw new Error("usePixel must be used inside <PixelProvider> (see app/layout.tsx)");
  }
  return ctx;
}

/**
 * Pin Pixel to a mood for as long as this component is mounted, then release it.
 * Used by the 404 page as `usePixelMood("dead")`.
 */
export function usePixelMood(expression: Expression | null) {
  const { setMood } = usePixel();

  useEffect(() => {
    setMood(expression);
    return () => setMood(null);
  }, [expression, setMood]);
}

/**
 * Hold the corner above the mascot for as long as this component is mounted.
 *
 * Called by whichever surface owns that slot on the current page — `IndexShell`
 * for the whole of an index, `AnnotationPanel` only while a note is actually
 * open. `PixelSpeech` reads the other end of it and keeps quiet rather than
 * drawing a second box over the first.
 */
export function useCornerSlot(active = true) {
  useEffect(() => {
    if (!active) return;
    return claimCornerSlot();
  }, [active]);
}
