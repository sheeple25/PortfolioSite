"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_USER_MESSAGES } from "@/lib/pixel/limits";

/*
 * The conversation itself — state, streaming and the fetch.
 *
 * This lives outside `PixelSidebar` on purpose. The sidebar used to own
 * `messages` in local state, which made it impossible for anything else to open
 * the chat with something already in it — and an InScreen handoff is exactly
 * that. `PixelProvider` holds this hook; the sidebar renders what it returns.
 */

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

/** What the visitor told PixelBot they are here for. */
export type Audience = "recruiter" | "browsing";

/**
 * The InScreen note a conversation was handed off from.
 *
 * Deliberately three known fields rather than a scrape of the page: it is
 * hand-authored content the site already has, so it needs no capture step, has
 * nothing unbounded in it, and carries no injection surface.
 */
export type ScreenContext = {
  noteId: string;
  /** The note's own text, as written in the markdown. */
  noteText: string;
  /** The bold word that opened it, as it reads on the page. */
  anchor?: string;
};

/** Everything the route needs about where the visitor was when they asked. */
export type ChatRequestContext = {
  /** The page they were on when the chat was opened — see `triggerPathname`. */
  pathname: string | null;
  audience: Audience | null;
  screen: ScreenContext | null;
};

export type ChatSession = {
  messages: ChatMessage[];
  streaming: boolean;
  /** User turns spent so far, against `MAX_USER_MESSAGES`. */
  userMessageCount: number;
  limitReached: boolean;
  send: (text: string, context: ChatRequestContext) => void;
  reset: () => void;
  abort: () => void;
};

export function useChatSession(): ChatSession {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  /*
   * `send` reads the history through a ref rather than closing over `messages`.
   * Closing over it would rebuild the callback on every streamed chunk, and a
   * handoff calls `send` from an effect the moment the sidebar opens — a stale
   * identity there would post the conversation as it was one render ago.
   */
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const userMessageCount = messages.filter((m) => m.role === "user").length;
  const limitReached = userMessageCount >= MAX_USER_MESSAGES;

  useEffect(() => () => abortRef.current?.abort(), []);

  const abort = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
  }, []);

  const send = useCallback(async (text: string, context: ChatRequestContext) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const previous = messagesRef.current;
    if (previous.filter((m) => m.role === "user").length >= MAX_USER_MESSAGES) return;
    if (abortRef.current) return;

    const history = [...previous, { role: "user" as const, content: trimmed }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/pixel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          pathname: context.pathname,
          audience: context.audience,
          screen: context.screen,
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: acc };
          return next;
        });
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      /*
       * The raw error text used to be rendered straight into a chat bubble,
       * which meant a visitor could be shown an SDK message. Pixel says
       * something Pixel would say; the detail goes to the console.
       */
      console.error("PixelBot chat error:", error);
      const detail = error instanceof Error ? error.message : "";
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          role: "assistant",
          content:
            detail ||
            "Something went wrong on my end — not your fault. Give it a second and try again?",
        };
        return next;
      });
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
    setMessages([]);
  }, []);

  return { messages, streaming, userMessageCount, limitReached, send, reset, abort };
}
