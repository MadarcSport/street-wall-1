# Reduced GPU Load Process (WebGL Context Lost Mitigation)

This note explains exactly what was changed to reduce GPU pressure and why those changes help prevent:

`THREE.WebGLRenderer: Context Lost.`

The target was Vercel-hosted runtime behavior on devices/browsers where GPU memory is limited.

## 1) Problem Summary

Observed behavior:

- Scene appears briefly, then disappears.
- Console logs WebGL context loss.

Why this commonly happens in Three.js / React Three Fiber:

- GPU memory spikes (high DPR + antialiasing + heavy HDR + shadows + large textures).
- Device/browser kills the context to recover memory.
- Without handling context-loss events, the user sees a blank or broken scene with no fallback message.

## 2) Strategy Used

The approach combined two tracks:

- Lower rendering cost so context loss is less likely.
- Handle context-loss events so failure is visible and recoverable.

Files touched:

- `src/App.jsx`
- `src/Scene.jsx`

## 3) Renderer-Level Reductions (`src/App.jsx`)

### A) Cap Device Pixel Ratio

Change:

- `dpr={[1, 1.5]}`

Why it helps:

- On high-DPI screens (mobile/retina), unconstrained DPR can exceed 2 or 3.
- Framebuffer size scales with DPR squared, so memory usage grows fast.
- Capping DPR significantly lowers render target memory and fill-rate cost.

Tradeoff:

- Slightly less sharp image on some displays.
- Usually a very good tradeoff for stability.

### B) Disable Dynamic Shadow Pipeline

Change:

- `shadows={false}`

Why it helps:

- Real-time shadows allocate additional GPU textures (shadow maps) and require extra rendering passes.
- Turning shadows off removes a large GPU cost, especially on weaker devices.

Tradeoff:

- Less realistic contact/depth look.

### C) Disable Antialiasing

Change in `gl` config:

- `antialias: false`

Why it helps:

- MSAA increases GPU memory and bandwidth usage.
- Disabling it is a common stability optimization on low-memory devices.

Tradeoff:

- Jagged edges may be more visible.

### D) Keep Tone Mapping, But With Controlled Exposure

Current config:

- `toneMapping: THREE.ACESFilmicToneMapping`
- `toneMappingExposure: 1.1`

Why it matters:

- This was not removed because it is mostly a visual post adjustment and not the biggest memory culprit compared to shadows + high DPR + HDR complexity.

### E) Add R3F Performance Guard

Change:

- `performance={{ min: 0.6 }}`

Why it helps:

- Lets React Three Fiber adapt under pressure.
- Helps avoid hard stalls by reducing workload dynamically when frame budget drops.

### F) Prefer Performance GPU Mode

Change in `gl` config:

- `powerPreference: "high-performance"`

Why it helps:

- Hints browser/GPU selection toward performance mode.
- Can improve stability on dual-GPU or constrained integrated setups.

Note:

- It is a hint, not a guarantee.

## 4) Context Loss Handling (`src/App.jsx`)

### A) Listen for WebGL Context Events

Change in `onCreated` callback:

- Added `webglcontextlost` listener.
- Added `webglcontextrestored` listener.

Behavior:

- On context lost: `event.preventDefault()` and set UI state (`contextLost = true`).
- On context restored: clear UI state (`contextLost = false`).

Why this helps:

- Prevents silent failure.
- Gives user clear feedback instead of a disappearing scene with no explanation.

### B) Show User-Facing Fallback Message

Change:

- Render conditional message:
  - `WebGL context lost. Please reload the page.`

Why it helps:

- Improves UX and debugging in production.
- Makes issue obvious during deployment validation.

## 5) Scene-Level Lighting/HDR Cost Reductions (`src/Scene.jsx`)

### A) Lower Environment Map Processing Cost

Change:

- `<Environment files="/studio2.hdr" resolution={128} />`

Why it helps:

- Environment maps can be expensive (especially for PBR reflections).
- Reducing resolution lowers texture memory and sampling overhead.

Tradeoff:

- Reflection detail is softer.

### B) Reduce Extreme Light Intensities to Reasonable Values

Changes:

- Hemisphere intensity reduced (`0.45`).
- Ambient intensity reduced (`0.65`).
- Directional and point light intensities reduced from very large values to small physically reasonable numbers (`2.2`, `0.8`, `0.6`, `1.2`).

Why it helps:

- Very high light values can force extreme exposure balancing and unstable visual behavior.
- Lower values make shading more predictable and can reduce stress in certain post/tonemap conditions.

### C) Lower Shadow Map Size on Main Directional Light

Change kept in code:

- `shadow-mapSize-width={1024}`
- `shadow-mapSize-height={1024}`

Why this still matters even with `shadows={false}`:

- If shadows are re-enabled later, a safer default is already set.
- Prevents accidentally returning to 2048+ maps, which are costly.

## 6) What Was NOT Changed (Intentionally)

- Model loading flow (`useGLTF`, DRACO decode path) was kept.
- Camera and interaction model were kept.
- Existing debug logs were kept for now to support diagnostics.

Potential future cleanup:

- Remove verbose console logs in production.
- Add device-tier profile switching (high/medium/low quality).

## 7) Validation Performed

Build check executed:

- `npm run build`

Result:

- Production build completed successfully.
- No lint/type errors were reported for the changed files.

## 8) Recommended Next Tuning Steps

If context loss still appears on some devices, apply these in order:

1. Lower DPR cap further:

- From `dpr={[1, 1.5]}` to `dpr={[1, 1.25]}` or fixed `dpr={1}`.

2. Reduce HDR cost further:

- Drop Environment resolution to `64`.
- Or disable `<Environment />` on low-end devices.

3. Reduce model/material pressure:

- Compress textures more aggressively.
- Use fewer high-resolution maps.

4. Add quality profile toggles:

- Auto-select quality preset based on device memory/FPS.

5. Add a recovery UX:

- Button to force rerender/reinitialize the Canvas after context restoration.

## 9) Quick Reference of Current Stabilizers

Current stabilizers in project:

- `Canvas dpr={[1, 1.5]}`
- `shadows={false}`
- `gl.antialias = false`
- `gl.powerPreference = "high-performance"`
- R3F `performance={{ min: 0.6 }}`
- `webglcontextlost` + `webglcontextrestored` handlers
- `Environment resolution={128}`
- Reduced light intensities

This combination is a practical baseline for deployment stability on mixed device classes.
