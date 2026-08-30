"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useFlash } from "./hooks";
import type { Expression } from "./sprites";
import {
  useChatSession,
  type Audience,
  type ChatMessage,
  type ScreenContext,
} from "./chat/useChatSession";

/** Reactions raised through the context linger slightly longer than a local flash. */
const REACTION_MS = 900;

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
  setHidden: (hidden: boolean) => void;

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

export function PixelProvider({ children }: { children: React.ReactNode }) {
  const [mood, setMood] = useState<Expression | null>(null);
  const [hidden, setHidden] = useState(false);
  const [reaction, react] = useFlash(REACTION_MS);

  const [chatOpen, setChatOpen] = useState(false);
  const [triggerPathname, setTriggerPathname] = useState<string | null>(null);
  const [screenContext, setScreenContext] = useState<ScreenContext | null>(null);
  const [audience, setAudienceState] = useState<Audience | null>(null);

  const pathname = usePathname();
  const chat = useChatSession();

  /*
   * A handoff has to open the sidebar *and* send its first message, but the
   * message must carry the context set in the same tick — so the send is
   * queued here and fired by the effect below, once state has settled.
   */
  const pendingPrompt = useRef<string | null>(null);

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
