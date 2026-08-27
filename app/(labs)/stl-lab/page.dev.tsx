"use client";

/**
 * Spike: render a low-poly .stl model in the browser via three.js +
 * @react-three/fiber + @react-three/drei (OrbitControls). Not wired into any
 * real page — see PIXEL_CHAT.md-style lab precedent at ../effects-lab.
 *
 * The Canvas/three.js scene lives in ./Scene.tsx and is loaded with
 * `next/dynamic({ ssr: false })` here rather than imported directly: three.js
 * needs a real DOM/WebGL context, which doesn't exist during Next's server
 * render, so importing it eagerly would throw or hydrate-mismatch. Per the
 * Next.js docs (node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md),
 * `ssr: false` on `next/dynamic` must be called from a Client Component, hence
 * the "use client" here rather than on a Server Component wrapper.
 */

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import dynamic from "next/dynamic";
import lab from "../lab.module.css";
import styles from "./page.module.css";

const StlLabScene = dynamic(() => import("./Scene"), {
  ssr: false,
  loading: () => <div className={styles.loading}>Loading scene…</div>,
});

/** Procedurally generated in scripts/generate-test-stl.mjs — see Scene.tsx. */
const DEFAULT_MODEL_URL = "/stl-lab/icosahedron.stl";
const DEFAULT_MODEL_LABEL = "procedurally generated icosahedron (no downloaded asset)";

export default function StlLab() {
  const [modelUrl, setModelUrl] = useState(DEFAULT_MODEL_URL);
  const [modelLabel, setModelLabel] = useState(DEFAULT_MODEL_LABEL);
  // Tracks the blob URL from the last uploaded file so it can be revoked —
  // either when a new file replaces it or the page unmounts — instead of
  // leaking it for the life of the tab.
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow re-selecting the same file twice in a row
    if (!file) return;

    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);

    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setModelUrl(url);
    setModelLabel(file.name);
  }, []);

  return (
    <main className={lab.page}>
      <header className={lab.header}>
        <h1>STL viewer</h1>
        <p className={lab.subheading}>
          three.js + @react-three/fiber + drei OrbitControls · {modelLabel} · not
          wired into any real page
        </p>
        <label className={styles.upload}>
          Load .stl
          <input
            type="file"
            accept=".stl"
            className={styles.uploadInput}
            onChange={handleFileChange}
          />
        </label>
      </header>

      <section className={lab.section}>
        <div className={styles.stage}>
          <StlLabScene modelUrl={modelUrl} />
        </div>
      </section>
    </main>
  );
}
