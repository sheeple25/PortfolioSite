"use client";

import Link from "next/link";
import { useShutterLink } from "@/components/chrome/Shutter";
import { ReaderProvider, useReader } from "@/components/writing/ReaderContext";
import Contents, { sectionIds, type ContentsRow } from "./Contents";
import ContentsBar from "./ContentsBar";
import {
  useHeroChrome,
  useFooterAccent,
  useImmersiveChrome,
  useNavAccent,
  useSiteChromeSync,
} from "./useImmersiveChrome";
import styles from "./case.module.css";

/**
 * The case study chassis: banner, three-margin reading layout, contents rail,
 * Pixel's margin, and the site-chrome behaviour that goes with a full-bleed
 * hero.
 *
 * Every project page is this plus its own beats. Nothing here knows which
 * project it is rendering — the banner arrives as a node, the rail as data, the
 * beats as a render prop, and the palette as a set of token overrides.
 */

/**
 * Per-project token overrides, written as CSS custom properties onto the page.
 *
 * `case.module.css` declares the full set on `.page` with neutral defaults, so
 * a project that passes nothing is monochrome — which is the correct rendering
 * for Loco Lavatory, where the absence of colour is deliberate rather than
 * unfinished. Traces passes its magenta. Changing a project's identity is one
 * object, not a stylesheet.
 */
export type Palette = Partial<{
  /** The project accent — headings, indices, marks. */
  accent: string;
  /** A wash of the accent, for tinted cards. */
  tint: string;
  /** A darker relative, for type that must read on the tint. */
  deep: string;
  /** The stage colour behind a carousel. */
  stage: string;
  /**
   * Type colour for a banner texture built from text.
   *
   * Optional: `case.module.css` derives it from `accent` by mixing toward
   * white, so a project only sets this when the derived value is wrong for its
   * particular ground.
   */
  wall: string;
}>;

/** `.page`'s own default for `--tp` in `case.module.css` — Loco Lavatory's. */
const DEFAULT_ACCENT = "#1e1e1e";

function paletteVars(p?: Palette): React.CSSProperties {
  if (!p) return {};
  const vars: Record<string, string> = {};
  if (p.accent) vars["--tp"] = p.accent;
  if (p.tint) vars["--tp-tint"] = p.tint;
  if (p.deep) vars["--tp-deep"] = p.deep;
  if (p.stage) vars["--tp-stage"] = p.stage;
  if (p.wall) vars["--tp-wall"] = p.wall;
  return vars as React.CSSProperties;
}

/**
 * The way back, wired to the shutter so it plays the same gesture in reverse:
 * the banner closes upward and the index header opens in its place. A plain
 * `<Link>` underneath, so the href, prefetching and modified clicks all still
 * behave — the handler only takes over the ordinary left click.
 */
function BackLink({ href, label }: { href: string; label: string }) {
  const onClick = useShutterLink(href);

  return (
    <Link href={href} className={styles.backLink} onClick={onClick}>
      <span aria-hidden="true">&larr;</span>
      {label}
    </Link>
  );
}

/** Props a beat takes so the contents rail can scroll to it and track it. */
export type Anchor = (id: string) => {
  id: string;
  anchorRef: (el: HTMLElement | null) => void;
};

/**
 * Sits inside `ReaderProvider` to lift `register` out of the context and hand
 * it to the beats. Separate from the provider because a component cannot
 * consume a context it renders.
 */
function Column({ children }: { children: (at: Anchor) => React.ReactNode }) {
  const { register } = useReader();

  const at: Anchor = (id) => ({
    id,
    anchorRef: (el: HTMLElement | null) => register(id, el),
  });

  return <div className={styles.column}>{children(at)}</div>;
}

export type CaseShellProps = {
  /** The banner element, built with `Banner` and a texture of the page's choosing. */
  banner: React.ReactNode;
  /** The contents rail's rows, in page order. */
  contents: readonly ContentsRow[];
  /** Per-project accent tokens. Omit for the neutral, colourless default. */
  palette?: Palette;
  /** One line in Pixel's margin. The frames use it as a nudge, not a feature. */
  marginNote?: React.ReactNode;
  /**
   * How far the page scrolls before the banner has cleared the site header, in
   * px. Matches the banner's own height below the bar — 480 in every frame so
   * far, which is this default.
   */
  heroDepth?: number;
  /** Index this project hangs off. Every case study is Work today. */
  backHref?: string;
  /** What that index is called, in the reader's words rather than the route's. */
  backLabel?: string;
  children: (at: Anchor) => React.ReactNode;
};

export default function CaseShell({
  banner,
  contents,
  palette,
  marginNote,
  heroDepth = 480,
  backHref = "/projects",
  backLabel = "Work",
  children,
}: CaseShellProps) {
  /*
   * Scrolling down clears the site header, footer and both margins for a full
   * window; scrolling back up, or reaching either end, returns them.
   */
  const { chromeVisible, railsVisible } = useImmersiveChrome();
  useSiteChromeSync(chromeVisible, railsVisible);

  // Same fallback as `.page`'s own `--tp` below, so a palette-less project
  // (Loco Lavatory) still gives the pill its correct near-black rather than
  // leaving it on the site's default blue.
  useNavAccent(palette?.accent ?? DEFAULT_ACCENT);

  // The footer can't take that same fallback: its ground is black, so the
  // near-black would read as no accent at all. Palette-less projects get the
  // site blue down there instead.
  useFooterAccent(palette?.accent);

  /*
   * The banner runs to the top edge under the header, so the header goes white
   * for as long as the banner is still behind it.
   */
  useHeroChrome(heroDepth);

  return (
    <main className={styles.page} style={paletteVars(palette)}>
      {/*
        The way back, over the banner's top-left.
        
        It earns its place because of the transition, not in spite of it. The
        shutter only runs on an in-page navigation — the browser's own back
        button and swipe gesture carry no transition type and cut straight to
        the index — so without a link here the reader's obvious way back is also
        the one way that never shows the animation.
        
        Outside the banner element, so the banner's own `overflow: hidden` does
        not clip it and it does not travel with the panel as that rolls up.
      */}
      <BackLink href={backHref} label={backLabel} />

      {banner}

      <ReaderProvider sectionIds={sectionIds(contents)}>
        {/*
          Contents for a narrow window, where both margins have collapsed.
          Outside `.body` because it is sticky and `.body` is a grid — a sticky
          element inside a grid track is clamped to that track. Inside the
          provider because it names the beat you are currently in.
        */}
        <ContentsBar rows={contents} />

        <div className={styles.body}>
          <div className={styles.margin}>
            <Contents rows={contents} hidden={!railsVisible} />
          </div>

          <Column>{children}</Column>

          <div className={`${styles.margin} ${styles.marginRight}`}>
            {marginNote ? (
              <p className={styles.pixelNote}>{marginNote}</p>
            ) : null}
          </div>
        </div>
      </ReaderProvider>
    </main>
  );
}
