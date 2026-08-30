"use client";

import { useEffect, useRef, useState } from "react";
import { Info, RefreshCw, X, ArrowRight, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import Pixel from "../Pixel";
import { usePixel } from "../PixelContext";
import type { Audience } from "./useChatSession";
import MessageText from "./MessageText";
import styles from "./PixelSidebar.module.css";

/**
 * The greeting MCQ. Answering sets the audience *and* spends a turn — the
 * visitor said something, so Pixel answers it. (An audience learned from
 * InScreen instead arrives as a fact and costs nothing; see `PixelContext`.)
 */
const QUICK_REPLIES: { label: string; audience: Audience }[] = [
  { label: "I'm a recruiter", audience: "recruiter" },
  { label: "I'm just browsing", audience: "browsing" },
];

/**
 * InChat: the sidebar. Always mounted so its width can transition — see
 * `.sidebar`/`.open` in the stylesheet — with `inert` keeping it out of the tab
 * order and the accessibility tree while closed, rather than unmounting the
 * conversation each time.
 *
 * The conversation itself lives in `PixelContext`, not here: an InScreen
 * handoff has to be able to open this panel with a message already in flight.
 */
export default function PixelSidebar() {
  const {
    chatOpen,
    closeChat,
    messages,
    streaming,
    limitReached,
    sendMessage,
    resetChat,
    audience,
    setAudience,
  } = usePixel();

  const [input, setInput] = useState("");
  const [showInfo, setShowInfo] = useState(false);

  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (chatOpen) inputRef.current?.focus();
  }, [chatOpen]);

  useEffect(() => {
    if (!chatOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      // Escape closes the disclaimer first, the panel second.
      if (showInfo) setShowInfo(false);
      else closeChat();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [chatOpen, closeChat, showInfo]);

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const submit = (text: string) => {
    if (streaming || limitReached) return;
    sendMessage(text);
    setInput("");
  };

  return (
    <aside
      className={cn(styles.sidebar, chatOpen && styles.open)}
      aria-label="Ask Pixel"
      data-open={chatOpen || undefined}
      aria-hidden={!chatOpen}
      inert={!chatOpen}
    >
      <div className={styles.inner}>
        <div className={styles.header}>
          <button
            type="button"
            className={styles.iconButton}
            aria-label="About Pixel"
            aria-expanded={showInfo}
            onClick={() => setShowInfo((open) => !open)}
          >
            <Info size={16} strokeWidth={1.75} />
          </button>
          <span className={styles.title}>Pixel</span>
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.iconButton}
              onClick={resetChat}
              disabled={messages.length === 0}
              aria-label="Restart conversation"
            >
              <RefreshCw size={15} strokeWidth={1.75} />
            </button>
            <button
              type="button"
              className={styles.iconButton}
              onClick={closeChat}
              aria-label="Close chat"
            >
              <X size={18} strokeWidth={1.75} />
            </button>
          </div>
        </div>

        {showInfo && (
          <div className={styles.disclaimer} role="note">
            <p>
              I&rsquo;m an AI assistant — a Claude model with a page of notes about
              Vidush, not Vidush himself. I can be wrong, and nothing I say is a
              statement on his behalf.
            </p>
            <p>Conversations aren&rsquo;t saved. Closing or reloading clears this one.</p>
            <button type="button" onClick={() => setShowInfo(false)}>
              Got it
            </button>
          </div>
        )}

        <div className={styles.body} ref={bodyRef}>
          {messages.length === 0 ? (
            <div className={styles.greetingBlock}>
              <Pixel decorative size={40} />
              <p className={styles.greeting}>Tell me. What&rsquo;s on your mind?</p>
              {/*
                Skipped when InScreen already asked — being asked the same
                question twice is the tell that two surfaces aren't talking.
              */}
              {audience === null && (
                <div className={styles.quickReplies}>
                  {QUICK_REPLIES.map(({ label, audience: value }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => {
                        setAudience(value);
                        submit(label);
                      }}
                      disabled={limitReached}
                    >
                      {label}
                      <ArrowRight size={14} strokeWidth={1.75} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className={styles.messages}>
              {messages.map((message, i) => {
                const isPending =
                  streaming &&
                  message.role === "assistant" &&
                  message.content === "" &&
                  i === messages.length - 1;
                if (message.role === "user") {
                  return (
                    <div key={i} className={styles.userBubble}>
                      {message.content}
                    </div>
                  );
                }
                return (
                  <div key={i} className={styles.assistantText}>
                    {isPending ? (
                      <span className={styles.typing}>🐾 Schlepping&hellip;</span>
                    ) : (
                      <MessageText text={message.content} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {limitReached ? (
          <p className={styles.limitNotice}>
            That&rsquo;s the chat limit for this session — hit the restart icon above
            to start a new one.
          </p>
        ) : (
          <form
            className={styles.inputRow}
            onSubmit={(event) => {
              event.preventDefault();
              submit(input);
            }}
          >
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
              <button
                type="submit"
                className={styles.sendButton}
                aria-label="Send"
                disabled={streaming}
              >
                <ArrowUp size={16} strokeWidth={2} />
              </button>
            )}
          </form>
        )}
      </div>
    </aside>
  );
}
