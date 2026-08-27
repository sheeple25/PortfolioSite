"use client";

import { ReaderProvider, useReader } from "@/components/writing/ReaderContext";
import Contents, { sectionIds, type ContentsRow } from "./Contents";
import {
  useHeroChrome,
  useImmersiveChrome,
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
  children: (at: Anchor) => React.ReactNode;
};

export default function CaseShell({
  banner,
  contents,
  palette,
  marginNote,
  heroDepth = 480,
  children,
}: CaseShellProps) {
  /*
   * Scrolling down clears the site header, footer and both margins for a full
   * window; scrolling back up, or reaching either end, returns them.
   */
  const { chromeVisible, railsVisible } = useImmersiveChrome();
  useSiteChromeSync(chromeVisible, railsVisible);

  /*
   * The banner runs to the top edge under the header, so the header goes white
   * for as long as the banner is still behind it.
   */
  useHeroChrome(heroDepth);

  return (
    <main className={styles.page} style={paletteVars(palette)}>
      {banner}

      <ReaderProvider sectionIds={sectionIds(contents)}>
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
