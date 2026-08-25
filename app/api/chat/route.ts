import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt } from "@/lib/pixel/system-prompt";

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

export async function POST(request: Request) {
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

  const messages = body.messages.slice(-MAX_HISTORY_MESSAGES);

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const claudeStream = anthropic.messages.stream({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: buildSystemPrompt({ pathname: body.pathname, pageExcerpt: body.pageExcerpt }),
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
