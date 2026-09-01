import styles from "./MusicWidget.module.css";

/**
 * The music widget, pinned to the desktop's top-right corner.
 *
 * A sleeve with a record half-pulled out of it. Hovering pulls the record
 * further, the way you would actually slide one out to look at it — that is
 * the whole interaction, and it is deliberately the only thing here that
 * responds to a pointer, since the rest of this corner is static furniture.
 *
 * **Both the sleeve art and the record are drawn in CSS**, not loaded. That is
 * a placeholder in the same spirit as `PixelSprite`: it puts the widget in the
 * page's final shape now, and swapping in a real cover later is one
 * `background-image` on `.sleeve` with nothing else moving. Nothing here
 * claims to be a real record — no title, no artist — because inventing one
 * would be exactly the placeholder-that-ships problem `docs/ABOUT_PAGE.md` §5
 * warns about for the travel and games data.
 *
 * `aria-hidden` on the whole thing, and there is no text alternative on
 * purpose: right now it says nothing a screen reader could usefully hear. When
 * it carries a real record, it needs a real label — a caption naming the album
 * — and this attribute has to come off at the same time.
 */
export default function MusicWidget() {
  return (
    <div className={styles.widget} aria-hidden="true">
      {/*
        The record sits *behind* the sleeve in the stacking order but *before*
        it in the DOM, so the sleeve's own paint covers the half of the disc
        that should look tucked inside. Reversing either one puts the whole
        record on top and the illusion goes.
      */}
      <div className={styles.record}>
        <div className={styles.label} />
      </div>

      <div className={styles.sleeve}>
        <div className={styles.sleeveArt} />
      </div>
    </div>
  );
}
