# Mobile and Desktop Camera Setup

This example shows how to use a different `Canvas` camera for low-tier/mobile devices while keeping desktop settings unchanged.

## 1. Detect low-tier/mobile device

```jsx
const lowTierDevice = useMemo(() => {
  if (typeof navigator === "undefined") return false;

  const mem = navigator.deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency ?? 8;
  const isMobileUA = /Android|iPhone|iPad|iPod|Mobile/i.test(
    navigator.userAgent,
  );

  return mem <= 4 || cores <= 4 || isMobileUA;
}, []);
```

## 2. Create camera config per device tier

```jsx
const cameraConfig = useMemo(
  () =>
    lowTierDevice
      ? { position: [1, 0.9, 22], fov: 52 }
      : { position: [1, 0.8, 15], fov: 45 },
  [lowTierDevice],
);
```

## 3. Pass it to React Three Fiber `Canvas`

```jsx
<Canvas camera={cameraConfig}>
  <Scene lowTierDevice={lowTierDevice} />
</Canvas>
```

## What to tune

- Increase mobile `position[2]` (`z`) to move camera farther away.
- Increase mobile `position[1]` (`y`) to look from slightly higher.
- Increase mobile `fov` to show more of the model in frame.

## Suggested starting values

- Balanced mobile: `position: [1, 0.9, 22], fov: 52`
- Farther mobile: `position: [1, 1.1, 24], fov: 50`
- Wider mobile view: `position: [1, 0.9, 22], fov: 56`

## Tip

If mobile still feels too close, adjust one variable at a time in this order:

1. `z` distance
2. `fov`
3. `y` height
