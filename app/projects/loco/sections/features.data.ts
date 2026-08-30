import type { Slide } from "@/components/case-study";

/**
 * The unit's ten features, as a walk.
 *
 * The frame's carousel is still filled with Traces' onboarding copy — a
 * leftover from duplicating that frame — so the content here comes from the
 * portfolio's "List of Requirements" (p. 11) instead, which is the only place
 * the delivered feature set is written down.
 *
 * Each body says which constraint or interview finding the feature answers,
 * because that is the argument the beat is making: nothing on this list is
 * there because it was available. Nothing has been photographed yet, so every
 * slide's image is `null` and the carousel outlines the shot rather than
 * dropping the step — the walk has ten stops in the product and pretending it
 * has fewer would be the wrong shape.
 */
export const FEATURE_SLIDES: Slide[] = [
  {
    kicker: "Feature 01",
    title: "Odour Prevention",
    body: "A waterless unit has no flush to carry anything away, and 90 days to go between services. Odour is the first thing that makes a lavatory unusable, so it is designed against rather than masked.",
    image: null,
  },
  {
    kicker: "Feature 02",
    title: "Retrofittable",
    body: "1050 × 600mm, into an envelope that already exists, and cross-compatible between the WAG-9 cargo locomotive and the WAP-7 passenger locomotive so one unit serves both fleets.",
    image: null,
  },
  {
    kicker: "Feature 03",
    title: "UV Sanitation",
    body: "With no water on board, cleaning has to happen by some other means. UV does the work the flush cannot, between the pilots' own upkeep and the 90-day service.",
    image: null,
  },
  {
    kicker: "Feature 04",
    title: "Vibration Resistance",
    body: "The unit is used on a moving locomotive, and the pilots' first stated preference is not to go while moving. Everything mounted inside has to hold still enough to make that a choice rather than a rule.",
    image: null,
  },
  {
    kicker: "Feature 05",
    title: "Timer-Set Perfume Dispenser",
    body: "Upkeep across the service interval is the pilots' own job. A dispenser on a timer is one piece of that upkeep the unit does for itself.",
    image: null,
  },
  {
    kicker: "Feature 06",
    title: "Sensor-Based Sanitiser",
    body: "The pilots prefer Indian-style pans for having fewer touchpoints, and the current unit's sanitiser is mounted where they cannot reach it. A sensor removes the touchpoint and the reach in one move.",
    image: null,
  },
  {
    kicker: "Feature 07",
    title: "Handrail",
    body: "Asked for directly in the interviews. On a vehicle in motion it is what makes squatting or hovering — which is what they actually do — possible.",
    image: null,
  },
  {
    kicker: "Feature 08",
    title: "LED Light",
    body: "The existing light is placed where a user standing in the unit cannot reach it. This one is positioned for the person inside rather than the person servicing it.",
    image: null,
  },
  {
    kicker: "Feature 09",
    title: "Exhaust Fan",
    body: "Waste exhausts directly out; nothing is held on board. The fan is the mechanism that constraint turns into.",
    image: null,
  },
  {
    kicker: "Feature 10",
    title: "Speed-Controlled Door Lock",
    body: "The pilots complain of broken doors and the privacy that goes with them. Tying the lock to the locomotive's speed makes privacy a property of the vehicle rather than of the hardware holding up.",
    image: null,
  },
];
