import TracesBoard from "@/components/traces/TracesBoard";

/**
 * The board on its own — full window, no chrome, no contents rail.
 *
 * Kept alongside `/traces-entry` (the same board inside the archive reading
 * frame) so the two can be compared directly. This one is the control.
 */
export default function TracesBoardPage() {
  return <TracesBoard />;
}
