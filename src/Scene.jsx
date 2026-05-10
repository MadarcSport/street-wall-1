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
}) {
  const group = useRef();
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
    console.log("useGLTF result:", gltf);
  }, [gltf]);

  // Log images referenced in the glTF JSON (helps identify external texture URIs)
  useEffect(() => {
    try {
      const imgs = gltf?.parser?.json?.images;
      if (imgs && imgs.length) {
        console.log(
          "gltf referenced images:",
          imgs.map((i) => i.uri || i.mimeType || i.bufferView || i),
        );
      }
    } catch (e) {
      // ignore
    }
  }, [gltf]);

  // Inspect materials and texture sources to diagnose missing textures
  useEffect(() => {
    if (gltf && gltf.scene) {
      gltf.scene.traverse((child) => {
        if (child.isMesh) {
          const mat = child.material;
          const info = {
            materialType: mat?.type,
            hasMap: !!mat?.map,
            mapImageSrc:
              mat?.map?.image?.src || mat?.map?.image?.currentSrc || null,
            color: mat?.color ? `#${mat.color.getHexString()}` : null,
          };
          console.log("material info:", child.name, info);
        }
      });
    }
  }, [gltf]);

  useEffect(() => {
    if (gltf && gltf.scene) {
      // Compute bounding box and center the model so it's easier to see
      const box = new THREE.Box3().setFromObject(gltf.scene);
      const center = box.getCenter(new THREE.Vector3());
      // Shift the model so its center is at the group's origin
      gltf.scene.position.x -= center.x;
      gltf.scene.position.y -= center.y;
      gltf.scene.position.z -= center.z;
      console.log("gltf boundingBox:", box, "center:", center);
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

  // Debug: log mesh info and refresh any existing texture maps (don't overwrite materials)
  useEffect(() => {
    if (gltf && gltf.scene) {
      gltf.scene.traverse((child) => {
        if (child.isMesh) {
          console.log("mesh:", child.name, {
            visible: child.visible,
            geometry: !!child.geometry,
            material: child.material && child.material.type,
          });
          try {
            const mat = child.material;
            if (mat && mat.map) {
              // ensure color textures are interpreted correctly
              mat.map.colorSpace = THREE.SRGBColorSpace;
              mat.map.needsUpdate = true;
            }
            if (mat) mat.needsUpdate = true;
            child.castShadow = true;
            child.receiveShadow = true;
          } catch (e) {
            console.warn("failed to refresh material for", child.name, e);
          }
        }
      });
    }
  }, [gltf]);

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
          mat.envMapIntensity = envIntensity;
          mat.needsUpdate = true;
        }
      });
    });
  }, [gltf, envIntensity]);

  return (
    <>
      <Environment files="/studio2.hdr" />
      {/* <Environment files="/rosendal.hdr" /> */}
      <hemisphereLight
        args={["#cfe8ff", "#3a2f24", 0.6]}
        position={[0, 500, 0]}
      />
      <ambientLight intensity={0.8} />
      <directionalLight
        position={[50, 100, 100]}
        intensity={50}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-500, -400, 300]} intensity={40} />
      <directionalLight position={[0, 20, -80]} intensity={40} />
      <pointLight position={[300, 100, 300]} intensity={80} />

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
        <axesHelper args={[0.5]} />
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
