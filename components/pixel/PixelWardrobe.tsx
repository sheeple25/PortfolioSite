"use client";

import { useEffect, useId, useRef, useState } from "react";
import Pixel from "./Pixel";
import { ACCESSORIES, ACCESSORY_KEYS, type Accessory } from "./sprites";
import styles from "./PixelWardrobe.module.css";

/*
 * The footer wardrobe: hover Pixel once you have reached the footer and he
 * offers to be dressed up.
 *
 * This is deliberately NOT a second Pixel rendered inside `<footer>`. The
 * sitewide companion is already fixed to the bottom-right corner and
 * `--corner-lift` rests him on the footer's bottom row as you arrive, so by the
 * time the wardrobe is reachable he is sitting in the footer already. Mounting
 * a duplicate there would mean two mascots on screen for a frame, a second copy
 * of the gaze/blink/idle machinery, and the reason-tagged `setHidden` work that
 * `docs/PIXELBOT_BUILD.md` §12 flags as a prerequisite for hiding the
 * companion. Attaching to the real one needs none of that.
 *
 * The chosen costume lives in `PixelContext` and therefore applies to every
 * Pixel on the site for the rest of the session, not just this one — which is
 * the point. You dress him in the footer and he stays dressed as you browse.
 */

const CUSTOMISE_LABEL = "Customise";

export type PixelWardrobeProps = {
  /** Pointer is over Pixel or the wardrobe itself. */
  revealed: boolean;
  accessory: Accessory | null;
  onSelect: (accessory: Accessory | null) => void;
};

export default function PixelWardrobe({
  revealed,
  accessory,
  onSelect,
}: PixelWardrobeProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    // Pointerdown rather than click: closing on the press matches every other
    // dismissible surface on the site, and a click listener here would also
    // swallow the release of the press that opened it.
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && !rootRef.current?.contains(target)) {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  const shown = revealed || open;

  return (
    <div
      ref={rootRef}
      className={[styles.root, shown ? styles.shown : ""].filter(Boolean).join(" ")}
    >
      {open && (
        <div className={styles.panel} id={panelId}>
          <p className={styles.title}>Dress him up</p>

          <div className={styles.options}>
            {ACCESSORY_KEYS.map((key) => {
              const worn = accessory === key;
              return (
                <button
                  key={key}
                  type="button"
                  className={[styles.option, worn ? styles.worn : ""]
                    .filter(Boolean)
                    .join(" ")}
                  aria-pressed={worn}
                  // Clicking what he already has on takes it off, so every
                  // option is its own undo and the "Take it off" row below is
                  // a convenience rather than the only way back.
                  onClick={() => onSelect(worn ? null : key)}
                >
                  <span className={styles.preview} aria-hidden="true">
                    <Pixel size={34} accessory={key} decorative />
                  </span>
                  <span className={styles.optionLabel}>
                    {ACCESSORIES[key].label}
                  </span>
                </button>
              );
            })}
          </div>

          {accessory && (
            <button
              type="button"
              className={styles.clear}
              onClick={() => onSelect(null)}
            >
              Take it off
            </button>
          )}
        </div>
      )}

      <button
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((current) => !current)}
      >
        {CUSTOMISE_LABEL}
      </button>
    </div>
  );
}
