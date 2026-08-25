"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Info, RefreshCw, X, ArrowRight, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import Pixel from "./Pixel";
import { usePixel } from "./PixelContext";
import styles from "./PixelSidebar.module.css";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const QUICK_REPLIES = ["I'm a recruiter", "I'm just browsing"];

/**
 * Pixel's chat sidebar, pushed in from the header's "Ask Pixel" button (or
 * later, a contextual nudge from the companion). Always mounted so its width
 * can transition — see `.sidebar`/`.open` in the stylesheet — with `inert`
 * keeping it out of the tab order and out of the accessibility tree while
 * closed rather than unmounting the conversation each time.
 */
export default function PixelSidebar() {
  const { chatOpen, closeChat } = usePixel();
  const pathname = usePathname();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (chatOpen) inputRef.current?.focus();
  }, [chatOpen]);

  useEffect(() => {
    if (!chatOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeChat();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [chatOpen, closeChat]);

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || streaming) return;

      const history = [...messages, { role: "user" as const, content: trimmed }];
      setMessages([...history, { role: "assistant", content: "" }]);
      setInput("");
      setStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history, pathname }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error ?? "Pixel couldn't respond.");
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
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            role: "assistant",
            content: "Sorry — I hit an error there. Try again in a moment.",
          };
          return next;
        });
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, streaming, pathname],
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    sendMessage(input);
  };

  const handleReset = () => {
    abortRef.current?.abort();
    setStreaming(false);
    setMessages([]);
    setInput("");
  };

  const handleClose = () => {
    abortRef.current?.abort();
    closeChat();
  };

  return (
    <aside
      className={cn(styles.sidebar, chatOpen && styles.open)}
      aria-label="Ask Pixel"
      data-open={chatOpen || undefined}
      aria-hidden={!chatOpen}
    >
      <div className={styles.inner}>
        <div className={styles.header}>
          <button
            type="button"
            className={styles.iconButton}
            aria-label="About Pixel"
            title="Pixel is an AI chat assistant for this portfolio, powered by Claude. Conversations aren't saved."
          >
            <Info size={16} strokeWidth={1.75} />
          </button>
          <span className={styles.title}>Pixel Bot</span>
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.iconButton}
              onClick={handleReset}
              disabled={messages.length === 0}
              aria-label="Restart conversation"
            >
              <RefreshCw size={15} strokeWidth={1.75} />
            </button>
            <button
              type="button"
              className={styles.iconButton}
              onClick={handleClose}
              aria-label="Close chat"
            >
              <X size={18} strokeWidth={1.75} />
            </button>
          </div>
        </div>

        <div className={styles.body} ref={bodyRef}>
          {messages.length === 0 ? (
            <div className={styles.greetingBlock}>
              <Pixel decorative size={40} />
              <p className={styles.greeting}>Tell me. What&rsquo;s on your mind?</p>
              <div className={styles.quickReplies}>
                {QUICK_REPLIES.map((label) => (
                  <button key={label} type="button" onClick={() => sendMessage(label)}>
                    {label}
                    <ArrowRight size={14} strokeWidth={1.75} />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.messages}>
              {messages.map((message, i) => {
                const isPending =
                  streaming && message.role === "assistant" && message.content === "" && i === messages.length - 1;
                return (
                  <div
                    key={i}
                    className={message.role === "user" ? styles.userBubble : styles.assistantText}
                  >
                    {isPending ? <span className={styles.typing}>🐾 Schlepping&hellip;</span> : message.content}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <form className={styles.inputRow} onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Say something else..."
            className={styles.input}
            disabled={streaming}
          />
          {input.trim() && (
            <button type="submit" className={styles.sendButton} aria-label="Send" disabled={streaming}>
              <ArrowUp size={16} strokeWidth={2} />
            </button>
          )}
        </form>
      </div>
    </aside>
  );
}
