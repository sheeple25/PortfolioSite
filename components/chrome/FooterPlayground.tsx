"use client";

import { useEffect, useRef } from "react";
import Matter from "matter-js";
import { usePrefersReducedMotion } from "@/lib/hooks";
import styles from "./FooterPlayground.module.css";

/*
 * The footer's one bit of play: a shallow pit of little triangles — the same
 * downward-pointing shape as the wordmark in `Logo.tsx` — that drop in, pile
 * up, and can be dragged and flicked around. Nothing here is informational;
 * it's a fidget toy in the corner of the "separate space", not a control.
 *
 * Built on `matter-js`: a closed box (walls just outside the visible area so
 * nothing rolls out of frame), sleeping disabled so the scene never looks
 * dead, and a mouse constraint for drag-to-throw. The pattern was first proven
 * in the `/effects-lab` sandbox, since removed — this is now the only
 * matter-js scene in the project. Reduced
 * motion settles the bodies once and paints a single static frame instead of
 * running the simulation — same trade-off the lab page makes, since a toy
 * that only half-responds to a drag would be worse than one that doesn't
 * move at all.
 */

/** @types/matter-js omits the DOM handlers Matter stores on the mouse object. */
type MouseWithHandlers = Matter.Mouse & {
  mousewheel: (event: Event) => void;
  mousemove: (event: Event) => void;
};

/** Downward-pointing, like the three triangles in the wordmark. */
const TRIANGLE_ANGLE = Math.PI;

const TRIANGLES = [
  { radius: 15, fill: "#0047ff" },
  { radius: 19, fill: "#0047ff" },
  { radius: 13, fill: "#f7f7f7" },
  { radius: 21, fill: "#0047ff" },
  { radius: 16, fill: "#f7f7f7" },
  { radius: 14, fill: "#8a8578" },
  { radius: 18, fill: "#0047ff" },
  { radius: 12, fill: "#f7f7f7" },
  { radius: 20, fill: "#8a8578" },
] as const;

export default function FooterPlayground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let teardown: (() => void) | null = null;
    let builtWidth = 0;

    function build() {
      if (!container) return;

      const width = container.clientWidth;
      const height = container.clientHeight;
      // Laid out at zero — the observer below calls back once it has a size.
      if (width === 0 || height === 0) return;
      builtWidth = width;

      const engine = Matter.Engine.create();
      // Sleeping bodies stop responding to the mouse, which makes the pit
      // feel dead after a few idle seconds.
      engine.enableSleeping = false;

      const render = Matter.Render.create({
        element: container,
        engine,
        options: {
          width,
          height,
          wireframes: false,
          background: "transparent",
          pixelRatio: window.devicePixelRatio || 1,
        },
      });

      // Walls sit fully outside the visible box so their fill never shows.
      const WALL = 60;
      const wallStyle = { isStatic: true, render: { visible: false } };
      const walls = [
        Matter.Bodies.rectangle(
          width / 2,
          height + WALL / 2,
          width + WALL * 2,
          WALL,
          wallStyle
        ),
        Matter.Bodies.rectangle(width / 2, -WALL / 2, width + WALL * 2, WALL, wallStyle),
        Matter.Bodies.rectangle(-WALL / 2, height / 2, WALL, height + WALL * 2, wallStyle),
        Matter.Bodies.rectangle(
          width + WALL / 2,
          height / 2,
          WALL,
          height + WALL * 2,
          wallStyle
        ),
      ];

      const bodies = TRIANGLES.map(({ radius, fill }, i) => {
        const x = 24 + ((i * 71) % Math.max(1, width - 48));
        // Positive — inside the box, above the resting floor. Starting them
        // above y=0 looked like a nicer "drop in" on paper, but the ceiling
        // wall below (there to keep a thrown body from escaping upward) then
        // traps them above the visible canvas forever: nothing was ever
        // actually broken, they just piled up on top of a wall you can't see.
        const y = 20 + ((i * 53) % 140);
        return Matter.Bodies.polygon(x, y, 3, radius, {
          angle: TRIANGLE_ANGLE,
          restitution: 0.55,
          friction: 0.15,
          frictionAir: 0.012,
          chamfer: { radius: radius * 0.22 },
          render: { fillStyle: fill },
        });
      });

      Matter.Composite.add(engine.world, [...walls, ...bodies]);

      // Drag-to-throw — the entire point of the pit.
      const mouse = Matter.Mouse.create(render.canvas);
      const mouseConstraint = Matter.MouseConstraint.create(engine, {
        mouse,
        constraint: { stiffness: 0.2, render: { visible: false } },
      });
      Matter.Composite.add(engine.world, mouseConstraint);
      render.mouse = mouse;

      // Matter binds `wheel`/`touchmove` with preventDefault, which would
      // trap page scroll under the pit. This toy doesn't zoom or pan.
      const handlers = mouse as MouseWithHandlers;
      mouse.element.removeEventListener("wheel", handlers.mousewheel);
      mouse.element.removeEventListener("touchmove", handlers.mousemove);

      let runner: Matter.Runner | null = null;
      if (reducedMotion) {
        // Let the drop settle off-screen, paint one frame, and never start a
        // render loop — a rAF loop redrawing a frozen scene is still motion,
        // just invisible motion.
        for (let i = 0; i < 240; i += 1) Matter.Engine.update(engine, 1000 / 60);
        Matter.Render.world(render);
      } else {
        Matter.Render.run(render);
        runner = Matter.Runner.create();
        Matter.Runner.run(runner, engine);
      }

      teardown = () => {
        Matter.Render.stop(render);
        if (runner) Matter.Runner.stop(runner);
        Matter.Composite.clear(engine.world, false);
        Matter.Engine.clear(engine);
        render.canvas.remove();
        render.textures = {};
      };
    }

    build();

    // Rebuild only on a real width change — the observer also fires for the
    // sub-pixel jitter that rebuilding would itself cause.
    const observer = new ResizeObserver(() => {
      const next = container.clientWidth;
      if (next === 0 || Math.abs(next - builtWidth) < 2) return;
      teardown?.();
      teardown = null;
      build();
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      teardown?.();
    };
  }, [reducedMotion]);

  return (
    <div className={styles.pit}>
      <p className={styles.hint} aria-hidden="true">
        Toss the mark around
      </p>
      {/* Decorative fidget toy, not content — nothing here needs a screen reader. */}
      <div ref={containerRef} className={styles.stage} aria-hidden="true" />
    </div>
  );
}
