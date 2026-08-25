import Image from "next/image";
import { DIAGRAMS as WRITING_DIAGRAMS } from "./figures";
import { DIAGRAMS as PROJECT_DIAGRAMS } from "@/components/projects/figures";
import styles from "./Figure.module.css";

const DIAGRAMS = { ...WRITING_DIAGRAMS, ...PROJECT_DIAGRAMS };

/**
 * A standalone image in markdown, rendered as a real `<figure>`.
 *
 * Three kinds of source are understood:
 *   `![alt](diagram:design-loop "caption")`   -> a component from the registry
 *   `![alt](/writing/plan.png?w=1600&h=900)`  -> an optimised `next/image`
 *   `[PLACEHOLDER fig-2-3-1.svg: caption]`    -> a slot reserved for an asset
 *
 * The dimensions in the query string are how a raster image tells `next/image`
 * its aspect ratio; markdown has nowhere else to put them, and without them the
 * page reflows once the file loads.
 */

const DIAGRAM_SOURCE = /^diagram:(.+)$/;
const PLACEHOLDER_SOURCE = /^placeholder:(.+)$/;

export type FigureProps = {
  src?: string;
  alt?: string;
  caption?: string;
  /** 1-based position in the document, for the `Fig. n` marker. */
  ord?: string | number;
};

function RasterImage({ src, alt }: { src: string; alt: string }) {
  const [path, query] = src.split("?");
  const params = new URLSearchParams(query ?? "");
  const width = Number(params.get("w"));
  const height = Number(params.get("h"));

  if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
    return (
      <Image
        className={styles.image}
        src={path}
        alt={alt}
        width={width}
        height={height}
        sizes="(max-width: 800px) 100vw, 720px"
      />
    );
  }

  // No dimensions given. `next/image` needs them before layout, and guessing an
  // aspect ratio is worse than opting out for this one image.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={styles.image}
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
    />
  );
}

/**
 * A figure whose artwork hasn't been drawn yet.
 *
 * The document is written around its diagrams from the start, so the slots are
 * claimed before the files exist. The frame names the asset it is waiting for,
 * which is what turns the finished page into its own to-do list — and swapping
 * one in is a single directive changed to a markdown image.
 */
function Placeholder({ file }: { file: string }) {
  return (
    <div className={styles.placeholder}>
      <span className={styles.placeholderMark} aria-hidden="true">
        &#9633;
      </span>
      <span className={styles.placeholderFile}>{file}</span>
      <span className={styles.placeholderNote}>awaiting asset</span>
    </div>
  );
}

export default function Figure({ src = "", alt = "", caption, ord }: FigureProps) {
  const diagram = DIAGRAM_SOURCE.exec(src);
  const placeholder = PLACEHOLDER_SOURCE.exec(src);

  let content;
  if (placeholder) {
    content = <Placeholder file={placeholder[1]} />;
  } else if (diagram) {
    const Diagram = DIAGRAMS[diagram[1]];
    content = Diagram ? (
      <Diagram label={alt} />
    ) : (
      <p className={styles.missing}>
        No diagram registered for &ldquo;{diagram[1]}&rdquo;
      </p>
    );
  } else {
    content = <RasterImage src={src} alt={alt} />;
  }

  return (
    <figure className={styles.figure}>
      <div className={styles.frame}>{content}</div>
      {(caption || ord) && (
        <figcaption className={styles.caption}>
          {ord && <span className={styles.marker}>Fig {ord}</span>}
          {caption && <span className={styles.captionText}>{caption}</span>}
        </figcaption>
      )}
    </figure>
  );
}
