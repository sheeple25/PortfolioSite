"use client";

/**
 * Dev-only proof-of-life for each animation library in the stack: one
 * minimal effect apiece, just enough to confirm the wiring works. Safe to
 * delete once real components replace these.
 *
 * Every row names the library AND says what the effect is meant to be doing,
 * so a blank stage reads as "this is broken" rather than "maybe that's the
 * effect".
 */

import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import gsap from "gsap";
import Matter from "matter-js";
import Aurora from "@/components/Aurora";
import { LineChart, Line } from "@/components/charts/line-chart";
import Grid from "@/components/charts/grid";
import XAxis from "@/components/charts/x-axis";
import lab from "../lab.module.css";
import styles from "./page.module.css";

const CHART_DATA = [
  { date: "2026-01-01", value: 12 },
  { date: "2026-01-08", value: 18 },
  { date: "2026-01-15", value: 15 },
  { date: "2026-01-22", value: 24 },
  { date: "2026-01-29", value: 21 },
  { date: "2026-02-05", value: 30 },
  { date: "2026-02-12", value: 27 },
  { date: "2026-02-19", value: 34 },
];

/**
 * `@types/matter-js` omits the DOM handlers Matter stores on the mouse object.
 * They are the exact function references it passed to `addEventListener`, so
 * unbinding them means reaching past the published type.
 */
type MouseWithHandlers = Matter.Mouse & {
  mousewheel: (event: Event) => void;
  mousemove: (event: Event) => void;
};

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function GsapDemo() {
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(boxRef.current, {
        x: 180,
        rotate: 180,
        duration: 1.4,
        ease: "power2.inOut",
        yoyo: true,
        repeat: -1,
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <div className={styles.stage}>
      <div ref={boxRef} className={styles.gsapBox} />
    </div>
  );
}

/**
 * Physics sandbox.
 *
 * The previous version dropped three bodies into a box that had a floor but no
 * walls and no ceiling. They fell for about half a second, settled, went to
 * sleep, and the circle was free to roll out of the open side and fall forever
 * — so within seconds the stage was static or empty, which is indistinguishable
 * from "the library never loaded".
 *
 * This version closes the box, makes the bodies draggable so there is always
 * something to interact with, and rebuilds on resize (walls are placed in pixel
 * coordinates, so a width change would otherwise leave them stranded).
 */
function MatterDemo() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reduced = prefersReducedMotion();
    /** Set by build(), called by the observer and on unmount. */
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
      // Sleeping bodies stop responding to the mouse, which makes the stage
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

      // Walls sit fully outside the viewport so their fill never shows. Without
      // the left/right pair, bodies roll out of the stage and never come back.
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

      const palette = ["#ffa554", "#1e1e1e", "#8a8578", "#c9c3b4"];
      const bodies = Array.from({ length: 12 }, (_, i) => {
        const x = 40 + ((i * 97) % Math.max(1, width - 80));
        const y = 12 + ((i * 37) % 90);
        const common = {
          restitution: 0.6,
          friction: 0.05,
          render: { fillStyle: palette[i % palette.length] },
        };
        return i % 3 === 0
          ? Matter.Bodies.circle(x, y, 12 + (i % 3) * 4, common)
          : Matter.Bodies.rectangle(x, y, 26, 26, {
              ...common,
              chamfer: { radius: 4 },
            });
      });

      Matter.Composite.add(engine.world, [...walls, ...bodies]);

      // Drag-to-throw. This is what makes the row obviously alive rather than a
      // picture of some shapes.
      const mouse = Matter.Mouse.create(render.canvas);
      const mouseConstraint = Matter.MouseConstraint.create(engine, {
        mouse,
        constraint: { stiffness: 0.2, render: { visible: false } },
      });
      Matter.Composite.add(engine.world, mouseConstraint);
      render.mouse = mouse;

      // Matter binds `wheel` and `touchmove` with preventDefault, which traps
      // the page scroll whenever the pointer is over the canvas. This demo does
      // not zoom or pan, so drop them and let the page scroll normally.
      const handlers = mouse as MouseWithHandlers;
      mouse.element.removeEventListener("wheel", handlers.mousewheel);
      mouse.element.removeEventListener("touchmove", handlers.mousemove);

      let runner: Matter.Runner | null = null;
      if (reduced) {
        // Settle the scene off-screen, paint it once, and never start a render
        // loop — a rAF loop redrawing a frozen scene is still a running
        // animation, just an invisible one.
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
  }, []);

  return <div ref={containerRef} className={styles.stage} />;
}

type RowProps = {
  library: string;
  caption: string;
  children: React.ReactNode;
};

function Row({ library, caption, children }: RowProps) {
  return (
    <div className={styles.row}>
      <div className={styles.meta}>
        <span className={styles.label}>{library}</span>
        <span className={styles.caption}>{caption}</span>
      </div>
      {children}
    </div>
  );
}

export default function EffectsLab() {
  return (
    <main className={lab.page}>
      <header className={lab.header}>
        <h1>Effects</h1>
        <p className={lab.subheading}>
          One proof-of-life effect per animation library &middot; not wired into any real page
        </p>
      </header>

      <section className={lab.section}>
        <div className={styles.list}>
          <Row
            library="Motion"
            caption="Hover and press transforms on a single element"
          >
            <div className={styles.stage}>
              <motion.div
                className={styles.motionBox}
                whileHover={{ scale: 1.08, rotate: 3 }}
                whileTap={{ scale: 0.94 }}
              >
                hover me
              </motion.div>
            </div>
          </Row>

          <Row
            library="GSAP"
            caption="Looping tween — slides and rotates, yoyos back"
          >
            <GsapDemo />
          </Row>

          <Row
            library="Matter.js"
            caption="2D rigid-body physics in a closed box — drag a shape and throw it"
          >
            <MatterDemo />
          </Row>

          <Row
            library="Bklit UI"
            caption="Line chart — animated draw-on, with grid and time axis"
          >
            <div className={styles.chartStage}>
              <LineChart data={CHART_DATA} xDataKey="date">
                <Grid />
                <XAxis />
                <Line dataKey="value" />
              </LineChart>
            </div>
          </Row>

          <Row
            library="React Bits"
            caption="Aurora — a WebGL shader ribbon of drifting light along the lower edge"
          >
            <div className={styles.auroraStage}>
              <Aurora
                colorStops={["#ffa554", "#ffd7a8", "#8a8578"]}
                amplitude={1.1}
                blend={0.45}
              />
            </div>
          </Row>
        </div>
      </section>
    </main>
  );
}
