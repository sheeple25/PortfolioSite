"use client";

/**
 * Dev-only proof-of-life for each animation library in the stack: one
 * minimal effect apiece, just enough to confirm the wiring works. Safe to
 * delete once real components replace these.
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

function MatterDemo() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const engine = Matter.Engine.create();
    const render = Matter.Render.create({
      element: container,
      engine,
      options: { width, height, wireframes: false, background: "transparent" },
    });

    const ground = Matter.Bodies.rectangle(width / 2, height + 10, width, 20, {
      isStatic: true,
    });
    const shapes = [
      Matter.Bodies.rectangle(width * 0.3, 20, 40, 40, {
        render: { fillStyle: "#ffa554" },
      }),
      Matter.Bodies.circle(width * 0.5, 80, 24, {
        render: { fillStyle: "#1e1e1e" },
      }),
      Matter.Bodies.rectangle(width * 0.7, 40, 36, 36, {
        render: { fillStyle: "#8a8578" },
      }),
    ];

    Matter.Composite.add(engine.world, [ground, ...shapes]);

    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);
    Matter.Render.run(render);

    return () => {
      Matter.Render.stop(render);
      Matter.Runner.stop(runner);
      Matter.Composite.clear(engine.world, false);
      Matter.Engine.clear(engine);
      render.canvas.remove();
    };
  }, []);

  return <div ref={containerRef} className={styles.stage} />;
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
          <div className={styles.row}>
            <span className={styles.label}>Motion</span>
            <div className={styles.stage}>
              <motion.div
                className={styles.motionBox}
                whileHover={{ scale: 1.08, rotate: 3 }}
                whileTap={{ scale: 0.94 }}
              >
                hover me
              </motion.div>
            </div>
          </div>

          <div className={styles.row}>
            <span className={styles.label}>GSAP</span>
            <GsapDemo />
          </div>

          <div className={styles.row}>
            <span className={styles.label}>Matter.js</span>
            <MatterDemo />
          </div>

          <div className={styles.row}>
            <span className={styles.label}>Bklit UI</span>
            <div className={styles.chartStage}>
              <LineChart data={CHART_DATA} xDataKey="date">
                <Grid />
                <XAxis />
                <Line dataKey="value" />
              </LineChart>
            </div>
          </div>

          <div className={styles.row}>
            <span className={styles.label}>React Bits</span>
            <div className={styles.auroraStage}>
              <Aurora
                colorStops={["#ffa554", "#8a8578", "#ffa554"]}
                amplitude={1.0}
                blend={0.6}
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
