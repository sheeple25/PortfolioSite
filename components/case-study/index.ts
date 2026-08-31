/**
 * The case study chassis.
 *
 * Traces, Loco Lavatory and Unflattening are the same page with different
 * content — their Figma frames carry an identical structure, and the only real
 * differences are the accent colour, the banner's texture, and which of these
 * pieces each beat uses.
 *
 * The rule that keeps that true: **nothing in this directory knows about a
 * specific project.** Everything takes its content as props. A project supplies
 * data, a palette, and its own bespoke figures where it genuinely has them.
 *
 * `case.module.css` is the single source of truth for type, spacing and layout
 * across all of them. A change to the type scale here lands on every project at
 * once, which is the whole point of the extraction — so add to it rather than
 * forking a project-local stylesheet.
 */

export { default as CaseShell } from "./CaseShell";
export type { CaseShellProps, Palette, Anchor } from "./CaseShell";

export { default as Banner, BannerImage, BannerVideo, Stickers } from "./Banner";
export type { MetaField, Institution } from "./Banner";

export { default as Contents, sectionIds } from "./Contents";
export type { ContentsRow } from "./Contents";

export { default as Carousel } from "./Carousel";
export type { Slide } from "./Carousel";

export { default as MoreProjects } from "./MoreProjects";
export type { Neighbour } from "./MoreProjects";

export {
  ActionRow,
  Beat,
  CardRow,
  CASE_ASSETS,
  Chain,
  Disclosure,
  Slot,
  Stat,
  StatRow,
  StepList,
  useFocusRow,
} from "./primitives";
export type {
  Card,
  ChainStep,
  DisclosureProps,
  StatProps,
  Step,
} from "./primitives";

export {
  useHeroChrome,
  useImmersiveChrome,
  useSiteChromeSync,
} from "./useImmersiveChrome";
export type { ImmersiveChrome } from "./useImmersiveChrome";
