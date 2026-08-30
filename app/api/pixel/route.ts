import Anthropic from "@anthropic-ai/sdk";
import { buildStablePrompt, buildTurnPrompt } from "@/lib/pixel/system-prompt";
import { callerKey, consume } from "@/lib/pixel/rateLimit";
import {
  MAX_CONTENT_CHARS,
  MAX_HISTORY_MESSAGES,
  MAX_SCREEN_TEXT_CHARS,
  MAX_USER_MESSAGES,
} from "@/lib/pixel/limits";
import { SITE_URL } from "@/lib/site";

/*
 * PixelBot's chat endpoint. Takes the conversation so far plus what the visitor
 * was looking at, and streams Claude's reply back as plain text chunks — the
 * sidebar reads the body as a stream rather than waiting for a whole message.
 *
 * Part of the PixelBot module: see `components/pixel/AGENTS.md` before changing
 * anything here.
 */

export const runtime = "nodejs";

/*
 * Haiku 4.5 per the model comparison in `docs/PIXEL_CHAT.md`: context window is
 * a non-issue at every tier, so the trade-off is voice-adherence against cost.
 * The real cost lever as the prompt grows is caching it, not the model tier.
 */
const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 1024;

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ScreenContext = {
  noteId: string;
  noteText: string;
  anchor?: string;
};

type ChatRequestBody = {
  messages: ChatMessage[];
  pathname?: string | null;
  audience?: "recruiter" | "browsing" | null;
  screen?: ScreenContext | null;
};

function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== "object" || value === null) return false;
  const { role, content } = value as Record<string, unknown>;
  return (role === "user" || role === "assistant") && typeof content === "string";
}

/**
 * Narrows the InScreen handoff payload to the three fields the prompt uses,
 * with the note text bounded.
 *
 * This replaced an open-ended `pageExcerpt` field that was accepted here but
 * never sent — an unbounded string going straight into the system prompt is
 * both a cost multiplier and the widest available surface for stuffing
 * instructions into it. A note is hand-authored content the site already has,
 * so nothing here needs to come from a page scrape.
 */
function readScreen(value: unknown): ScreenContext | null {
  if (typeof value !== "object" || value === null) return null;
  const { noteId, noteText, anchor } = value as Record<string, unknown>;
  if (typeof noteId !== "string" || typeof noteText !== "string") return null;
  return {
    noteId: noteId.slice(0, 64),
    noteText: noteText.slice(0, MAX_SCREEN_TEXT_CHARS),
    anchor: typeof anchor === "string" ? anchor.slice(0, 120) : undefined,
  };
}

/**
 * True when the request came from this site.
 *
 * A browser always sends `Origin` on a cross-origin-capable POST like this
 * one, so a missing header means the caller isn't a browser. That is refused
 * in production and allowed in development, where the request may well come
 * from curl while something is being tested.
 *
 * This is a speed bump, not a wall — `Origin` is trivially forged by anything
 * that is not a browser. The rate limit below is the guard that actually
 * bounds usage.
 */
function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return process.env.NODE_ENV === "development";

  try {
    const host = new URL(origin).host;
    return host === new URL(request.url).host || host === new URL(SITE_URL).host;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return Response.json({ error: "Not allowed." }, { status: 403 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "Pixel isn't plugged in right now — no API key on this deploy." },
      { status: 503 }
    );
  }

  let body: ChatRequestBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!Array.isArray(body.messages) || !body.messages.every(isChatMessage)) {
    return Response.json({ error: "`messages` must be an array of {role, content}." }, { status: 400 });
  }
  if (body.messages.length === 0) {
    return Response.json({ error: "`messages` must not be empty." }, { status: 400 });
  }

  if (body.messages.some((m) => m.content.length > MAX_CONTENT_CHARS)) {
    return Response.json(
      { error: "That message is a bit long for me — try trimming it down?" },
      { status: 413 }
    );
  }

  const userMessageCount = body.messages.filter((m) => m.role === "user").length;
  if (userMessageCount > MAX_USER_MESSAGES) {
    return Response.json(
      { error: "That's the chat limit for this session — hit restart to start a new one." },
      { status: 429 }
    );
  }

  /*
   * The check above counts user messages within *this* body, which bounds one
   * conversation but not one caller — posting a fresh five-message body in a
   * loop never trips it. This is the guard that tracks the caller across
   * requests. It runs last so a malformed body is rejected without spending
   * anyone's budget.
   */
  const limit = consume(callerKey(request));
  if (!limit.allowed) {
    return Response.json(
      { error: "Give me a second — too many messages at once." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  const messages = body.messages.slice(-MAX_HISTORY_MESSAGES);
  const turnPrompt = buildTurnPrompt({
    pathname: body.pathname,
    audience: body.audience,
    screen: readScreen(body.screen),
  });

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  /*
   * Two system blocks, not one. The first is identical on every request and is
   * marked cacheable; the second is the handful of lines about this visitor on
   * this page. Merging them would re-bill the whole prompt — the long part —
   * every time someone changes page.
   */
  const claudeStream = anthropic.messages.stream({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: [
      {
        type: "text" as const,
        text: buildStablePrompt(),
        cache_control: { type: "ephemeral" as const },
      },
      ...(turnPrompt ? [{ type: "text" as const, text: turnPrompt }] : []),
    ],
    messages,
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of claudeStream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (error) {
        controller.enqueue(
          encoder.encode("\n\n[Lost my train of thought there — try me again?]")
        );
        console.error("PixelBot chat stream error:", error);
      } finally {
        controller.close();
      }
    },
    cancel() {
      claudeStream.abort();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
