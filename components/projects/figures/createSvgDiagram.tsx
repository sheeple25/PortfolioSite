import { SvgDiagram } from "./SvgDiagram";
import type { DiagramProps } from "./index";

/*
 * Kept out of `SvgDiagram.tsx` on purpose: that file is `"use client"` for the
 * replay button's state, and every `Fig*.tsx` calls this factory directly at
 * module load — a plain function call, not a JSX render. Calling into a
 * client module that way is a build error; only rendering a client component
 * is allowed across that boundary. This file stays a server module and
 * renders `SvgDiagram` as JSX instead of calling it.
 */
export function createSvgDiagram(src: string, alt: string) {
  return function Diagram({ label }: DiagramProps) {
    return <SvgDiagram src={src} alt={alt} label={label} />;
  };
}
