import LocoEntry from "./LocoEntry";

/**
 * The Loco Lavatory case study rebuilt from the Figma frame `LocoLav_Attempt`
 * (node 232:11647) — the same chassis Traces uses, with Loco's content.
 *
 * A `.dev.tsx` route: `pageExtensions` in `next.config.ts` only admits that
 * extension in development, so the lab never reaches a production build.
 */
export default function LocoEntryPage() {
  return <LocoEntry />;
}
