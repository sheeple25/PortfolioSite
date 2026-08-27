import Image from "next/image";
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
  /** Path under `public/` once a mark exists. Renders as type until then. */
  logo?: string;
  /** Degrees of tilt. Nothing is applied perfectly straight. */
  tilt: number;
};

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
        <a
          key={inst.name}
          className={styles.sticker}
          style={{ "--tilt": `${inst.tilt}deg` } as React.CSSProperties}
          href={inst.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${inst.name} — ${inst.role} (opens in a new tab)`}
        >
          {inst.logo ? (
            // eslint-disable-next-line @next/next/no-img-element -- local SVG mark
            <img
              src={inst.logo}
              alt=""
              aria-hidden="true"
              className={styles.stickerLogo}
            />
          ) : null}
          <span className={styles.stickerRole}>{inst.role}</span>
          <span className={styles.stickerName}>{inst.name}</span>
        </a>
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
  return (
    <header className={styles.banner}>
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
    </header>
  );
}
