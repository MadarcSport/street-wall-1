import React, { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF, OrbitControls, Environment } from "@react-three/drei";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import * as THREE from "three";

// onModelClick is called when the model is clicked, allowing App to show a message
export default function Scene({
  rotLeft,
  rotRight,
  onModelClick,
  envIntensity = 1,
  sceneBrightness = 1,
  lowTierDevice = false,
}) {
  const group = useRef();
  const desktopLightScale = THREE.MathUtils.lerp(
    0.4,
    1.6,
    THREE.MathUtils.clamp(envIntensity / 3, 0, 1),
  );
  const dragState = useRef({
    isDragging: false,
    pointerId: null,
    lastX: 0,
    lastY: 0,
  });
  const { gl } = useThree();
  const gltf = useGLTF("/wallStreet1.glb", (loader) => {
    const draco = new DRACOLoader();
    draco.setDecoderPath("/draco/");
    loader.setDRACOLoader(draco);
  });

  useEffect(() => {
    if (gltf && gltf.scene) {
      // Compute bounding box and center the model so it's easier to see
      const box = new THREE.Box3().setFromObject(gltf.scene);
      const center = box.getCenter(new THREE.Vector3());
      // Shift the model so its center is at the group's origin
      gltf.scene.position.x -= center.x;
      gltf.scene.position.y -= center.y;
      gltf.scene.position.z -= center.z;
    }
  }, [gltf]);

  useEffect(() => {
    const canvas = gl.domElement;
    const previousTouchAction = canvas.style.touchAction;
    canvas.style.touchAction = "none";

    const handlePointerDown = (event) => {
      if (event.button !== 0) return;

      dragState.current.isDragging = true;
      dragState.current.pointerId = event.pointerId;
      dragState.current.lastX = event.clientX;
      dragState.current.lastY = event.clientY;
      canvas.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event) => {
      if (!dragState.current.isDragging) return;
      if (dragState.current.pointerId !== event.pointerId) return;
      if (!gltf?.scene) return;

      const deltaX = event.clientX - dragState.current.lastX;
      const deltaY = event.clientY - dragState.current.lastY;
      gltf.scene.rotation.y += deltaX * 0.01;
      gltf.scene.rotation.x += deltaY * 0.01;
      dragState.current.lastX = event.clientX;
      dragState.current.lastY = event.clientY;
    };

    const stopDragging = (event) => {
      if (dragState.current.pointerId !== event.pointerId) return;

      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }

      dragState.current.isDragging = false;
      dragState.current.pointerId = null;
    };

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", stopDragging);
    canvas.addEventListener("pointercancel", stopDragging);
    canvas.addEventListener("pointerleave", stopDragging);

    return () => {
      canvas.style.touchAction = previousTouchAction;
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerup", stopDragging);
      canvas.removeEventListener("pointercancel", stopDragging);
      canvas.removeEventListener("pointerleave", stopDragging);
    };
  }, [gl, gltf]);

  // Refresh texture/material flags once after model load.
  useEffect(() => {
    if (gltf && gltf.scene) {
      const maxAnisotropy = gl.capabilities.getMaxAnisotropy();
      const anisotropy = lowTierDevice
        ? Math.min(4, maxAnisotropy)
        : Math.min(8, maxAnisotropy);

      const configureTexture = (texture, colorTexture = false) => {
        if (!texture) return;
        if (colorTexture) texture.colorSpace = THREE.SRGBColorSpace;
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.anisotropy = anisotropy;
        texture.needsUpdate = true;
      };

      gltf.scene.traverse((child) => {
        if (child.isMesh) {
          try {
            const mat = child.material;
            if (mat) {
              const materials = Array.isArray(mat) ? mat : [mat];

              materials.forEach((material) => {
                configureTexture(material.map, true);
                configureTexture(material.normalMap);
                configureTexture(material.roughnessMap);
                configureTexture(material.metalnessMap);
                configureTexture(material.aoMap);

                if (material.normalScale) {
                  const normalStrength = lowTierDevice ? 0.35 : 0.7;
                  material.normalScale.set(normalStrength, normalStrength);
                }

                material.needsUpdate = true;
              });
            }
          } catch (e) {
            // Ignore per-material refresh errors to keep rendering alive.
          }
        }
      });
    }
  }, [gltf, gl, lowTierDevice]);

  // Lighting setup similar to original
  useFrame(() => {
    if (gltf && gltf.scene) {
      const model = gltf.scene;
      if (rotLeft) model.rotation.y -= 0.02;
      if (rotRight) model.rotation.y += 0.02;
    }
  });

  // Control how strongly the HDR environment affects reflective/PBR materials.
  useEffect(() => {
    if (!gltf?.scene) return;

    gltf.scene.traverse((child) => {
      if (!child.isMesh || !child.material) return;

      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];

      materials.forEach((mat) => {
        if ("envMapIntensity" in mat) {
          mat.envMapIntensity = lowTierDevice
            ? Math.min(Math.max(envIntensity, 1.35) * sceneBrightness, 3)
            : envIntensity;
          mat.needsUpdate = true;
        }
      });
    });
  }, [gltf, envIntensity, lowTierDevice, sceneBrightness]);

  return (
    <>
      <Environment files="/studio2.hdr" resolution={lowTierDevice ? 16 : 64} />
      {/* <Environment files="/rosendal.hdr" /> */}
      <hemisphereLight
        args={["#cfe8ff", "#ffffff", 0]}
        position={[100, 300, 100]}
      />
      <ambientLight
        intensity={
          lowTierDevice ? 0.85 * sceneBrightness : 0.65 * desktopLightScale
        }
      />
      <directionalLight
        position={[-50, -100, 100]}
        intensity={
          lowTierDevice ? 34 * sceneBrightness : 20 * desktopLightScale
        }
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      {!lowTierDevice ? (
        <>
          <directionalLight
            position={[-500, -400, 300]}
            intensity={400 * desktopLightScale}
          />
          <directionalLight
            position={[-50, 200, -30]}
            intensity={300 * desktopLightScale}
          />
          <pointLight
            position={[300, -300, 300]}
            intensity={300 * desktopLightScale}
          />
        </>
      ) : (
        <pointLight
          position={[300, -300, 300]}
          intensity={450 * sceneBrightness}
        />
      )}

      <group ref={group} position={[0, 0, 0]} scale={[1, 1, 1]}>
        {gltf && gltf.scene ? (
          <primitive
            object={gltf.scene}
            onClick={(event) => {
              event.stopPropagation();
              if (onModelClick) onModelClick();
            }}
          />
        ) : null}
        {!lowTierDevice ? <axesHelper args={[0.5]} /> : null}
      </group>

      {/* Keep camera locked; model rotation is handled by buttons and pointer dragging. */}
      <OrbitControls
        makeDefault
        enableZoom={false}
        enableRotate={false}
        enablePan={false}
        enableKeys={false}
      />

      {/* ground plane removed per user request */}

      {/* ground plane removed per user request */}
    </>
  );
}

useGLTF.preload("/wallStreet1.glb");
