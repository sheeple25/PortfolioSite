/**
 * PixelBot's server-only surface.
 *
 * The second of the module's two doors, and the split is technical rather than
 * architectural: these components read the filesystem, and anything reachable
 * from `index.ts` gets pulled into the browser bundle by whichever client
 * component imports it. Exporting `ProcessNote` from there dragged `node:fs`
 * into a client chunk and failed the build outright.
 *
 * Import from here only in server components. Everything else: `@/components/pixel`.
 */

export { default as ProcessNote } from "./screen/ProcessNote";
export {
  getDecisionLog,
  getDecisionLogs,
  countPlaceholderLogs,
  type DecisionLog,
} from "@/lib/pixel/decisions";
