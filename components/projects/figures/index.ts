import type { ComponentType } from "react";
import Fig031 from "./Fig031";
import Fig041 from "./Fig041";
import Fig141 from "./Fig141";
import Fig161 from "./Fig161";
import FigMethodology from "./FigMethodology";
import FigProjOverview from "./FigProjOverview";
import FigDoubleDoubleDiamond from "./FigDoubleDoubleDiamond";
import Fig351Book from "./Fig351Book";
import Fig431 from "./Fig431";
import Fig432 from "./Fig432";
import Fig532 from "./Fig532";
import FigTestOverview from "./FigTestOverview";
import ReadingListShelf from "./ReadingListShelf";

export type DiagramProps = { label?: string };

/**
 * Diagrams for the unflattening project, addressable from markdown as
 * `![alt](diagram:key "caption")`.
 */
export const DIAGRAMS: Record<string, ComponentType<DiagramProps>> = {
  "fig-0-3-1": Fig031,
  "fig-0-4-1": Fig041,
  "fig-1-4-1": Fig141,
  "fig-1-6-1": Fig161,
  "fig-methodology": FigMethodology,
  "fig-proj-overview": FigProjOverview,
  "fig-double-diamond": FigDoubleDoubleDiamond,
  "fig-3-5-1": Fig351Book,
  "fig-4-3-1": Fig431,
  "fig-4-3-2": Fig432,
  "fig-5-3-2": Fig532,
  "fig-test-overview": FigTestOverview,
  "reading-list": ReadingListShelf,
};
