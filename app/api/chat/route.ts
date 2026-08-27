import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt } from "@/lib/pixel/system-prompt";
import { callerKey, consume } from "@/lib/pixel/rateLimit";
import { SITE_URL } from "@/lib/site";

/*
 * Pixel's chat endpoint. Takes the conversation so far plus optional context
 * about the current page, and streams back Claude's reply as plain text
 * chunks — the sidebar reads the response body as a stream rather than
 * waiting for the full message.
 */

export const runtime = "nodejs";

const MODEL = "claude-sonnet-4-5";
const MAX_TOKENS = 1024;
/** Keeps a runaway client-side history from ballooning the request. */
const MAX_HISTORY_MESSAGES = 20;
/**
 * TEMPORARY cost guard while Pixel is still being built out — remove once
 * the bot, its prompt, and its usage patterns are settled. Mirrors
 * `MAX_USER_MESSAGES` in `components/pixel/PixelSidebar.tsx`; kept here too
 * so the cap holds even if a request bypasses the sidebar's own UI limit.
 */
const MAX_USER_MESSAGES = 5;

/**
 * Hard caps on what one request may carry.
 *
 * Both fields were previously unbounded: `isChatMessage` checked that
 * `content` was a string but never how long a string, and `pageExcerpt` went
 * into the system prompt untouched. Input tokens are billed like any other,
 * so an unbounded field is a cost multiplier as well as the widest available
 * surface for stuffing instructions into the prompt.
 */
const MAX_CONTENT_CHARS = 2_000;
const MAX_EXCERPT_CHARS = 4_000;

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatRequestBody = {
  messages: ChatMessage[];
  pathname?: string;
  pageExcerpt?: string;
};

function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== "object" || value === null) return false;
  const { role, content } = value as Record<string, unknown>;
  return (role === "user" || role === "assistant") && typeof content === "string";
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
      { error: "Pixel isn't configured yet — missing ANTHROPIC_API_KEY." },
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
      { error: "That message is too long for Pixel to read." },
      { status: 413 }
    );
  }

  const userMessageCount = body.messages.filter((m) => m.role === "user").length;
  if (userMessageCount > MAX_USER_MESSAGES) {
    return Response.json(
      { error: "Pixel's chat limit for this session has been reached." },
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
      { error: "Pixel needs a moment — try again shortly." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  const messages = body.messages.slice(-MAX_HISTORY_MESSAGES);
  const pageExcerpt = body.pageExcerpt?.slice(0, MAX_EXCERPT_CHARS);

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const claudeStream = anthropic.messages.stream({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: buildSystemPrompt({ pathname: body.pathname, pageExcerpt }),
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
          encoder.encode("\n\n[Pixel hit an error and had to stop responding.]")
        );
        console.error("Pixel chat stream error:", error);
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
