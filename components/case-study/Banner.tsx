"use client";

import { useState } from "react";
import { motion } from "motion/react";
import Image from "next/image";
import { useShutter } from "@/components/chrome/Shutter";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { scallopedCirclePath } from "@/lib/scallopedCirclePath";
import styles from "./case.module.css";

/**
 * The banner that opens a case study: a full-bleed texture, a gradient floor
 * that darkens the lower band enough for white type to sit on it, and the title
 * plate carrying the spec row and the institution stickers.
 *
 * The banner runs to the top edge of the window, under the site header — see
 * `.banner` and `.page` in `case.module.css` for how, and `useHeroChrome` for
 * the header retint that goes with it.
 *
 * The texture is a slot rather than a prop with a fixed shape: Traces fills it
 * with a scrolling wall of text, Loco Lavatory and Unflattening with a
 * photograph. `BannerImage` covers the common case.
 */

export type MetaField = { value: string; label: string };

export type Institution = {
  name: string;
  /** Small line above the name — what the place is to this project. */
  role: string;
  href: string;
  /** Degrees of tilt. Nothing is applied perfectly straight. */
  tilt: number;
};

/**
 * Logo convention, shared by every place a company/institution mark can show
 * up (project stickers here, and eventually the work-index logo strip): drop
 * a file named after the entity with whitespace stripped — `"CEPT
 * University"` -> `public/logos/CEPTUniversity.svg` — and it picks up
 * automatically, no per-entry wiring. SVG is tried first, PNG second (some
 * marks only come as a raster), and if neither exists the sticker just shows
 * type, exactly as it did before any mark existed.
 */
const LOGO_EXTENSIONS = ["svg", "png"] as const;

function logoSrc(name: string, extIndex: number) {
  return `/logos/${name.replace(/\s+/g, "")}.${LOGO_EXTENSIONS[extIndex]}`;
}

/**
 * The sticker's own wavy rim — the same shape `StickerVote`'s rating badges
 * use (`scallopedCirclePath`), so the site's two badge surfaces read as one
 * visual language rather than two independent wavy-circle implementations.
 *
 * `scallopedCirclePath(radius, ...)` draws a shape whose true centre is
 * `(radius, radius)` and whose bounding box is exactly `2 * radius` square —
 * so the viewBox has to be that same `2 * radius`, not an independently
 * chosen number, or the rim ends up off-centre inside it (padded on the
 * bottom-right only). The logo `<img>` centres itself on the full container,
 * so a mismatched viewBox here is exactly what made the mark look off-centre
 * against the badge's own rim.
 */
const STICKER_RADIUS = 46;
const STICKER_VIEWBOX = STICKER_RADIUS * 2;
const STICKER_PATH = scallopedCirclePath(STICKER_RADIUS, 15, 4.5);

/**
 * One institution mark: a circular, scallop-edged badge holding only the
 * logo — no name, no role. `role`/`name` still carry the accessible label,
 * they just no longer render as visible type.
 *
 * A single component rather than the shape and the `<img>` as siblings,
 * because the logo can fail to load (no file yet under `public/logos/`) and
 * a wavy circle with nothing inside it reads as broken, not as a badge — so
 * the whole sticker, shape included, drops out rather than showing an empty
 * rim.
 */
function Sticker({ inst }: { inst: Institution }) {
  const [extIndex, setExtIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    <a
      className={styles.sticker}
      style={{ "--tilt": `${inst.tilt}deg` } as React.CSSProperties}
      href={inst.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${inst.name} — ${inst.role} (opens in a new tab)`}
    >
      <svg
        viewBox={`0 0 ${STICKER_VIEWBOX} ${STICKER_VIEWBOX}`}
        className={styles.stickerShape}
        aria-hidden="true"
      >
        <path d={STICKER_PATH} className={styles.stickerFace} />
      </svg>
      {/* eslint-disable-next-line @next/next/no-img-element -- extension fallback chain needs a plain <img onError> */}
      <img
        src={logoSrc(inst.name, extIndex)}
        alt=""
        aria-hidden="true"
        className={styles.stickerLogo}
        onError={() => {
          if (extIndex < LOGO_EXTENSIONS.length - 1) {
            setExtIndex((i) => i + 1);
          } else {
            setFailed(true);
          }
        }}
      />
    </a>
  );
}

/**
 * The institution marks, applied to the top-right of the block the title and
 * spec row make — not to the banner's own corner.
 *
 * That corner belongs to the site header's controls, and anything placed there
 * also drifts further from the title the wider the window gets. Anchored to the
 * title block instead, they hold their relationship to it at every width.
 */
export function Stickers({ institutions }: { institutions: Institution[] }) {
  if (institutions.length === 0) return null;

  return (
    <div className={styles.stickers}>
      {institutions.map((inst) => (
        <Sticker key={inst.name} inst={inst} />
      ))}
    </div>
  );
}

/**
 * The common banner texture: one photograph, bled across the full width and
 * pulled up so its middle band sits behind the title.
 */
export function BannerImage({
  src,
  alt = "",
  priority = true,
}: {
  src: string;
  alt?: string;
  priority?: boolean;
}) {
  return (
    <div className={styles.bannerImage}>
      <Image src={src} alt={alt} fill priority={priority} sizes="100vw" />
    </div>
  );
}

/**
 * A looping video banner texture — Kobble's gradient loop, so far the only
 * project whose brand texture actually moves rather than being a still or a
 * text wall. Same fill/crop as `BannerImage` (`.bannerImage`'s shared rules
 * in `case.module.css`); the only difference is the element underneath.
 *
 * Autoplay convention matches the index tile's own video cover
 * (`components/index/TileGrid.tsx`): muted, looped, `playsInline`, and off
 * entirely under `prefers-reduced-motion` — falling back to `poster` as a
 * still frame rather than a blank box.
 */
export function BannerVideo({
  src,
  poster,
  alt = "",
}: {
  src: string;
  /** A still frame shown before playback starts, and in place of it under reduced motion. */
  poster?: string;
  alt?: string;
}) {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div className={styles.bannerImage}>
      <video
        src={src}
        poster={poster}
        autoPlay={!reducedMotion}
        loop={!reducedMotion}
        muted
        playsInline
        aria-label={alt}
      />
    </div>
  );
}

export default function Banner({
  title,
  meta,
  institutions = [],
  children,
}: {
  title: string;
  meta: readonly MetaField[];
  institutions?: Institution[];
  /** The texture layer — an image, a text wall, whatever the project needs. */
  children?: React.ReactNode;
}) {
  const shutter = useShutter();

  return (
    /*
     * The far end of the shutter, and symmetric with the index header: arriving
     * from an index this opens downward once that header has closed, and
     * leaving for one it closes upward so the index header can open in its
     * place. One pair of animations serves both directions, because they are
     * described in absolute terms — close up, open down — not as forward and
     * back.
     */
    <motion.header
      className={styles.banner}
      ref={shutter?.panelRef}
      {...shutter?.panelProps}
    >
      {children}

      <div className={styles.bannerFloor} />

      <div className={styles.bannerPlate}>
        <div
          className={`${styles.bannerInner} ${
            institutions.length > 0 ? styles.bannerInnerStuck : ""
          }`}
        >
          {/*
           * Inside the title block rather than in the banner's own corner, so
           * the stickers land on the top-right of the box the title and spec
           * row make — genuinely empty space, since the title fills only the
           * left of that block.
           */}
          <Stickers institutions={institutions} />
          <h1 className={styles.bannerTitle}>{title}</h1>
          <dl className={styles.bannerMeta}>
            {meta.map((m) => (
              <div key={m.label} className={styles.bannerMetaRow}>
                <dd className={styles.bannerMetaValue}>{m.value}</dd>
                <dt className={styles.bannerMetaLabel}>{m.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </motion.header>
  );
}
