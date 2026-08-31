import styles from "./LogoMarquee.module.css";

/*
 * The places, running as a loop under the About masthead.
 *
 * The track holds the list twice and translates by exactly -50%, which is what
 * makes the loop seamless: at the end of the animation the second copy sits
 * precisely where the first one started, so the jump back to 0% is invisible.
 * Any other duplication count or distance shows a seam.
 *
 * The duplicate is `aria-hidden`, so a screen reader hears the seven names
 * once rather than fourteen times. The visible list keeps its `alt` text.
 */

const LOGOS = [
  { src: "/logos/Kobble.svg", alt: "Kobble" },
  { src: "/logos/IFTC.svg", alt: "In For The Cause" },
  { src: "/logos/PwC.svg", alt: "PwC India" },
  { src: "/logos/Verizon.svg", alt: "Verizon" },
  { src: "/logos/Desmania.svg", alt: "Desmania Design" },
  { src: "/logos/IndianRailways.svg", alt: "Indian Railways" },
  { src: "/logos/FutureFactory.svg", alt: "Future Factory" },
];

function Row({ hidden }: { hidden?: boolean }) {
  return (
    <ul className={styles.row} aria-hidden={hidden || undefined}>
      {LOGOS.map((logo) => (
        <li key={logo.src} className={styles.item}>
          {/* eslint-disable-next-line @next/next/no-img-element -- static local SVG; the optimiser has nothing to do here and would only add a request */}
          <img
            className={styles.logo}
            src={logo.src}
            alt={hidden ? "" : logo.alt}
          />
        </li>
      ))}
    </ul>
  );
}

export default function LogoMarquee() {
  return (
    <div className={styles.viewport}>
      <div className={styles.track}>
        <Row />
        <Row hidden />
      </div>
    </div>
  );
}
