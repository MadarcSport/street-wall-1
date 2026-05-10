import React, { useMemo, useState, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import Scene from "./Scene";
import ProductCard, { citrusMatchaTea } from "./List1";

export default function App() {
  const [rotLeft, setRotLeft] = useState(false);
  const [rotRight, setRotRight] = useState(false);
  const [showClickText, setShowClickText] = useState(false);
  const [envIntensity, setEnvIntensity] = useState(1);
  const [mobileBrightness, setMobileBrightness] = useState(1.1);
  const [contextLost, setContextLost] = useState(false);

  const lowTierDevice = useMemo(() => {
    if (typeof navigator === "undefined") return false;

    const mem = navigator.deviceMemory ?? 8;
    const cores = navigator.hardwareConcurrency ?? 8;
    const isMobileUA = /Android|iPhone|iPad|iPod|Mobile/i.test(
      navigator.userAgent,
    );

    return mem <= 4 || cores <= 4 || isMobileUA;
  }, []);

  const cameraConfig = useMemo(
    () =>
      lowTierDevice
        ? { position: [1, 6, 20], fov: 52 }
        : { position: [1, 0.8, 15], fov: 45 },
    [lowTierDevice],
  );

  return (
    <div className="app-root">
      <Canvas
        // Cap DPR at 2 to keep it sharp without killing the GPU
        dpr={lowTierDevice ? [1, 1.5] : [1, 2]}
        // Keep antialias true unless you are using Post-Processing
        gl={{
          antialias: !lowTierDevice,
          alpha: false,
          stencil: false,
          depth: true,
          powerPreference: lowTierDevice ? "low-power" : "high-performance",
          // ACESFilmic is standard for a "modern" look
          toneMapping: THREE.ACESFilmicToneMapping,
        }}
        // Use 'demand' frameloop if the scene isn't constantly moving to save battery
        frameloop={lowTierDevice ? "always" : "always"}
        performance={{ min: 0.5 }}
        onCreated={({ gl }) => {
          gl.setClearColor("#f0f0f0");

          const onContextLost = (event) => {
            event.preventDefault();
            setContextLost(true);
          };

          const onContextRestored = () => {
            setContextLost(false);
          };

          gl.domElement.addEventListener(
            "webglcontextlost",
            onContextLost,
            false,
          );
          gl.domElement.addEventListener(
            "webglcontextrestored",
            onContextRestored,
            false,
          );
        }}
        camera={cameraConfig}
        style={{ width: "80vw", height: "60vh" }}
      >
        <Suspense fallback={null}>
          <Scene
            rotLeft={rotLeft}
            rotRight={rotRight}
            envIntensity={envIntensity}
            sceneBrightness={mobileBrightness}
            lowTierDevice={lowTierDevice}
            onModelClick={() => setShowClickText(true)}
          />
        </Suspense>
      </Canvas>

      {/* <section className="list-section">
        <ProductCard product={citrusMatchaTea} />
      </section> */}

      <div className="controls">
        <button
          onMouseDown={() => setRotLeft(true)}
          onMouseUp={() => setRotLeft(false)}
          onMouseLeave={() => setRotLeft(false)}
        >
          Rotate Left
        </button>
        <button
          onMouseDown={() => setRotRight(true)}
          onMouseUp={() => setRotRight(false)}
          onMouseLeave={() => setRotRight(false)}
        >
          Rotate Right
        </button>
        {!lowTierDevice ? (
          <label className="env-control">
            Environment: {envIntensity.toFixed(2)}
            <input
              type="range"
              min="0"
              max="3"
              step="0.05"
              value={envIntensity}
              onChange={(event) => setEnvIntensity(Number(event.target.value))}
            />
          </label>
        ) : (
          <label className="env-control">
            Brightness: {mobileBrightness.toFixed(2)}
            <input
              type="range"
              min="0.8"
              max="2.2"
              step="0.05"
              value={mobileBrightness}
              onChange={(event) =>
                setMobileBrightness(Number(event.target.value))
              }
            />
          </label>
        )}
      </div>

      {/* Show click message if the model was clicked */}
      {showClickText ? <p className="click-message">Stay strong can.</p> : null}
      <section className="list-section">
        <ProductCard product={citrusMatchaTea} />
      </section>

      {contextLost ? (
        <p className="click-message">
          WebGL context lost. Please reload the page.
        </p>
      ) : null}
    </div>
  );
}
