import { Fragment, type ReactNode } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import { toString as mdastToString } from "mdast-util-to-string";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { parse as parseYaml } from "yaml";
import type { Nodes, Root, RootContent } from "mdast";
import type { Root as HastRoot } from "hast";
import { proseComponents } from "@/components/writing/proseComponents";
import type {
  ArchiveCategory,
  TocEntry,
  WritingDocument,
  WritingFrontmatter,
  WritingNote,
  WritingSection,
} from "./types";

/*
 * Markdown -> section tree, on the server.
 *
 * The obvious alternative was `@next/mdx`, and it was rejected for one reason:
 * this section previews part of each block and expands the rest, annotates bold
 * words with margin notes, and builds a contents rail — all of which need the
 * document *as a structure*, not as one opaque element. MDX hands back a single
 * component whose children can only be split by poking at React internals.
 * Parsing to mdast lets every one of those fall out of the same pass.
 *
 * Running remark as a plain library also sidesteps the Turbopack constraint on
 * MDX build plugins, which can only be named by string and take serialisable
 * options (see `node_modules/next/dist/docs/01-app/02-guides/mdx.md`).
 */

/** Words per minute used for the reading estimate. Unhurried, for essays. */
const READING_WPM = 220;

/** A block comment on its own line, directly under a heading, marks it private. */
const PRIVATE_MARKER = /^<!--\s*private\s*-->$/;

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

/*
 * Block directives. Each is written as a paragraph on its own that opens with
 * a bracketed keyword, which keeps the source readable as plain markdown and
 * needs no MDX:
 *
 *   [NOTE anchor, alias: body]   an aside, triggered by those bold words
 *   [NOTE: body]                 an aside with no trigger
 *   [FIGURE design-loop: cap]    a registered diagram, with its caption
 *   [PLACEHOLDER a.svg: cap]     a reserved slot, until the asset arrives
 */
const NOTE_DIRECTIVE = /^\[NOTE(?:\s+([^:\]]*?))?:\s*([\s\S]+)\]$/;
const FIGURE_DIRECTIVE = /^\[FIGURE\s+([^:\]]+?):\s*([\s\S]*?)\]$/;
const PLACEHOLDER_DIRECTIVE = /^\[PLACEHOLDER\s+([^:\]]+?):\s*([\s\S]*?)\]$/;

/**
 * Markers that split a section into what shows while collapsed and what waits
 * behind the toggle. Both are optional — without them the split falls back to
 * "first paragraph previews the rest".
 */
const PREVIEW_MARKER = /^Preview:?$/i;
const EXPANDED_MARKER = /^Expanded:?$/i;

/** Parses markdown text into mdast. GFM is on for tables, strikethrough, footnotes. */
const toMdast = unified().use(remarkParse).use(remarkGfm);

/**
 * mdast -> hast. GFM node types (tables, footnotes, deletions) already have
 * handlers in `mdast-util-to-hast`, so `remark-gfm` isn't needed on this side.
 */
const toHast = unified().use(remarkRehype);

type RawSection = {
  id: string;
  title: string;
  private: boolean;
  nodes: RootContent[];
  /** Index into `nodes` where `Expanded:` appeared, or null if unmarked. */
  explicitSplit: number | null;
  subheads: Array<{ id: string; title: string }>;
};

/**
 * Slugs that stay stable as long as the heading text does — they end up in URLs
 * as `#fragment`s, so a counter suffix on collision beats a content hash.
 */
function createSlugger() {
  const used = new Map<string, number>();
  return (text: string): string => {
    const base = slugify(text) || "section";
    const seen = used.get(base) ?? 0;
    used.set(base, seen + 1);
    return seen === 0 ? base : `${base}-${seen + 1}`;
  };
}

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize("NFKD")
      // NFKD above splits accents off; this drops the combining marks.
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  );
}

function countWords(nodes: RootContent[]): number {
  return nodes.reduce((total, node) => {
    const text = mdastToString(node).trim();
    return total + (text ? text.split(/\s+/).length : 0);
  }, 0);
}

/**
 * True for a paragraph that holds nothing but an image — markdown's only way of
 * writing a standalone figure. These become `<figure>` rather than a `<p>` with
 * a picture wedged inside it.
 */
function imageOnlyParagraph(node: RootContent) {
  if (node.type !== "paragraph") return null;

  let found = null;
  for (const child of node.children) {
    if (child.type === "image") {
      // Two images side by side is a gallery, not a figure — leave it alone.
      if (found) return null;
      found = child;
    } else if (child.type !== "text" || child.value.trim() !== "") {
      return null;
    }
  }
  return found;
}

/**
 * Rewrites a node as a custom element. `hName`/`hProperties` are mdast's own
 * escape hatch into hast, so none of this needs a rehype plugin — the matching
 * entry in `proseComponents` picks the tag name up by key.
 */
function customBlock(
  hName: string,
  hProperties: Record<string, string | number>
): RootContent {
  return { type: "paragraph", children: [], data: { hName, hProperties } };
}

function figureNode(
  src: string,
  alt: string,
  caption: string,
  ord: number
): RootContent {
  // Lower-case, single-word property names on purpose: hast passes unknown
  // attributes through verbatim, so anything camelCased would arrive flattened.
  return customBlock("x-figure", { src, alt, caption, ord });
}

/** Renders a run of mdast blocks to React elements. */
function renderNodes(
  nodes: RootContent[],
  shared: RootContent[]
): ReactNode | null {
  if (nodes.length === 0) return null;

  // Link and footnote definitions live at the document root, so every fragment
  // gets a copy or references inside it would dangle. Definitions emit nothing
  // on their own, and `mdast-util-to-hast` only prints the footnotes actually
  // referenced within the fragment, so copying them everywhere is harmless.
  const root: Root = { type: "root", children: [...nodes, ...shared] };
  const hast = toHast.runSync(root) as HastRoot;

  return toJsxRuntime(hast, {
    Fragment,
    jsx,
    jsxs,
    components: proseComponents,
  });
}

function splitFrontmatter(source: string): {
  data: Record<string, unknown>;
  body: string;
} {
  const match = FRONTMATTER.exec(source);
  if (!match) return { data: {}, body: source };

  const parsed: unknown = parseYaml(match[1]);
  const data =
    parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};

  return { data, body: source.slice(match[0].length) };
}

function readFrontmatter(
  data: Record<string, unknown>,
  slug: string
): WritingFrontmatter {
  return {
    title: typeof data.title === "string" ? data.title : slug,
    subtitle: typeof data.subtitle === "string" ? data.subtitle : undefined,
    description: typeof data.description === "string" ? data.description : "",
    // `date:` unquoted in YAML parses to a Date; normalise both spellings.
    date:
      data.date instanceof Date
        ? data.date.toISOString().slice(0, 10)
        : typeof data.date === "string"
          ? data.date
          : "",
    version: typeof data.version === "string" ? data.version : undefined,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : undefined,
    recommended: data.recommended === true,
    draft: data.draft === true,
    // Absent means "expandable", so only an explicit `false` turns it off.
    expandable: data.expandable === false ? false : undefined,

    // Archive fields. Unset everywhere else, which is why each is optional.
    place: typeof data.place === "string" ? data.place : undefined,
    term: typeof data.term === "string" ? data.term : undefined,
    category: isArchiveCategory(data.category) ? data.category : undefined,
    rank: typeof data.rank === "number" ? data.rank : undefined,
    role: typeof data.role === "string" ? data.role : undefined,
    timeline: typeof data.timeline === "string" ? data.timeline : undefined,
    team: typeof data.team === "string" ? data.team : undefined,
    skills: Array.isArray(data.skills) ? data.skills.map(String) : undefined,
    cover: typeof data.cover === "string" ? data.cover : undefined,
    coverAlt: typeof data.coverAlt === "string" ? data.coverAlt : undefined,
    titleEffect:
      typeof data.titleEffect === "string" ? data.titleEffect : undefined,
  };
}

const ARCHIVE_CATEGORIES = [
  "product",
  "transport",
  "research",
  "furniture",
  "textile",
] as const;

function isArchiveCategory(value: unknown): value is ArchiveCategory {
  return (
    typeof value === "string" &&
    (ARCHIVE_CATEGORIES as readonly string[]).includes(value)
  );
}

/**
 * The shallowest heading in the file is what a section break means.
 *
 * Files have been written with both `##` and `###` as the section level, and
 * which one an author reached for says nothing about intent. Detecting it means
 * the next document works whichever they pick, and the level below it is
 * automatically treated as a subheading.
 */
function detectSectionDepth(root: Root): number {
  let depth = 6;
  for (const node of root.children) {
    if (node.type === "heading" && node.depth < depth) depth = node.depth;
  }
  return depth === 6 ? 2 : depth;
}

/**
 * Walks the root, cutting a new section at every section-level heading.
 *
 * Along the way it resolves the block directives, drops the marker comments,
 * promotes standalone images to figures, and stamps ids onto subheadings so the
 * sidebar can deep-link to them.
 */
function collectSections(root: Root, sectionDepth: number) {
  const slugify_ = createSlugger();
  const lead: RootContent[] = [];
  const sections: RawSection[] = [];
  const shared: RootContent[] = [];
  const notes: WritingNote[] = [];
  let current: RawSection | null = null;
  /** Figures are numbered across the whole document, not per section. */
  let figures = 0;

  for (const node of root.children) {
    if (node.type === "definition" || node.type === "footnoteDefinition") {
      shared.push(node);
      continue;
    }

    if (node.type === "heading" && node.depth === sectionDepth) {
      const title = mdastToString(node);
      current = {
        id: slugify_(title),
        title,
        private: false,
        nodes: [],
        explicitSplit: null,
        subheads: [],
      };
      sections.push(current);
      continue;
    }

    if (node.type === "html") {
      // Only counts as a marker before any prose — otherwise it's a stray
      // comment mid-section and gets dropped like every other raw HTML node.
      if (
        current &&
        current.nodes.length === 0 &&
        PRIVATE_MARKER.test(node.value.trim())
      ) {
        current.private = true;
      }
      continue;
    }

    const target = current ? current.nodes : lead;

    if (node.type === "heading" && node.depth === sectionDepth + 1 && current) {
      const title = mdastToString(node);
      const id = slugify_(title);
      current.subheads.push({ id, title });
      node.data = { ...node.data, hProperties: { ...node.data?.hProperties, id } };
      target.push(node);
      continue;
    }

    if (node.type === "paragraph") {
      const text = mdastToString(node).trim();

      if (EXPANDED_MARKER.test(text)) {
        if (current) current.explicitSplit = current.nodes.length;
        continue;
      }
      // `Preview:` needs no bookkeeping — a section starts in preview mode.
      if (PREVIEW_MARKER.test(text)) continue;

      const noteMatch = NOTE_DIRECTIVE.exec(text);
      if (noteMatch) {
        const id = `note-${notes.length + 1}`;
        notes.push({
          id,
          anchors: (noteMatch[1] ?? "")
            .split(",")
            .map((anchor) => slugify(anchor.trim()))
            .filter(Boolean),
          text: noteMatch[2].trim(),
          sectionId: current?.id ?? null,
        });
        target.push(customBlock("x-margin-note", { noteid: id }));
        continue;
      }

      const figureMatch = FIGURE_DIRECTIVE.exec(text);
      if (figureMatch) {
        const caption = figureMatch[2].trim();
        target.push(
          figureNode(`diagram:${figureMatch[1].trim()}`, caption, caption, ++figures)
        );
        continue;
      }

      const placeholderMatch = PLACEHOLDER_DIRECTIVE.exec(text);
      if (placeholderMatch) {
        const caption = placeholderMatch[2].trim();
        target.push(
          figureNode(
            `placeholder:${placeholderMatch[1].trim()}`,
            caption,
            caption,
            ++figures
          )
        );
        continue;
      }

      const image = imageOnlyParagraph(node);
      if (image) {
        target.push(
          figureNode(image.url, image.alt ?? "", image.title ?? "", ++figures)
        );
        continue;
      }
    }

    target.push(node);
  }

  return { lead, sections, shared, notes };
}

/**
 * Turns every bold span naming a note into a trigger.
 *
 * Matching is document-wide rather than per section on purpose: `de-future` is
 * bolded in the third section but explained by a note written in the first, and
 * the reader shouldn't have to have got there to ask what it means.
 */
function linkNoteRefs(nodes: RootContent[], byAnchor: Map<string, string>) {
  const visit = (node: Nodes) => {
    if (node.type === "strong") {
      const noteid = byAnchor.get(slugify(mdastToString(node)));
      if (noteid) {
        node.data = { ...node.data, hName: "x-note-ref", hProperties: { noteid } };
        // Don't descend: nested bold inside a trigger would double-wrap it.
        return;
      }
    }
    if ("children" in node) {
      for (const child of node.children) visit(child as Nodes);
    }
  };

  for (const node of nodes) visit(node as Nodes);
}

/**
 * Picks the paragraph that stands in for a section that has no `Expanded:`
 * marker. It's the first *prose* block, so a section opening on a figure or a
 * note still previews with words; anything skipped stays at the top of the
 * body, in its original order.
 */
function splitPreview(nodes: RootContent[]) {
  const index = nodes.findIndex(
    (node) => node.type === "paragraph" && node.data?.hName === undefined
  );

  if (index === -1) {
    return { preview: nodes.slice(0, 1), body: nodes.slice(1) };
  }

  return {
    preview: [nodes[index]],
    body: [...nodes.slice(0, index), ...nodes.slice(index + 1)],
  };
}

export function parseWritingDocument(
  source: string,
  slug: string,
  { includePrivate }: { includePrivate: boolean }
): WritingDocument {
  const { data, body } = splitFrontmatter(source);
  const meta = readFrontmatter(data, slug);

  const root = toMdast.parse(body) as Root;
  const sectionDepth = detectSectionDepth(root);
  const { lead, sections: raw, shared, notes } = collectSections(root, sectionDepth);

  // Notes are collected across the whole file before any bold span is resolved,
  // so a trigger can point at a note written in an earlier or later section.
  const byAnchor = new Map<string, string>();
  for (const note of notes) {
    for (const anchor of note.anchors) {
      if (!byAnchor.has(anchor)) byAnchor.set(anchor, note.id);
    }
  }
  linkNoteRefs(lead, byAnchor);
  for (const section of raw) linkNoteRefs(section.nodes, byAnchor);

  const visible = raw.filter((section) => includePrivate || !section.private);

  /*
   * `expandable: false` hands the whole section to the preview, which leaves
   * the body empty — `renderNodes` returns null for that, and `SectionCard`
   * only draws its toggle when a body exists. So the section renders open,
   * with no control, without the card needing to know why.
   */
  const expandable = meta.expandable !== false;

  const sections: WritingSection[] = visible.map((section) => {
    const { preview, body: rest } = !expandable
      ? { preview: section.nodes, body: [] as RootContent[] }
      : section.explicitSplit === null
        ? splitPreview(section.nodes)
        : {
            preview: section.nodes.slice(0, section.explicitSplit),
            body: section.nodes.slice(section.explicitSplit),
          };

    return {
      id: section.id,
      title: section.title,
      private: section.private,
      wordCount: countWords(section.nodes),
      hiddenBlocks: rest.length,
      preview: renderNodes(preview, shared),
      body: renderNodes(rest, shared),
    };
  });

  const toc: TocEntry[] = visible.map((section, i) => ({
    id: section.id,
    title: section.title,
    children: section.subheads,
    private: section.private,
    wordCount: sections[i].wordCount,
    hiddenBlocks: sections[i].hiddenBlocks,
  }));

  const visibleIds = new Set(visible.map((section) => section.id));
  const wordCount =
    countWords(lead) + sections.reduce((sum, s) => sum + s.wordCount, 0);

  return {
    slug,
    meta,
    lead: renderNodes(lead, shared),
    sections,
    toc,
    // A note written inside a section stripped from this build would otherwise
    // still be narratable from a trigger elsewhere in the document.
    notes: notes.filter(
      (note) => note.sectionId === null || visibleIds.has(note.sectionId)
    ),
    wordCount,
    readingMinutes: Math.max(1, Math.round(wordCount / READING_WPM)),
    showsPrivate: visible.some((section) => section.private),
  };
}
