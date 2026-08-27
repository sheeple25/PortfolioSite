"use client";

/**
 * The actual react-three-fiber scene. Kept in its own module, separate from
 * page.tsx, so page.tsx can `next/dynamic` it with `ssr: false` — three.js
 * touches WebGL/canvas APIs that don't exist during server rendering, and
 * @react-three/fiber's Canvas assumes a browser environment on mount.
 */

import { Suspense, useRef, type ElementRef } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { Bounds, GizmoHelper, GizmoViewport, OrbitControls } from "@react-three/drei";
import { Vector3 } from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";

function StlModel({ url }: { url: string }) {
  const geometry = useLoader(STLLoader, url);
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="#ffa554" flatShading />
    </mesh>
  );
}

export default function StlLabScene({ modelUrl }: { modelUrl: string }) {
  // GizmoHelper drives the same camera OrbitControls does (clicking an axis
  // tweens the camera to face it) and needs to orbit around whatever point
  // OrbitControls is currently targeting — `onUpdate`/`onTarget` read/sync
  // through this ref rather than duplicating that state.
  const controlsRef = useRef<ElementRef<typeof OrbitControls>>(null);

  return (
    <Canvas camera={{ position: [40, 32, 40], fov: 45 }}>
      <color attach="background" args={["#1e1e1e"]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[30, 45, 20]} intensity={1.3} />
      <directionalLight position={[-25, -10, -20]} intensity={0.25} />
      <Suspense fallback={null}>
        {/*
         * Uploaded files can be any scale (a few mm to a few metres), unlike
         * the fixed-size icosahedron the camera position above was tuned
         * for. `Bounds` refits the camera to whatever geometry mounts —
         * `key={modelUrl}` forces StlModel to remount on a new file so a
         * failed load doesn't keep stale geometry on screen, and `observe`
         * makes Bounds re-fit off that remount.
         */}
        <Bounds fit clip observe margin={1.2}>
          <StlModel url={modelUrl} key={modelUrl} />
        </Bounds>
      </Suspense>
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.08}
        makeDefault
      />
      <GizmoHelper
        alignment="bottom-right"
        margin={[64, 64]}
        onUpdate={() => controlsRef.current?.update()}
        onTarget={() => controlsRef.current?.target ?? new Vector3()}
      >
        <GizmoViewport labelColor="#1e1e1e" axisHeadScale={0.9} />
      </GizmoHelper>
    </Canvas>
  );
}
