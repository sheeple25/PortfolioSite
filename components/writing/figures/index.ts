import type { ComponentType } from "react";
import DesignLoopDiagram from "./DesignLoopDiagram";
import DoubleDiamondDiagram from "./DoubleDiamondDiagram";

export type DiagramProps = { label?: string };

/**
 * Diagrams addressable from markdown as `![alt](diagram:key "caption")`.
 *
 * Registering a new one is two lines here plus the component — the markdown
 * stays plain markdown and needs no MDX, no import, and no React in the prose.
 */
export const DIAGRAMS: Record<string, ComponentType<DiagramProps>> = {
  "design-loop": DesignLoopDiagram,
  "double-diamond": DoubleDiamondDiagram,
};
