import type { Slide } from "@/components/case-study";

/** Traces' own assets — the figures that belong to this project alone. */
export const TRACES_ASSETS = "/traces-entry";

/**
 * The walk through the app's flows.
 *
 * The frame draws a single slide (Flow 1, Onboarding) with a caret either side,
 * which is a carousel shown at rest. Only that one screen has been captured, so
 * the later flows are named and left outlined — the walk has three steps in the
 * product and pretending it has one would be the wrong shape.
 */
export const INTERFACE_SLIDES: Slide[] = [
  {
    kicker: "Flow 1",
    title: "Onboarding",
    body: "You as a user either play a situation (game like hypothetical) or upload a Trace (any piece of media that represents you). Based on your personality (which is derived from situation answers), you are matched with synergetic people.",
    image: `${TRACES_ASSETS}/flow-onboarding.png`,
  },
  {
    kicker: "Flow 2",
    title: "Traces",
    body: "You gradually see the Traces of people you have been matched with, surfaced in AR as you move through the places you already go.",
    image: null,
  },
  {
    kicker: "Flow 3",
    title: "Meeting",
    body: "If you like someone’s Traces, you can request a date or a co-op activity — something to do together, rather than a conversation to start cold.",
    image: null,
  },
];
