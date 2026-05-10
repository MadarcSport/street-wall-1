# Lighting and Tone Mapping Notes

## 1) Hemisphere Light

### What it is

A `HemisphereLight` is a soft, global fill light in Three.js.
It simulates light coming from two directions at once:

- `skyColor`: color from above
- `groundColor`: color from below

Unlike spot/point/directional lights, it does not create a focused beam and is mainly used to improve overall readability and natural shading.

### What we did in this project

We added a hemisphere light in `src/Scene.jsx`.
Current setup:

```jsx
<hemisphereLight args={["#cfe8ff", "#3a2f24", 0.6]} position={[0, 500, 0]} />
```

Meaning of this setup:

- Sky tint: `#cfe8ff` (cool top fill)
- Ground tint: `#3a2f24` (warm bounce from below)
- Intensity: `0.6` (moderate fill, not dominant)

In your scene, this light complements the existing `ambientLight`, `directionalLight`s, and `pointLight`.

---

## 2) Tone Mapping (ACES Filmic)

### What it is

Tone mapping converts HDR lighting values into a display-friendly image while preserving highlight detail and contrast.

`ACESFilmicToneMapping` is a common choice for more cinematic and realistic rendering, especially with HDR environments.

### What we did in this project

We configured the renderer in `src/App.jsx` through React Three Fiber `Canvas`:

```jsx
gl={{
  toneMapping: THREE.ACESFilmicToneMapping,
  toneMappingExposure: 1.1,
}}
```

Meaning of this setup:

- `toneMapping: THREE.ACESFilmicToneMapping`
  Uses ACES filmic response for smoother highlight roll-off and better color behavior under strong light.
- `toneMappingExposure: 1.1`
  Slightly brightens the final image globally.

This configuration works together with your HDR environment (`<Environment files="/studio2.hdr" />`) and other scene lights.

---

## Quick summary of current project lighting pipeline

- HDR environment from Drei `Environment` in `src/Scene.jsx`
- Hemisphere fill light for sky/ground balance
- Ambient + directional + point lights for shape and highlights
- ACES filmic tone mapping in `src/App.jsx` for final display output
