# Animation Conventions (R3F)

## Two Categories of Animation

### 1. Absolute-Time Animations

Use `clock.elapsedTime` for cyclic/deterministic motion such as orbits, rotations,
and wave patterns. These produce identical results regardless of frame rate.

```tsx
// CORRECT — orbit position derived from elapsed time
useFrame(({ clock }) => {
  const t = clock.elapsedTime;
  meshRef.current.position.x = Math.cos(t * orbitSpeed) * radius;
  meshRef.current.position.z = Math.sin(t * orbitSpeed) * radius;
});
```

### 2. Incremental Animations

For accumulative changes (fading, scaling, velocity), **always multiply by `delta`**
to ensure frame-rate independence.

```tsx
// CORRECT — delta-scaled increment
useFrame((_, delta) => {
  meshRef.current.rotation.y += rotationSpeed * delta;
  opacity.current = Math.min(1, opacity.current + fadeSpeed * delta);
});

// WRONG — frame-rate dependent, runs 2x faster at 120fps vs 60fps
useFrame(() => {
  meshRef.current.rotation.y += 0.01; // BAD: no delta
});
```

## State Management in useFrame

Never use `useState` for values updated every frame. React re-renders are expensive
and unnecessary for visual-only mutations.

```tsx
// CORRECT — useRef + direct mutation
const scaleRef = useRef(1);
useFrame((_, delta) => {
  scaleRef.current += growthRate * delta;
  meshRef.current.scale.setScalar(scaleRef.current);
});

// WRONG — triggers React re-render every frame
const [scale, setScale] = useState(1);
useFrame((_, delta) => {
  setScale((s) => s + growthRate * delta); // BAD: re-render per frame
});
```

## Camera Transitions

Use GSAP for smooth camera fly-to animations. Reference `useCameraFlyTo.ts` for the
shared hook that handles eased transitions between scene points.

GSAP timeline → animate camera `position` and `lookAt` target simultaneously.
Always kill the tween in the cleanup return to prevent stale animations.

## Checklist

- [ ] Every `useFrame` increment multiplied by `delta`?
- [ ] Orbits/cycles use `clock.elapsedTime`, not accumulated values?
- [ ] No `useState` inside `useFrame`?
- [ ] Camera transitions use GSAP via `useCameraFlyTo`?
