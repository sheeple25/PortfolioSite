import { getProjectSummaries } from "@/lib/projects";
import { getWritingSummaries } from "@/lib/writing";
import { CONTACT_EMAIL, SITE_DESIGNATION, SITE_NAME, SOCIAL_LINKS } from "@/lib/site";

/*
 * Builds Pixel's system prompt from the same content collections the site
 * renders from — project and writing summaries, plus the bio constants in
 * `lib/site.ts`. There is no separate "knowledge base" to keep in sync: a new
 * `.md` file under `content/projects` or `content/writing` shows up here the
 * next time the prompt is built, same as it would on the index pages.
 */

function describeProjects(): string {
  const projects = getProjectSummaries();
  if (projects.length === 0) return "No projects published yet.";

  return projects
    .map((p) => `- "${p.meta.title}" (/projects/${p.slug}): ${p.meta.description}`)
    .join("\n");
}

function describeWriting(): string {
  const writing = getWritingSummaries();
  if (writing.length === 0) return "No writing published yet.";

  return writing
    .map((w) => `- "${w.meta.title}" (/writing/${w.slug}): ${w.meta.description}`)
    .join("\n");
}

function describeLinks(): string {
  const links = SOCIAL_LINKS.filter((l) => l.href);
  if (links.length === 0) return "";
  return links.map((l) => `- ${l.label}: ${l.href}`).join("\n");
}

export type PixelPromptContext = {
  /** Current page path, e.g. "/projects/unflattening". Lets Pixel ground answers in what the visitor is looking at. */
  pathname?: string;
  /** Optional excerpt of the visible page content, for "explain this" requests. */
  pageExcerpt?: string;
};

export function buildSystemPrompt(context: PixelPromptContext = {}): string {
  const parts = [
    `You are Pixel, the mascot and chat assistant embedded in ${SITE_NAME}'s portfolio site. You speak on ${SITE_NAME}'s behalf, in first person plural is wrong — speak as Pixel, referring to the portfolio owner by name or "they" as appropriate, never impersonate them in first person as if you are them.`,
    `${SITE_NAME} is a ${SITE_DESIGNATION}.`,
    `Contact: ${CONTACT_EMAIL}`,
    describeLinks() && `Profiles:\n${describeLinks()}`,
    `Projects:\n${describeProjects()}`,
    `Writing:\n${describeWriting()}`,
    `Keep answers concise and conversational — this is a sidebar chat, not an essay. When relevant, point to the specific project or writing piece (with its path) rather than describing everything.`,
    `If asked something you don't have information about, say so plainly instead of guessing.`,
  ];

  if (context.pathname) {
    parts.push(`The visitor is currently on: ${context.pathname}`);
  }
  if (context.pageExcerpt) {
    parts.push(`Visible content on the current page:\n${context.pageExcerpt}`);
  }

  return parts.filter(Boolean).join("\n\n");
}
