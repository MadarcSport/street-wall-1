import React, { useState, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import Scene from "./Scene";

export default function App() {
  const [rotLeft, setRotLeft] = useState(false);
  const [rotRight, setRotRight] = useState(false);
  const [showClickText, setShowClickText] = useState(false);
  const [envIntensity, setEnvIntensity] = useState(1);
  const [contextLost, setContextLost] = useState(false);

  return (
    <div className="app-root">
      <Canvas
        dpr={[1, 1.5]}
        shadows={false}
        performance={{ min: 0.6 }}
        gl={{
          antialias: false,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
        }}
        onCreated={({ gl }) => {
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
        camera={{ position: [1, 0.8, 15], fov: 45 }}
        style={{ width: "80vw", height: "60vh" }}
      >
        <Suspense fallback={null}>
          <Scene
            rotLeft={rotLeft}
            rotRight={rotRight}
            envIntensity={envIntensity}
            onModelClick={() => setShowClickText(true)}
          />
        </Suspense>
      </Canvas>

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
      </div>

      {/* Show click message if the model was clicked */}
      {showClickText ? <p className="click-message">Stay strong can.</p> : null}

      {contextLost ? (
        <p className="click-message">
          WebGL context lost. Please reload the page.
        </p>
      ) : null}
    </div>
  );
}
